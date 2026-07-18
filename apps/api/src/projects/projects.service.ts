import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateProjectDto } from './dto/project.dto';
import { ProjectStatus, UserRole } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

async create(clientId: string, dto: CreateProjectDto) {
  // لو العميل اختار مقدم خدمة معيّن من المنصة (طلب مباشر)
  let preferredProviderId: string | null = null;
  if (dto.preferredProviderId) {
    const provider = await this.prisma.user.findFirst({
      where: {
        id: dto.preferredProviderId,
        role: UserRole.PROVIDER,
        isActive: true,
      },
      select: { id: true },
    });
    if (provider) preferredProviderId = provider.id;
  }

  const project = await this.prisma.project.create({
    data: {
      title: dto.title,
      field: dto.field,
      description: dto.description,
      budgetMin: dto.budgetMin,
      budgetMax: dto.budgetMax,
      durationDays: dto.durationDays,
      status: ProjectStatus.OPEN,
      clientId,
      preferredProviderId,
    },
  });

  await this.prisma.activityLog.create({
    data: {
      projectId: project.id,
      actorId: clientId,
      action: 'PROJECT_CREATED',
    },
  });

  // إشعار مباشر لمقدم الخدمة اللي العميل اختاره
  if (preferredProviderId) {
    const client = await this.prisma.user.findUnique({
      where: { id: clientId },
      select: { fullName: true },
    });
    await this.notifications.create({
      userId: preferredProviderId,
      type: 'PROJECT',
      title: 'عميل اختارك مباشرة لمشروع جديد',
      body: `${client?.fullName || 'عميل'} اختارك لمشروع «${project.title}». راجع تفاصيله من المشاريع المتاحة وقدّم عرضك.`,
      linkUrl: '/projects/open',
    });
  }

  return project;
}

  async findMine(userId: string) {
    return this.prisma.project.findMany({
      where: {
        OR: [{ clientId: userId }, { providerId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { id: true, fullName: true } },
        provider: { select: { id: true, fullName: true } },
      },
    });
  }

  async findOne(id: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, fullName: true } },
        provider: { select: { id: true, fullName: true } },
        milestones: { orderBy: { orderIndex: 'asc' } },
        agreement: true,
      },
    });

    if (!project) {
      throw new NotFoundException('المشروع غير موجود');
    }

    const isParty =
      project.clientId === userId || project.providerId === userId;
    if (!isParty) {
      throw new ForbiddenException('ليس لديك صلاحية لعرض هذا المشروع');
    }

    return project;
  }

  async findOpen() {
    return this.prisma.project.findMany({
      where: { status: ProjectStatus.OPEN, providerId: null },
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { id: true, fullName: true } },
      },
    });
  }
}
