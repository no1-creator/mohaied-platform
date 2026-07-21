import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateProviderProfileDto,
  CreateSupervisorProfileDto,
  UpdateProviderProfileDto,
} from './dto/profile.dto';
import { UpdateMeDto } from './dto/update-me.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        role: true,
       avatarUrl: true,
isVerified: true,
isSuperAdmin: true,
adminScopes: true,
createdAt: true,
  providerProfile: true,
  supervisorProfile: true,
  legalConsultantProfile: true,
},
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    return user;
  }

  async updateMe(userId: string, dto: UpdateMeDto) {
    const data: Record<string, unknown> = {};
    if (dto.fullName !== undefined) data.fullName = dto.fullName;
    if (dto.avatarUrl !== undefined) data.avatarUrl = dto.avatarUrl || null;
    if (dto.phone !== undefined) data.phone = dto.phone ? dto.phone : null;
    try {
      await this.prisma.user.update({ where: { id: userId }, data });
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new ConflictException('رقم الهاتف مستخدم بالفعل');
      }
      throw e;
    }
    return this.getMe(userId);
  }

  // ===== دليل مقدمي الخدمة (اختيار من المنصة) =====
  private readonly providerPublicSelect = {
    id: true,
    fullName: true,
    avatarUrl: true,
    isVerified: true,
    createdAt: true,
    providerProfile: {
      select: {
        type: true,
        companyName: true,
        field: true,
        bio: true,
        yearsExp: true,
        teamSize: true,
        city: true,
        website: true,
        portfolioUrl: true,
        skills: true,
        logoUrl: true,
        coverUrl: true,
        portfolioImages: true,
        linkedinUrl: true,
        whatsapp: true,
        rating: true,
        reviewsCount: true,
      },
    },
  } as const;

  async listProviders() {
    const providers = await this.prisma.user.findMany({
      where: {
        role: 'PROVIDER',
        isActive: true,
        providerProfile: { isNot: null },
      },
      select: this.providerPublicSelect,
      orderBy: [{ isVerified: 'desc' }, { createdAt: 'desc' }],
    });

    // نجيب مميزات الباقة النشِطة لكل مقدم خدمة (استعلام منفصل آمن)
    const ids = providers.map((p) => p.id);
    const subs = ids.length
      ? await this.prisma.subscription.findMany({
          where: { userId: { in: ids }, status: 'ACTIVE', expiresAt: { gt: new Date() } },
          orderBy: { createdAt: 'desc' },
          select: {
            userId: true,
            plan: { select: { badgeLabel: true, directoryPriority: true, isFeatured: true } },
          },
        })
      : [];

    const byUser = new Map<
      string,
      { badgeLabel: string | null; directoryPriority: number; isFeatured: boolean }
    >();
    for (const s of subs) {
      if (!byUser.has(s.userId)) {
        byUser.set(s.userId, {
          badgeLabel: s.plan?.badgeLabel ?? null,
          directoryPriority: s.plan?.directoryPriority ?? 0,
          isFeatured: !!s.plan?.isFeatured,
        });
      }
    }

    return providers
      .map((p) => {
        const perk = byUser.get(p.id);
        return {
          ...p,
          planBadge: perk?.badgeLabel ?? null,
          planFeatured: perk?.isFeatured ?? false,
          directoryPriority: perk?.directoryPriority ?? 0,
        };
      })
      .sort((a, b) => {
        if (b.directoryPriority !== a.directoryPriority)
          return b.directoryPriority - a.directoryPriority;
        const av = a.isVerified ? 1 : 0;
        const bv = b.isVerified ? 1 : 0;
        if (bv !== av) return bv - av;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  async getProvider(id: string) {
    const provider = await this.prisma.user.findFirst({
      where: {
        id,
        role: 'PROVIDER',
        providerProfile: { isNot: null },
      },
      select: this.providerPublicSelect,
    });
    if (!provider) {
      throw new NotFoundException('مقدم الخدمة غير موجود');
    }

    const sub = await this.prisma.subscription.findFirst({
      where: { userId: id, status: 'ACTIVE', expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      select: { plan: { select: { badgeLabel: true, directoryPriority: true, isFeatured: true } } },
    });

    return {
      ...provider,
      planBadge: sub?.plan?.badgeLabel ?? null,
      planFeatured: !!sub?.plan?.isFeatured,
      directoryPriority: sub?.plan?.directoryPriority ?? 0,
    };
  }

  async createProviderProfile(userId: string, dto: CreateProviderProfileDto) {
    const existing = await this.prisma.providerProfile.findUnique({
      where: { userId },
    });
    if (existing) {
      throw new ConflictException('بروفايل مقدم الخدمة موجود بالفعل');
    }

    return this.prisma.providerProfile.create({
      data: {
        userId,
        type: dto.type,
        companyName: dto.companyName,
        field: dto.field,
        bio: dto.bio,
        yearsExp: dto.yearsExp,
        teamSize: dto.teamSize,
        city: dto.city,
        phone: dto.phone,
        website: dto.website,
        portfolioUrl: dto.portfolioUrl,
        skills: dto.skills,
        commercialRegNo: dto.commercialRegNo,
        taxId: dto.taxId,
        nationalId: dto.nationalId,
      },
    });
  }

  async updateProviderProfile(userId: string, dto: UpdateProviderProfileDto) {
    const existing = await this.prisma.providerProfile.findUnique({
      where: { userId },
    });
    if (!existing) {
      throw new NotFoundException('لازم تكمّل بيانات بروفايلك الأساسية الأول');
    }

    const data: Record<string, unknown> = {};
    const keys: (keyof UpdateProviderProfileDto)[] = [
      'type',
      'companyName',
      'field',
      'bio',
      'yearsExp',
      'teamSize',
      'city',
      'phone',
      'website',
      'portfolioUrl',
      'skills',
      'commercialRegNo',
      'taxId',
      'nationalId',
      'logoUrl',
      'coverUrl',
      'portfolioImages',
      'linkedinUrl',
      'whatsapp',
    ];
    for (const k of keys) {
      if (dto[k] !== undefined) data[k] = dto[k];
    }

    await this.prisma.providerProfile.update({ where: { userId }, data });
    return this.getMe(userId);
  }

  async createSupervisorProfile(
    userId: string,
    dto: CreateSupervisorProfileDto,
  ) {
    const existing = await this.prisma.supervisorProfile.findUnique({
      where: { userId },
    });
    if (existing) {
      throw new ConflictException('بروفايل المشرف موجود بالفعل');
    }

    return this.prisma.supervisorProfile.create({
      data: {
        userId,
        title: dto.title,
        field: dto.field,
        yearsExp: dto.yearsExp,
        ratePerReview: dto.ratePerReview,
        bio: dto.bio,
        education: dto.education,
        certifications: dto.certifications,
        specialties: dto.specialties,
        languages: dto.languages,
        city: dto.city,
        phone: dto.phone,
        linkedinUrl: dto.linkedinUrl,
               membershipNo: dto.membershipNo,
      },
    });
  }

  // ===== المستشار القانوني =====
  private readonly legalPublicSelect = {
    id: true,
    fullName: true,
    avatarUrl: true,
    isVerified: true,
    createdAt: true,
    legalConsultantProfile: {
      select: {
        title: true,
        field: true,
        yearsExp: true,
        consultationRate: true,
        bio: true,
        education: true,
        certifications: true,
        specialties: true,
        languages: true,
        city: true,
        linkedinUrl: true,
        rating: true,
        reviewsCount: true,
      },
    },
  } as const;

  async listLegalConsultants() {
    return this.prisma.user.findMany({
      where: {
        role: 'LEGAL_CONSULTANT',
        isActive: true,
        legalConsultantProfile: { isNot: null },
      },
      select: this.legalPublicSelect,
      orderBy: [{ isVerified: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getLegalConsultant(id: string) {
    const consultant = await this.prisma.user.findFirst({
      where: {
        id,
        role: 'LEGAL_CONSULTANT',
        legalConsultantProfile: { isNot: null },
      },
      select: this.legalPublicSelect,
    });
    if (!consultant) {
      throw new NotFoundException('المستشار القانوني غير موجود');
    }
    return consultant;
  }

  async createLegalConsultantProfile(
    userId: string,
    dto: {
      title: string;
      field: string;
      yearsExp?: number;
      consultationRate?: number;
      bio?: string;
      education?: string;
      certifications?: string;
      specialties?: string;
      languages?: string;
      city?: string;
      phone?: string;
      linkedinUrl?: string;
      barAssociationNo?: string;
    },
  ) {
    const existing = await this.prisma.legalConsultantProfile.findUnique({
      where: { userId },
    });
    if (existing) {
      throw new ConflictException('بروفايل المستشار القانوني موجود بالفعل');
    }

    return this.prisma.legalConsultantProfile.create({
      data: {
        userId,
        title: dto.title,
        field: dto.field,
        yearsExp: dto.yearsExp ?? 0,
        consultationRate: dto.consultationRate ?? 0,
        bio: dto.bio,
        education: dto.education,
        certifications: dto.certifications,
        specialties: dto.specialties,
        languages: dto.languages,
        city: dto.city,
        phone: dto.phone,
        linkedinUrl: dto.linkedinUrl,
        barAssociationNo: dto.barAssociationNo,
      },
    });
  }
}
