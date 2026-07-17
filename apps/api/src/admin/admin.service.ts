import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

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
