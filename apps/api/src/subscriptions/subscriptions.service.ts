import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  BillingCycle,
  SubscriptionStatus,
  InvoiceType,
  InvoiceStatus,
} from '@prisma/client';
import { CreatePlanDto, UpdatePlanDto, SubscribeDto } from './dto/subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  // ---------- الباقات ----------

  // الباقات المفعّلة (لأي مستخدم مسجّل)
  listActivePlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: 'asc' },
    });
  }

  // كل الباقات (للأدمن)
  listAllPlans() {
    return this.prisma.subscriptionPlan.findMany({
      orderBy: { orderIndex: 'asc' },
    });
  }

  createPlan(dto: CreatePlanDto) {
    return this.prisma.subscriptionPlan.create({ data: dto });
  }

  async updatePlan(id: string, dto: UpdatePlanDto) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('الباقة غير موجودة');
    return this.prisma.subscriptionPlan.update({ where: { id }, data: dto });
  }

  async deletePlan(id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('الباقة غير موجودة');

    // لو فيه اشتراكات مرتبطة بالباقة، نعطّلها بدل الحذف (حفاظًا على السجلات)
    const linked = await this.prisma.subscription.count({ where: { planId: id } });
    if (linked > 0) {
      return this.prisma.subscriptionPlan.update({
        where: { id },
        data: { isActive: false },
      });
    }
    return this.prisma.subscriptionPlan.delete({ where: { id } });
  }

  // ---------- اشتراك المستخدم ----------

  // الاشتراك الحالي الفعّال (أو null)
  mine(userId: string) {
    return this.prisma.subscription.findFirst({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      include: { plan: true },
    });
  }

  async subscribe(userId: string, dto: SubscribeDto) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: dto.planId },
    });
    if (!plan || !plan.isActive) {
      throw new BadRequestException('الباقة غير متاحة');
    }

    const now = new Date();
    const expires = new Date(now);
    if (plan.billingCycle === BillingCycle.YEARLY) {
      expires.setFullYear(expires.getFullYear() + 1);
    } else {
      expires.setMonth(expires.getMonth() + 1);
    }

    // نلغّي أي اشتراك قديم فعّال
    await this.prisma.subscription.updateMany({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      data: { status: SubscriptionStatus.CANCELLED },
    });

    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        planId: plan.id,
        status: SubscriptionStatus.ACTIVE,
        startedAt: now,
        expiresAt: expires,
      },
      include: { plan: true },
    });

    // فاتورة اشتراك (نسخة مبسطة — بوابة الدفع الفعلية تتضاف لاحقًا)
    await this.prisma.invoice.create({
      data: {
        code: this.genCode(),
        userId,
        type: InvoiceType.SUBSCRIPTION,
        status: InvoiceStatus.PAID,
        amount: plan.price,
        description: `اشتراك في باقة ${plan.name}`,
        subscriptionId: subscription.id,
        paidAt: now,
      },
    });

    return subscription;
  }

  private genCode() {
    return (
      'INV-' +
      Date.now().toString(36).toUpperCase() +
      Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    );
  }
}
