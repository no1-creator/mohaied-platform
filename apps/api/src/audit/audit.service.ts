import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type AuditEntry = {
  actorId?: string | null;
  actorName?: string | null;
  actorRole?: string | null;
  action: string;
  method?: string | null;
  path?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: any;
};

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  // تسجيل عملية — ملفوف في try/catch عشان التسجيل ماينفعش يكسر أي عملية أصلية
  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: entry.actorId ?? null,
          actorName: entry.actorName ?? null,
          actorRole: entry.actorRole ?? null,
          action: entry.action,
          method: entry.method ?? null,
          path: entry.path ?? null,
          targetType: entry.targetType ?? null,
          targetId: entry.targetId ?? null,
          metadata: entry.metadata ?? undefined,
        },
      });
    } catch {
      // نتجاهل أي خطأ في التسجيل
    }
  }

  async list(filter: {
    role?: string;
    actorId?: string;
    q?: string;
    limit?: number;
  }) {
    const limit = Math.min(Math.max(filter.limit ?? 100, 1), 500);
    const where: any = {};
    if (filter.role) where.actorRole = filter.role;
    if (filter.actorId) where.actorId = filter.actorId;
    if (filter.q) where.action = { contains: filter.q, mode: 'insensitive' };
    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
