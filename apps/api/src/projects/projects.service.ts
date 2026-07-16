import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/project.dto';
import { ProjectStatus } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(clientId: string, dto: CreateProjectDto) {
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
      },
    });

    await this.prisma.activityLog.create({
      data: {
        projectId: project.id,
        actorId: clientId,
        action: 'PROJECT_CREATED',
      },
    });

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
