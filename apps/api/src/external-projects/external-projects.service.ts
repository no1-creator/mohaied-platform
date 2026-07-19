import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateExternalProjectDto,
  UpdateExternalProjectDto,
} from './dto/external-project.dto';

const CLIENT_SELECT = { id: true, name: true, company: true };

@Injectable()
export class ExternalProjectsService {
  constructor(private prisma: PrismaService) {}

  create(providerId: string, dto: CreateExternalProjectDto) {
    return this.prisma.externalProject.create({
      data: {
        providerId,
        title: dto.title,
        clientId: dto.clientId || null,
        description: dto.description || null,
        status: dto.status || 'IN_PROGRESS',
        value: dto.value ?? null,
        currency: dto.currency || 'EGP',
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        notes: dto.notes || null,
      },
    });
  }

  async list(providerId: string) {
    const projects = await this.prisma.externalProject.findMany({
      where: { providerId },
      orderBy: { createdAt: 'desc' },
    });
    const clientIds = Array.from(
      new Set(projects.map((p) => p.clientId).filter(Boolean)),
    ) as string[];
    const clients = clientIds.length
      ? await this.prisma.providerClient.findMany({
          where: { id: { in: clientIds } },
          select: CLIENT_SELECT,
        })
      : [];
    const map = new Map(clients.map((c) => [c.id, c]));
    return projects.map((p) => ({
      ...p,
      client: p.clientId ? map.get(p.clientId) || null : null,
    }));
  }

  async get(providerId: string, id: string) {
    const p = await this.prisma.externalProject.findFirst({
      where: { id, providerId },
    });
    if (!p) throw new NotFoundException('المشروع غير موجود');
    let client = null;
    if (p.clientId) {
      client = await this.prisma.providerClient.findFirst({
        where: { id: p.clientId, providerId },
        select: CLIENT_SELECT,
      });
    }
    return { ...p, client };
  }

  async update(providerId: string, id: string, dto: UpdateExternalProjectDto) {
    await this.get(providerId, id);
    const data: any = { ...dto };
    if ('startDate' in dto) data.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if ('dueDate' in dto) data.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    if ('clientId' in dto) data.clientId = dto.clientId || null;
    return this.prisma.externalProject.update({ where: { id }, data });
  }

  async remove(providerId: string, id: string) {
    await this.get(providerId, id);
    await this.prisma.externalProject.delete({ where: { id } });
    return { ok: true };
  }
}
