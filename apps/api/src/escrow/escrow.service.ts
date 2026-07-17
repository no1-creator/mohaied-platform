import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { EscrowStatus, InvoiceType, InvoiceStatus } from '@prisma/client';

@Injectable()
export class EscrowService {
  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
    private subscriptionsService: SubscriptionsService,
  ) {}

  // نحدد نسبة العمولة: باقة مقدّم الخدمة لو مشترك، وإلا العمولة الافتراضية
  private async resolveCommissionRate(
    providerId?: string | null,
  ): Promise<number> {
    const settings = await this.settingsService.get();
    const defaultRate = Number(settings.defaultCommissionRate);
    if (!providerId) return defaultRate;

    const sub = await this.subscriptionsService.mine(providerId);
    if (sub?.plan) return Number(sub.plan.commissionRate);
    return defaultRate;
  }

  // العميل يموّل مرحلة (الفلوس تتحجز في الضمان)
  async fund(clientId: string, milestoneId: string) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: { project: true, escrow: true },
    });
    if (!milestone) throw new NotFoundException('المرحلة غير موجودة');
    if (milestone.project.clientId !== clientId) {
      throw new ForbiddenException('لست صاحب هذا المشروع');
    }
    if (milestone.escrow) {
      throw new ConflictException('تم تمويل هذه المرحلة بالفعل');
    }

    const settings = await this.settingsService.get();
    if (!settings.escrowEnabled) {
      throw new BadRequestException('نظام الضمان معطّل حاليًا');
    }

    const amount = Number(milestone.value);
    const commissionRate = await this.resolveCommissionRate(
      milestone.project.providerId,
    );
    const commissionAmount = Math.round(amount * commissionRate) / 100;
    const netAmount = Math.round((amount - commissionAmount) * 100) / 100;

    const escrow = await this.prisma.escrowTransaction.create({
      data: {
        milestoneId,
        projectId: milestone.projectId,
        amount,
        commissionRate,
        commissionAmount,
        netAmount,
        status: EscrowStatus.FUNDED,
        fundedAt: new Date(),
      },
    });

    // فاتورة تمويل المرحلة (تُدفع من العميل للضمان)
    await this.prisma.invoice.create({
      data: {
        code: this.genCode(),
        userId: clientId,
        type: InvoiceType.MILESTONE,
        status: InvoiceStatus.PAID,
        amount,
        description: `تمويل مرحلة: ${milestone.title}`,
        escrowId: escrow.id,
        paidAt: new Date(),
      },
    });

    await this.log(milestone.projectId, clientId, 'ESCROW_FUNDED', {
      escrowId: escrow.id,
      milestoneId,
    });

    return escrow;
  }

  // تحرير الفلوس لمقدّم الخدمة (بعد الموافقة) — العميل أو الأدمن
  async release(userId: string, escrowId: string, isAdmin: boolean) {
    const escrow = await this.prisma.escrowTransaction.findUnique({
      where: { id: escrowId },
      include: { project: true, milestone: true },
    });
    if (!escrow) throw new NotFoundException('معاملة الضمان غير موجودة');
    if (!isAdmin && escrow.project.clientId !== userId) {
      throw new ForbiddenException('لا تملك صلاحية تحرير هذا المبلغ');
    }
    if (escrow.status !== EscrowStatus.FUNDED) {
      throw new BadRequestException('لا يمكن التحرير إلا لمبلغ مموّل');
    }

    const updated = await this.prisma.escrowTransaction.update({
      where: { id: escrowId },
      data: { status: EscrowStatus.RELEASED, releasedAt: new Date() },
    });

    // فاتورة عمولة المنصة
    await this.prisma.invoice.create({
      data: {
        code: this.genCode(),
        userId: escrow.project.clientId,
        type: InvoiceType.COMMISSION,
        status: InvoiceStatus.PAID,
        amount: escrow.commissionAmount,
        description: `عمولة المنصة على مرحلة: ${escrow.milestone.title}`,
        escrowId: escrow.id,
        paidAt: new Date(),
      },
    });

    await this.log(escrow.projectId, userId, 'ESCROW_RELEASED', { escrowId });
    return updated;
  }

  // فتح نزاع (تجميد) — العميل أو مقدّم الخدمة أو الأدمن
  async dispute(userId: string, escrowId: string, isAdmin: boolean) {
    const escrow = await this.prisma.escrowTransaction.findUnique({
      where: { id: escrowId },
      include: { project: true },
    });
    if (!escrow) throw new NotFoundException('معاملة الضمان غير موجودة');

    const allowed =
      isAdmin ||
      escrow.project.clientId === userId ||
      escrow.project.providerId === userId;
    if (!allowed) throw new ForbiddenException('لا تملك صلاحية');

    if (escrow.status !== EscrowStatus.FUNDED) {
      throw new BadRequestException('لا يمكن فتح نزاع إلا على مبلغ مموّل');
    }

    const updated = await this.prisma.escrowTransaction.update({
      where: { id: escrowId },
      data: { status: EscrowStatus.DISPUTED },
    });

    await this.log(escrow.projectId, userId, 'ESCROW_DISPUTED', { escrowId });
    return updated;
  }

  // استرجاع المبلغ للعميل — الأدمن فقط
  async refund(userId: string, escrowId: string) {
    const escrow = await this.prisma.escrowTransaction.findUnique({
      where: { id: escrowId },
    });
    if (!escrow) throw new NotFoundException('معاملة الضمان غير موجودة');
    if (
      escrow.status !== EscrowStatus.FUNDED &&
      escrow.status !== EscrowStatus.DISPUTED
    ) {
      throw new BadRequestException('لا يمكن استرجاع هذا المبلغ');
    }

    const updated = await this.prisma.escrowTransaction.update({
      where: { id: escrowId },
      data: { status: EscrowStatus.REFUNDED, refundedAt: new Date() },
    });

    await this.log(escrow.projectId, userId, 'ESCROW_REFUNDED', { escrowId });
    return updated;
  }

  // معاملات الضمان لمشروع (العميل/مقدّم الخدمة/الأدمن)
  async listForProject(projectId: string, userId: string, isAdmin: boolean) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException('المشروع غير موجود');
    if (
      !isAdmin &&
      project.clientId !== userId &&
      project.providerId !== userId
    ) {
      throw new ForbiddenException('لا تملك صلاحية عرض هذا المشروع');
    }

    return this.prisma.escrowTransaction.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        milestone: { select: { id: true, title: true, status: true } },
      },
    });
  }

  private log(
    projectId: string,
    actorId: string,
    action: string,
    metadata: Record<string, unknown>,
  ) {
    return this.prisma.activityLog.create({
      data: { projectId, actorId, action, metadata },
    });
  }

  private genCode() {
    return (
      'INV-' +
      Date.now().toString(36).toUpperCase() +
      Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0')
    );
  }
}
