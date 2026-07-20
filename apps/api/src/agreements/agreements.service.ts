import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  OfferStatus,
  AgreementStatus,
  ProjectStatus,
  MilestoneStatus,
} from '@prisma/client';

@Injectable()
export class AgreementsService {
  constructor(private prisma: PrismaService) {}

  // العميل يقبل العرض -> ينشأ اتفاق + عقد إلكتروني + مراحل + يبدأ التنفيذ
  async acceptOffer(offerId: string, clientId: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        milestones: { orderBy: { orderIndex: 'asc' } },
        project: { include: { client: true } },
        provider: true,
      },
    });

    if (!offer) {
      throw new NotFoundException('العرض غير موجود');
    }
    if (offer.project.clientId !== clientId) {
      throw new ForbiddenException('ليس لديك صلاحية على هذا المشروع');
    }
    if (
      offer.status !== OfferStatus.SUBMITTED &&
      offer.status !== OfferStatus.REVISED
    ) {
      throw new BadRequestException('لا يمكن قبول هذا العرض في حالته الحالية');
    }

    // توليد رقم العقد ونصّه (قبل المعاملة — عملية حسابية بحتة)
    const contractNumber = `MOH-${new Date().getFullYear()}-${offer.id
      .slice(0, 8)
      .toUpperCase()}`;
    const contractBody = this.buildContractBody({
      contractNumber,
      projectTitle: offer.project.title,
      projectField: offer.project.field,
      clientName: offer.project.client?.fullName || 'العميل',
      providerName: offer.provider?.fullName || 'المنفّذ',
      totalValue: offer.totalPrice,
      durationDays: offer.durationDays,
      scope: offer.scope,
      milestones: offer.milestones,
    });

    return this.prisma.$transaction(async (tx) => {
      // 1) الاتفاق + العقد
      const agreement = await tx.agreement.create({
        data: {
          projectId: offer.projectId,
          offerId: offer.id,
          status: AgreementStatus.CONFIRMED,
          totalValue: offer.totalPrice,
          durationDays: offer.durationDays,
          clientApprovedAt: new Date(),
          providerApprovedAt: new Date(),
          confirmedAt: new Date(),
          contractNumber,
          contractBody,
        },
      });

      // 2) توليد مراحل المشروع من مراحل العرض
      await tx.milestone.createMany({
        data: offer.milestones.map((m, index) => ({
          projectId: offer.projectId,
          title: m.title,
          description: m.description,
          value: m.price,
          durationDays: m.durationDays,
          orderIndex: index,
          status:
            index === 0 ? MilestoneStatus.IN_PROGRESS : MilestoneStatus.PENDING,
        })),
      });

      // 3) قبول العرض ورفض باقي العروض
      await tx.offer.update({
        where: { id: offer.id },
        data: { status: OfferStatus.ACCEPTED },
      });
      await tx.offer.updateMany({
        where: {
          projectId: offer.projectId,
          id: { not: offer.id },
          status: { in: [OfferStatus.SUBMITTED, OfferStatus.REVISED] },
        },
        data: { status: OfferStatus.REJECTED },
      });

      // 4) تحديث المشروع
      await tx.project.update({
        where: { id: offer.projectId },
        data: {
          status: ProjectStatus.IN_PROGRESS,
          providerId: offer.providerId,
        },
      });

      // 5) تسجيل النشاط
      await tx.activityLog.create({
        data: {
          projectId: offer.projectId,
          actorId: clientId,
          action: 'AGREEMENT_CONFIRMED',
          metadata: { offerId: offer.id, agreementId: agreement.id },
        },
      });

      return agreement;
    });
  }

  // توقيع العقد إلكترونيًا (العميل أو المنفّذ)
  async signAgreement(agreementId: string, userId: string, rawName?: string) {
    const agreement = await this.prisma.agreement.findUnique({
      where: { id: agreementId },
      include: { project: true },
    });
    if (!agreement) {
      throw new NotFoundException('الاتفاق غير موجود');
    }

    const project = agreement.project;
    const isClient = project.clientId === userId;
    const isProvider = project.providerId === userId;
    if (!isClient && !isProvider) {
      throw new ForbiddenException('ليس لديك صلاحية لتوقيع هذا العقد');
    }
    if (isClient && agreement.clientSignedAt) {
      throw new BadRequestException('لقد وقّعت على هذا العقد بالفعل');
    }
    if (isProvider && agreement.providerSignedAt) {
      throw new BadRequestException('لقد وقّعت على هذا العقد بالفعل');
    }

    const signer = await this.prisma.user.findUnique({ where: { id: userId } });
    const signName =
      (rawName && rawName.trim()) || signer?.fullName || 'مستخدم';

    const signedAt = new Date();
    const roleLabel = isClient ? 'CLIENT' : 'PROVIDER';
    // بصمة رقمية تثبت وقت وهوية التوقيع
    const fingerprint = createHash('sha256')
      .update(
        `${agreement.contractNumber || agreement.id}|${roleLabel}|${signName}|${signedAt.toISOString()}|${userId}`,
      )
      .digest('hex');

    const data: Record<string, unknown> = {};
    if (isClient) {
      data.clientSignName = signName;
      data.clientSignedAt = signedAt;
      data.clientSignHash = fingerprint;
    } else {
      data.providerSignName = signName;
      data.providerSignedAt = signedAt;
      data.providerSignHash = fingerprint;
    }

    // هل اكتمل التوقيع من الطرفين؟
    const otherSigned = isClient
      ? agreement.providerSignedAt
      : agreement.clientSignedAt;
    if (otherSigned) {
      data.fullySignedAt = signedAt;
    }

    const updated = await this.prisma.agreement.update({
      where: { id: agreement.id },
      data,
    });

    await this.prisma.activityLog.create({
      data: {
        projectId: project.id,
        actorId: userId,
        action: 'CONTRACT_SIGNED',
        metadata: { agreementId: agreement.id, role: roleLabel, fingerprint },
      },
    });

    await this.prisma.message.create({
      data: {
        projectId: project.id,
        isSystem: true,
        content: `✍️ تم توقيع العقد إلكترونيًا من ${signName} (${
          isClient ? 'العميل' : 'المنفّذ'
        }).`,
      },
    });

    return updated;
  }

  async findForProject(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException('المشروع غير موجود');
    }
    if (project.clientId !== userId && project.providerId !== userId) {
      throw new ForbiddenException('ليس لديك صلاحية لعرض هذا الاتفاق');
    }

    const agreement = await this.prisma.agreement.findUnique({
      where: { projectId },
      include: {
        offer: {
          include: { milestones: { orderBy: { orderIndex: 'asc' } } },
        },
      },
    });

    if (!agreement) {
      throw new NotFoundException('لا يوجد اتفاق لهذا المشروع بعد');
    }

    return agreement;
  }

  // ---- توليد نصّ العقد الرسمي (جديد) ----
  private buildContractBody(input: {
    contractNumber: string;
    projectTitle: string;
    projectField: string;
    clientName: string;
    providerName: string;
    totalValue: unknown;
    durationDays: number;
    scope: string;
    milestones: Array<{
      title: string;
      description: string;
      price: unknown;
      durationDays: number;
    }>;
  }): string {
    const {
      contractNumber,
      projectTitle,
      projectField,
      clientName,
      providerName,
      totalValue,
      durationDays,
      scope,
      milestones,
    } = input;

    const today = new Date().toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const msLines =
      milestones
        .map(
          (m, i) =>
            `${i + 1}. ${m.title} — ${m.price} ج.م — ${m.durationDays} يوم\n   ${m.description}`,
        )
        .join('\n') || 'لا توجد مراحل محددة.';

    return [
      `عقد تنفيذ مشروع عبر منصة محايد`,
      `رقم العقد: ${contractNumber}`,
      `تاريخ التحرير: ${today}`,
      ``,
      `أطراف العقد:`,
      `• الطرف الأول (العميل / صاحب المشروع): ${clientName}`,
      `• الطرف الثاني (المنفّذ / مقدّم الخدمة): ${providerName}`,
      `• منصة محايد: طرف وسيط محايد لتوثيق التعامل وحفظ الحقوق.`,
      ``,
      `تمهيد:`,
      `أُبرم هذا العقد عبر منصة «محايد» الإلكترونية، وتُعدّ المنصة جهة توثيق محايدة تحفظ حقوق الطرفين وتوثّق سير العمل والمراسلات والمستندات والمدفوعات.`,
      ``,
      `البند الأول — موضوع العقد:`,
      `يلتزم الطرف الثاني بتنفيذ مشروع «${projectTitle}» في مجال «${projectField}» وفقًا للنطاق المتفق عليه أدناه.`,
      ``,
      `البند الثاني — نطاق العمل:`,
      scope,
      ``,
      `البند الثالث — المراحل والمستحقات:`,
      msLines,
      ``,
      `البند الرابع — القيمة الإجمالية والمدة:`,
      `• القيمة الإجمالية: ${totalValue} ج.م.`,
      `• مدة التنفيذ: ${durationDays} يوم من تاريخ بدء المرحلة الأولى.`,
      ``,
      `البند الخامس — الضمان والحيادية:`,
      `تُحتجز مستحقات كل مرحلة لدى منصة محايد (ضمان) ولا يُفرج عنها إلا بعد اعتماد التسليم، وذلك ضمانًا لحق الطرفين.`,
      ``,
      `البند السادس — حل النزاعات:`,
      `في حال وجود خلاف، يُحال الأمر إلى نظام الشكاوى والتحكيم داخل المنصة، ويكون قرار المحكّم المحايد ملزمًا للطرفين.`,
      ``,
      `البند السابع — التوقيع الإلكتروني:`,
      `يُقرّ الطرفان بأن التوقيع الإلكتروني على هذا العقد داخل المنصة (بالاسم والتاريخ والبصمة الرقمية) مُلزم قانونًا ويقوم مقام التوقيع اليدوي.`,
    ].join('\n');
  }
}
