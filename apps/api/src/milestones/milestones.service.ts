import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SubmitMilestoneDto, ReviewMilestoneDto } from './dto/milestone.dto';
import { MilestoneStatus, ProjectStatus } from '@prisma/client';

@Injectable()
export class MilestonesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async listForProject(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException('المشروع غير موجود');
    }
    if (project.clientId !== userId && project.providerId !== userId) {
      throw new ForbiddenException('ليس لديك صلاحية لعرض هذا المشروع');
    }

    return this.prisma.milestone.findMany({
      where: { projectId },
      orderBy: { orderIndex: 'asc' },
      include: {
        submissions: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  // مقدم الخدمة يسلّم المرحلة
  async submit(
    milestoneId: string,
    providerId: string,
    dto: SubmitMilestoneDto,
  ) {
    const milestone = await this.getMilestoneWithProject(milestoneId);

    if (milestone.project.providerId !== providerId) {
      throw new ForbiddenException('لست مقدم الخدمة لهذا المشروع');
    }
    if (
      milestone.status !== MilestoneStatus.IN_PROGRESS &&
      milestone.status !== MilestoneStatus.REVISION_REQUESTED
    ) {
      throw new BadRequestException('لا يمكن تسليم هذه المرحلة في حالتها الحالية');
    }

    const submission = await this.prisma.$transaction(async (tx) => {
      const submission = await tx.submission.create({
        data: {
          milestoneId,
          providerId,
          notes: dto.notes,
          externalLink: dto.externalLink,
        },
      });

      await tx.milestone.update({
        where: { id: milestoneId },
        data: { status: MilestoneStatus.UNDER_REVIEW },
      });

      await tx.activityLog.create({
        data: {
          projectId: milestone.projectId,
          actorId: providerId,
          action: 'MILESTONE_SUBMITTED',
          metadata: { milestoneId, submissionId: submission.id },
        },
      });

      return submission;
    });

    // 🔔 إشعار للعميل بتسليم المرحلة للمراجعة
    await this.notifications.create({
      userId: milestone.project.clientId,
      type: 'MILESTONE',
      title: 'تم تسليم مرحلة للمراجعة',
      body: `سلّم مقدم الخدمة مرحلة «${milestone.title}» في مشروع «${milestone.project.title}».`,
      linkUrl: `/projects/${milestone.projectId}/milestones`,
    });

    return submission;
  }

  // العميل يراجع المرحلة (اعتماد أو طلب تعديل)
  async review(
    milestoneId: string,
    clientId: string,
    dto: ReviewMilestoneDto,
  ) {
    const milestone = await this.getMilestoneWithProject(milestoneId);

    if (milestone.project.clientId !== clientId) {
      throw new ForbiddenException('لست صاحب هذا المشروع');
    }
    if (milestone.status !== MilestoneStatus.UNDER_REVIEW) {
      throw new BadRequestException('لا توجد مراجعة معلّقة لهذه المرحلة');
    }

    const lastSubmission = await this.prisma.submission.findFirst({
      where: { milestoneId },
      orderBy: { createdAt: 'desc' },
    });

    const result = await this.prisma.$transaction(async (tx) => {
      if (lastSubmission) {
        await tx.submission.update({
          where: { id: lastSubmission.id },
          data: {
            approved: dto.approved,
            reviewNotes: dto.reviewNotes,
          },
        });
      }

      if (dto.approved) {
        await tx.milestone.update({
          where: { id: milestoneId },
          data: { status: MilestoneStatus.APPROVED },
        });

        // تفعيل المرحلة التالية إن وجدت
        const next = await tx.milestone.findFirst({
          where: {
            projectId: milestone.projectId,
            orderIndex: { gt: milestone.orderIndex },
            status: MilestoneStatus.PENDING,
          },
          orderBy: { orderIndex: 'asc' },
        });

        if (next) {
          await tx.milestone.update({
            where: { id: next.id },
            data: { status: MilestoneStatus.IN_PROGRESS },
          });
        } else {
          // مفيش مراحل تانية -> المشروع اكتمل
          await tx.project.update({
            where: { id: milestone.projectId },
            data: { status: ProjectStatus.COMPLETED },
          });
        }
      } else {
        await tx.milestone.update({
          where: { id: milestoneId },
          data: { status: MilestoneStatus.REVISION_REQUESTED },
        });
      }

      await tx.activityLog.create({
        data: {
          projectId: milestone.projectId,
          actorId: clientId,
          action: dto.approved
            ? 'MILESTONE_APPROVED'
            : 'MILESTONE_REVISION_REQUESTED',
          metadata: { milestoneId },
        },
      });

      return tx.milestone.findUnique({ where: { id: milestoneId } });
    });

    // 🔔 إشعار لمقدم الخدمة بنتيجة المراجعة
    if (milestone.project.providerId) {
      await this.notifications.create({
        userId: milestone.project.providerId,
        type: 'MILESTONE',
        title: dto.approved ? 'تم اعتماد مرحلة' : 'مطلوب تعديل على مرحلة',
        body: dto.approved
          ? `اعتمد العميل مرحلة «${milestone.title}» في مشروع «${milestone.project.title}».`
          : `طلب العميل تعديلًا على مرحلة «${milestone.title}» في مشروع «${milestone.project.title}».`,
        linkUrl: `/projects/${milestone.projectId}/milestones`,
      });
    }

    return result;
  }

  private async getMilestoneWithProject(milestoneId: string) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: { project: true },
    });
    if (!milestone) {
      throw new NotFoundException('المرحلة غير موجودة');
    }
    return milestone;
  }
}
