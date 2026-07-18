import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  // helper تقدر تناديه من أي موديول تاني عشان تبعت إشعار
  async create(params: {
    userId: string;
    title: string;
    body?: string;
    linkUrl?: string;
    type?: NotificationType;
  }) {
    try {
      return await this.prisma.notification.create({
        data: {
          userId: params.userId,
          title: params.title,
          body: params.body,
          linkUrl: params.linkUrl,
          type: params.type ?? 'GENERAL',
        },
      });
    } catch {
      // لو فشل إنشاء الإشعار ماينفعش يكسر العملية الأساسية
      return null;
    }
  }

  async createMany(
    userIds: string[],
    data: { title: string; body?: string; linkUrl?: string; type?: NotificationType },
  ) {
    if (!userIds.length) return { count: 0 };
    return this.prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        title: data.title,
        body: data.body,
        linkUrl: data.linkUrl,
        type: data.type ?? 'GENERAL',
      })),
    });
  }

  async list(userId: string, limit = 30) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async markRead(userId: string, id: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
    return { ok: true };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { ok: true };
  }
}
