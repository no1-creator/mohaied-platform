import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitMilestoneDto, ReviewMilestoneDto } from './dto/milestone.dto';
import { MilestoneStatus, ProjectStatus } from '@prisma/client';

@Injectable()
export class MilestonesService {
  constructor(private prisma: PrismaService) {}

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

    return this.prisma.$transaction(async (tx) => {
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

    return this.prisma.$transaction(async (tx) => {
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
