import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
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

  // العميل يقبل العرض -> ينشأ اتفاق + مراحل + يبدأ التنفيذ
  async acceptOffer(offerId: string, clientId: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        milestones: { orderBy: { orderIndex: 'asc' } },
        project: true,
      },
    });

    if (!offer) {
      throw new NotFoundException('العرض غير موجود');
    }
    if (offer.project.clientId !== clientId) {
      throw new ForbiddenException('ليس لديك صلاحية على هذا المشروع');
    }
    if (offer.status !== OfferStatus.SUBMITTED &&
        offer.status !== OfferStatus.REVISED) {
      throw new BadRequestException('لا يمكن قبول هذا العرض في حالته الحالية');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1) الاتفاق
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
          status: index === 0
            ? MilestoneStatus.IN_PROGRESS
            : MilestoneStatus.PENDING,
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
}
