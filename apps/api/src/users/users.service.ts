import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateProviderProfileDto,
  CreateSupervisorProfileDto,
} from './dto/profile.dto';

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
        createdAt: true,
        providerProfile: true,
        supervisorProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    return user;
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
}
