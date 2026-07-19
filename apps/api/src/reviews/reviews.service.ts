import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectStatus, ReviewRole } from '@prisma/client';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  // إنشاء تقييم — بعد اكتمال المشروع فقط، ومرة واحدة لكل طرف
  async create(userId: string, dto: CreateReviewDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });
    if (!project) throw new NotFoundException('المشروع غير موجود');

    const isClient = project.clientId === userId;
    const isProvider = project.providerId === userId;
    if (!isClient && !isProvider) {
      throw new ForbiddenException('لست طرفًا في هذا المشروع');
    }
    if (project.status !== ProjectStatus.COMPLETED) {
      throw new BadRequestException('يمكن التقييم بعد اكتمال المشروع فقط');
    }
    if (!project.providerId) {
      throw new BadRequestException('لا يوجد مقدّم خدمة لهذا المشروع');
    }

    const authorRole = isClient ? ReviewRole.CLIENT : ReviewRole.PROVIDER;
    const targetId = isClient ? project.providerId : project.clientId;

    const existing = await this.prisma.review.findUnique({
      where: { projectId_authorId: { projectId: dto.projectId, authorId: userId } },
    });
    if (existing) {
      throw new BadRequestException('لقد قمت بتقييم هذا المشروع بالفعل');
    }

    const review = await this.prisma.review.create({
      data: {
        projectId: dto.projectId,
        authorId: userId,
        targetId,
        authorRole,
        rating: dto.rating,
        comment: dto.comment?.trim() || null,
      },
    });

    // تحديث تقييم مقدّم الخدمة (تقييمات العملاء فقط)
    if (authorRole === ReviewRole.CLIENT) {
      await this.recomputeProviderRating(targetId);
    }

    return review;
  }

  private async recomputeProviderRating(providerUserId: string) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId: providerUserId },
    });
    if (!profile) return;

    const agg = await this.prisma.review.aggregate({
      where: { targetId: providerUserId, authorRole: ReviewRole.CLIENT },
      _avg: { rating: true },
      _count: true,
    });

    await this.prisma.providerProfile.update({
      where: { userId: providerUserId },
      data: {
        rating: agg._avg.rating ? Number(agg._avg.rating.toFixed(2)) : 0,
        reviewsCount: agg._count,
      },
    });
  }

  // تقييمات مقدّم خدمة (عام)
  async forProvider(providerUserId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { targetId: providerUserId, authorRole: ReviewRole.CLIENT },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, fullName: true, avatarUrl: true } },
        project: { select: { id: true, title: true, field: true } },
      },
    });
    const count = reviews.length;
    const average = count
      ? Number((reviews.reduce((s, r) => s + r.rating, 0) / count).toFixed(2))
      : 0;
    return { count, average, reviews };
  }

  // تقييمات مشروع + هل أقدر أقيّم؟ (للأطراف فقط)
  async forProject(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException('المشروع غير موجود');
    if (project.clientId !== userId && project.providerId !== userId) {
      throw new ForbiddenException('ليس لديك صلاحية');
    }

    const reviews = await this.prisma.review.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    const mine = reviews.find((r) => r.authorId === userId) || null;
    const canReview =
      project.status === ProjectStatus.COMPLETED &&
      !mine &&
      !!project.providerId;

    return { reviews, mine, canReview };
  }
}
