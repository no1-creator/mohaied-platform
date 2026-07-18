import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateOfferDto } from './dto/offer.dto';
import { OfferStatus, ProjectStatus } from '@prisma/client';

// الحد الأقصى للعروض النشطة لمقدّم خدمة غير مشترك (الباقة المجانية)
// غيّر الرقم ده لو عايز تسمح بأكتر/أقل للمجاني.
const FREE_MAX_ACTIVE_OFFERS = 5;

@Injectable()
export class OffersService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(providerId: string, dto: CreateOfferDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });
    if (!project) {
      throw new NotFoundException('المشروع غير موجود');
    }
    if (project.status !== ProjectStatus.OPEN) {
      throw new BadRequestException('المشروع لا يستقبل عروضًا حاليًا');
    }

    const sum = dto.milestones.reduce((acc, m) => acc + m.price, 0);
    if (Math.round(sum) !== Math.round(dto.totalPrice)) {
      throw new BadRequestException(
        'مجموع قيم المراحل يجب أن يساوي إجمالي العرض',
      );
    }

    // ===== فرض حد العروض النشطة حسب باقة مقدّم الخدمة (ميزة اشتراك) =====
    // المشترك: حده = maxOffers بتاع باقته (null = غير محدود).
    // غير المشترك: حده = FREE_MAX_ACTIVE_OFFERS.
    const activeSub = await this.prisma.subscription.findFirst({
      where: {
        userId: providerId,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      select: { plan: { select: { maxOffers: true } } },
    });
    const maxOffers = activeSub
      ? (activeSub.plan?.maxOffers ?? null)
      : FREE_MAX_ACTIVE_OFFERS;
    if (maxOffers !== null && maxOffers !== undefined) {
      const activeCount = await this.prisma.offer.count({
        where: { providerId, status: OfferStatus.SUBMITTED },
      });
      if (activeCount >= maxOffers) {
        throw new BadRequestException(
          `وصلت للحد الأقصى من العروض النشطة (${maxOffers}). رقِّ باقتك أو استنى الرد على عروضك الحالية.`,
        );
      }
    }

    const offer = await this.prisma.offer.create({
      data: {
        projectId: dto.projectId,
        providerId,
        scope: dto.scope,
        totalPrice: dto.totalPrice,
        durationDays: dto.durationDays,
        status: OfferStatus.SUBMITTED,
        milestones: {
          create: dto.milestones.map((m, index) => ({
            title: m.title,
            description: m.description,
            price: m.price,
            durationDays: m.durationDays,
            orderIndex: index,
          })),
        },
      },
      include: { milestones: { orderBy: { orderIndex: 'asc' } } },
    });

    // 🔔 إشعار لصاحب المشروع بوصول عرض جديد
    await this.notifications.create({
      userId: project.clientId,
      type: 'OFFER',
      title: 'عرض جديد على مشروعك',
      body: `وصلك عرض جديد على مشروع «${project.title}».`,
      linkUrl: `/projects/${project.id}/offers`,
    });

    return offer;
  }

  async findForProject(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException('المشروع غير موجود');
    }
    if (project.clientId !== userId) {
      throw new ForbiddenException('ليس لديك صلاحية لعرض عروض هذا المشروع');
    }

    return this.prisma.offer.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        milestones: { orderBy: { orderIndex: 'asc' } },
        provider: { select: { id: true, fullName: true } },
      },
    });
  }

  async findMine(providerId: string) {
    return this.prisma.offer.findMany({
      where: { providerId },
      orderBy: { createdAt: 'desc' },
      include: {
        milestones: { orderBy: { orderIndex: 'asc' } },
        project: { select: { id: true, title: true, status: true } },
      },
    });
  }
}
