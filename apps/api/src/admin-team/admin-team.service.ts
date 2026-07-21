import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// الأقسام اللي ينفع نتحكم في صلاحياتها (مفتاحها = مفتاح القائمة الجانبية)
export const ADMIN_SECTIONS = [
  { key: 'users', label: 'المستخدمون' },
  { key: 'notifications', label: 'سجل الإشعارات' },
  { key: 'projects', label: 'المشاريع' },
  { key: 'supervisors', label: 'المشرفون' },
  { key: 'complaints', label: 'الشكاوى' },
  { key: 'plans', label: 'الباقات والعمولة' },
  { key: 'options', label: 'قوائم الخيارات' },
  { key: 'content', label: 'نصوص الواجهات' },
  { key: 'media', label: 'مكتبة الوسائط' },
  { key: 'ads', label: 'الإعلانات' },
  { key: 'recommendations', label: 'طلبات الترشيح' },
  { key: 'invitations', label: 'دعوات خارجية' },
  { key: 'kyc', label: 'توثيق الهوية' },
  { key: 'audit', label: 'سجل التدقيق' },
];

@Injectable()
export class AdminTeamService {
  constructor(private prisma: PrismaService) {}

  sections() {
    return ADMIN_SECTIONS;
  }

  listAdmins() {
    return this.prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        fullName: true,
        email: true,
        isActive: true,
        isSuperAdmin: true,
        adminScopes: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  private async assertCanManage(actingUserId: string) {
    const acting = await this.prisma.user.findUnique({
      where: { id: actingUserId },
      select: { role: true, isSuperAdmin: true, adminScopes: true },
    });
    if (!acting || acting.role !== 'ADMIN') {
      throw new ForbiddenException('غير مصرّح');
    }

    const superCount = await this.prisma.user.count({
      where: { role: 'ADMIN', isSuperAdmin: true },
    });

    // Bootstrap: طول ما مفيش سوبر أدمن، أي أدمن كامل الصلاحية يقدر يدير الفريق
    if (superCount > 0 && !acting.isSuperAdmin) {
      throw new ForbiddenException('إدارة الفريق متاحة للسوبر أدمن فقط');
    }
    if (superCount === 0 && acting.adminScopes != null) {
      throw new ForbiddenException('غير مصرّح لك بإدارة الفريق');
    }
  }

  async updateAdmin(
    actingUserId: string,
    targetId: string,
    dto: { scopes?: string[] | null; isSuperAdmin?: boolean },
  ) {
    await this.assertCanManage(actingUserId);

    const target = await this.prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, role: true, isSuperAdmin: true },
    });
    if (!target || target.role !== 'ADMIN') {
      throw new NotFoundException('الأدمن غير موجود');
    }

    const data: Record<string, unknown> = {};

    if (dto.scopes !== undefined) {
      data.adminScopes =
        dto.scopes === null ? null : JSON.stringify(dto.scopes ?? []);
    }

    if (dto.isSuperAdmin !== undefined) {
      // منع إزالة آخر سوبر أدمن
      if (target.isSuperAdmin && dto.isSuperAdmin === false) {
        const superCount = await this.prisma.user.count({
          where: { role: 'ADMIN', isSuperAdmin: true },
        });
        if (superCount <= 1) {
          throw new ForbiddenException('لازم يفضل سوبر أدمن واحد على الأقل');
        }
      }
      data.isSuperAdmin = dto.isSuperAdmin;
      if (dto.isSuperAdmin === true) {
        data.adminScopes = null; // السوبر أدمن وصوله كامل دايمًا
      }
    }

    await this.prisma.user.update({ where: { id: targetId }, data });
    return this.listAdmins();
  }
}
