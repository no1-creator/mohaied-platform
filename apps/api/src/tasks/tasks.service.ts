import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';

const STATUSES = ['TODO', 'DOING', 'DONE'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  private clean(v?: string, allowed?: string[], fallback?: string) {
    const up = (v || '').toUpperCase();
    if (allowed) return allowed.includes(up) ? up : (fallback as string);
    return v;
  }

  private async attachClients(tasks: any[]) {
    const ids = Array.from(new Set(tasks.map((t) => t.clientId).filter(Boolean))) as string[];
    if (ids.length === 0) return tasks.map((t) => ({ ...t, clientName: null }));
    const clients = await this.prisma.providerClient.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });
    const map = new Map(clients.map((c) => [c.id, c.name]));
    return tasks.map((t) => ({ ...t, clientName: t.clientId ? map.get(t.clientId) || null : null }));
  }

  private async attachClient(task: any) {
    const [withName] = await this.attachClients([task]);
    return withName;
  }

  async create(providerId: string, dto: CreateTaskDto) {
    const status = this.clean(dto.status, STATUSES, 'TODO');
    const task = await this.prisma.providerTask.create({
      data: {
        providerId,
        title: dto.title,
        description: dto.description ?? null,
        status,
        priority: this.clean(dto.priority, PRIORITIES, 'MEDIUM'),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        clientId: dto.clientId || null,
        projectRef: dto.projectRef ?? null,
        completedAt: status === 'DONE' ? new Date() : null,
      },
    });
    return this.attachClient(task);
  }

  async findAll(providerId: string) {
    const tasks = await this.prisma.providerTask.findMany({
      where: { providerId },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    });
    return this.attachClients(tasks);
  }

  async findOne(providerId: string, id: string) {
    const task = await this.prisma.providerTask.findFirst({ where: { id, providerId } });
    if (!task) throw new NotFoundException('المهمة غير موجودة');
    return this.attachClient(task);
  }

  async update(providerId: string, id: string, dto: UpdateTaskDto) {
    const existing = await this.prisma.providerTask.findFirst({ where: { id, providerId } });
    if (!existing) throw new NotFoundException('المهمة غير موجودة');

    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description || null;
    if (dto.priority !== undefined) data.priority = this.clean(dto.priority, PRIORITIES, existing.priority);
    if (dto.clientId !== undefined) data.clientId = dto.clientId || null;
    if (dto.projectRef !== undefined) data.projectRef = dto.projectRef || null;
    if (dto.dueDate !== undefined) data.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    if (dto.status !== undefined) {
      const status = this.clean(dto.status, STATUSES, existing.status);
      data.status = status;
      data.completedAt = status === 'DONE' ? existing.completedAt || new Date() : null;
    }

    const task = await this.prisma.providerTask.update({ where: { id }, data });
    return this.attachClient(task);
  }

  async remove(providerId: string, id: string) {
    const existing = await this.prisma.providerTask.findFirst({ where: { id, providerId } });
    if (!existing) throw new NotFoundException('المهمة غير موجودة');
    await this.prisma.providerTask.delete({ where: { id } });
    return { ok: true };
  }
}
