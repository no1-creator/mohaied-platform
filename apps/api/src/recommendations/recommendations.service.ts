import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateRecommendationDto,
  RespondRecommendationDto,
} from './dto/recommendation.dto';

@Injectable()
export class RecommendationsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(clientId: string, dto: CreateRecommendationDto) {
    const request = await this.prisma.recommendationRequest.create({
      data: {
        clientId,
        title: dto.title,
        field: dto.field,
        description: dto.description,
        budgetMin: dto.budgetMin,
        budgetMax: dto.budgetMax,
        durationDays: dto.durationDays,
      },
    });

    await this.notifications.create({
      userId: clientId,
      type: 'GENERAL',
      title: 'استلمنا طلب الترشيح',
      body: 'فريق محايد هيراجع طلبك ويرشّح لك الأنسب في أقرب وقت.',
      linkUrl: `/projects/recommend/${request.id}`,
    });

    return request;
  }

  findMine(clientId: string) {
    return this.prisma.recommendationRequest.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneForUser(id: string, userId: string, role: string) {
    const request = await this.prisma.recommendationRequest.findUnique({
      where: { id },
    });
    if (!request) {
      throw new NotFoundException('طلب الترشيح غير موجود');
    }
    if (role !== 'ADMIN' && request.clientId !== userId) {
      throw new ForbiddenException('ليس لديك صلاحية لعرض هذا الطلب');
    }

    let recommendedProviders: unknown[] = [];
    if (request.recommendedProviderIds.length > 0) {
      recommendedProviders = await this.prisma.user.findMany({
        where: { id: { in: request.recommendedProviderIds } },
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
          isVerified: true,
          providerProfile: {
            select: {
              companyName: true,
              field: true,
              city: true,
              rating: true,
              reviewsCount: true,
            },
          },
        },
      });
    }

    return { ...request, recommendedProviders };
  }

  findAllForAdmin() {
    return this.prisma.recommendationRequest.findMany({
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: {
        client: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  async respond(id: string, adminId: string, dto: RespondRecommendationDto) {
    const request = await this.prisma.recommendationRequest.findUnique({
      where: { id },
    });
    if (!request) {
      throw new NotFoundException('طلب الترشيح غير موجود');
    }

    const updated = await this.prisma.recommendationRequest.update({
      where: { id },
      data: {
        adminNote: dto.adminNote,
        recommendedProviderIds: dto.recommendedProviderIds ?? [],
        status: 'RESPONDED',
        respondedById: adminId,
        respondedAt: new Date(),
      },
    });

    await this.notifications.create({
      userId: request.clientId,
      type: 'GENERAL',
      title: 'وصلك ترشيح من محايد',
      body: 'فريقنا رشّح لك الأنسب لمشروعك — اطّلع على التفاصيل.',
      linkUrl: `/projects/recommend/${id}`,
    });

    return updated;
  }
}
