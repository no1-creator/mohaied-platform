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
