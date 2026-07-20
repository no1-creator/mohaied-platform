import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SendNotificationDto } from './dto/admin.dto';
import { AuthUser } from '../auth/get-user.decorator';
@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async getStats() {
    const [
      totalUsers,
      clients,
      providers,
      supervisors,
      admins,
      verifiedUsers,
      suspendedUsers,
      totalProjects,
      openProjects,
      inProgressProjects,
      completedProjects,
      disputedProjects,
      totalOffers,
      confirmedAgreements,
      totalComplaints,
      openComplaints,
      resolvedComplaints,
      activeAssignments,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'CLIENT' } }),
      this.prisma.user.count({ where: { role: 'PROVIDER' } }),
      this.prisma.user.count({ where: { role: 'SUPERVISOR' } }),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
      this.prisma.user.count({ where: { isVerified: true } }),
      this.prisma.user.count({ where: { isActive: false } }),
      this.prisma.project.count(),
      this.prisma.project.count({ where: { status: 'OPEN' } }),
      this.prisma.project.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.project.count({ where: { status: 'COMPLETED' } }),
      this.prisma.project.count({ where: { status: 'DISPUTED' } }),
      this.prisma.offer.count(),
      this.prisma.agreement.count({ where: { status: 'CONFIRMED' } }),
      this.prisma.complaint.count(),
      this.prisma.complaint.count({
        where: {
          status: {
            in: ['OPEN', 'AWAITING_RESPONSE', 'UNDER_REVIEW', 'IN_ARBITRATION'],
          },
        },
      }),
      this.prisma.complaint.count({
        where: { status: { in: ['RESOLVED', 'CLOSED'] } },
      }),
      this.prisma.supervisorAssignment.count({ where: { status: 'ACTIVE' } }),
    ]);

    return {
      users: {
        total: totalUsers,
        clients,
        providers,
        supervisors,
        admins,
        verified: verifiedUsers,
        suspended: suspendedUsers,
      },
      projects: {
        total: totalProjects,
        open: openProjects,
        inProgress: inProgressProjects,
        completed: completedProjects,
        disputed: disputedProjects,
      },
      offers: { total: totalOffers, confirmedAgreements },
      complaints: {
        total: totalComplaints,
        open: openComplaints,
        resolved: resolvedComplaints,
      },
      supervision: { activeAssignments },
    };
  }

  async listUsers(role?: string, q?: string) {
    const where: any = {};
    if (role && ['CLIENT', 'PROVIDER', 'SUPERVISOR', 'ADMIN'].includes(role)) {
      where.role = role;
    }
    if (q && q.trim()) {
      where.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async ensureUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }
    return user;
  }

  async setVerified(id: string, isVerified: boolean) {
    await this.ensureUser(id);
    return this.prisma.user.update({
      where: { id },
      data: { isVerified },
      select: {
        id: true,
        fullName: true,
        role: true,
        isVerified: true,
        isActive: true,
      },
    });
  }

  async setActive(id: string, isActive: boolean) {
    const user = await this.ensureUser(id);
    if (user.role === 'ADMIN' && !isActive) {
      throw new ForbiddenException('لا يمكن إيقاف حساب أدمن');
    }
    return this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        fullName: true,
        role: true,
        isVerified: true,
        isActive: true,
      },
    });
  }

  async setRole(id: string, role: string) {
    const user = await this.ensureUser(id);
    if (user.role === 'ADMIN' && role !== 'ADMIN') {
      const admins = await this.prisma.user.count({ where: { role: 'ADMIN' } });
      if (admins <= 1) {
        throw new ForbiddenException('لا يمكن إزالة آخر حساب أدمن');
      }
    }
    return this.prisma.user.update({
      where: { id },
      data: { role: role as any },
      select: {
        id: true,
        fullName: true,
        role: true,
        isVerified: true,
        isActive: true,
      },
    });
  }

  async notify(admin: AuthUser, dto: SendNotificationDto) {
  let count = 0;
  let recipientName: string | null = null;

  if (dto.target === 'user') {
    if (!dto.userId) {
      throw new BadRequestException('حدد المستخدم المستهدف');
    }
    const target = await this.ensureUser(dto.userId);
    recipientName = target.fullName;
    await this.notifications.create({
      userId: dto.userId,
      title: dto.title,
      body: dto.body,
      linkUrl: dto.linkUrl,
    });
    count = 1;
  } else {
    const where: any = {};
    if (dto.target === 'role') {
      if (!dto.role) {
        throw new BadRequestException('حدد الفئة المستهدفة');
      }
      where.role = dto.role;
    }

    const users = await this.prisma.user.findMany({
      where,
      select: { id: true },
    });
    const ids = users.map((u) => u.id);
    const res = await this.notifications.createMany(ids, {
      title: dto.title,
      body: dto.body,
      linkUrl: dto.linkUrl,
    });
    count = (res as any)?.count ?? ids.length;
  }

  await this.prisma.adminNotification.create({
    data: {
      adminId: admin.id,
      adminName: admin.fullName,
      target: dto.target,
      role: dto.target === 'role' ? dto.role : null,
      recipientName,
      title: dto.title,
      body: dto.body,
      linkUrl: dto.linkUrl,
      recipientCount: count,
    },
  });

  return { count };
}

async listSentNotifications() {
  return this.prisma.adminNotification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

  async listProjects() {
    return this.prisma.project.findMany({
      select: {
        id: true,
        title: true,
        field: true,
        status: true,
        createdAt: true,
        client: { select: { fullName: true } },
        provider: { select: { fullName: true } },
        _count: {
          select: { offers: true, complaints: true, milestones: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listSupervisors() {
    return this.prisma.user.findMany({
      where: { role: 'SUPERVISOR' },
      select: {
        id: true,
        fullName: true,
        email: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        supervisorProfile: {
          select: {
            title: true,
            field: true,
            yearsExp: true,
            rating: true,
            reviewsCount: true,
          },
        },
        _count: { select: { supervisorAssignments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
