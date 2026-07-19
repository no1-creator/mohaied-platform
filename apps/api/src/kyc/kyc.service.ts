import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateKycDto } from './dto/create-kyc.dto';
import { ReviewKycDto } from './dto/review-kyc.dto';

// بيانات الطلب من غير الصور (خفيفة للقوائم)
const META_SELECT = {
  id: true,
  userId: true,
  idType: true,
  idNumber: true,
  fullNameOnId: true,
  status: true,
  reviewNote: true,
  reviewedById: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
};

const USER_SELECT = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  isVerified: true,
};

@Injectable()
export class KycService {
  constructor(private prisma: PrismaService) {}

  async submit(userId: string, dto: CreateKycDto) {
    const latest = await this.prisma.kycSubmission.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    if (latest?.status === 'APPROVED') {
      throw new BadRequestException('حسابك موثّق بالفعل');
    }
    if (latest?.status === 'PENDING') {
      throw new BadRequestException('عندك طلب توثيق قيد المراجعة بالفعل');
    }
    return this.prisma.kycSubmission.create({
      data: {
        userId,
        idType: dto.idType,
        idNumber: dto.idNumber,
        fullNameOnId: dto.fullNameOnId,
        frontImage: dto.frontImage,
        backImage: dto.backImage || null,
        selfie: dto.selfie || null,
      },
      select: META_SELECT,
    });
  }

  async mine(userId: string) {
    const sub = await this.prisma.kycSubmission.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: META_SELECT,
    });
    return sub || null;
  }

  async adminList(status?: string) {
    const where = status ? { status: status as any } : {};
    const subs = await this.prisma.kycSubmission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: META_SELECT,
    });
    const userIds = Array.from(new Set(subs.map((s) => s.userId)));
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: USER_SELECT,
    });
    const map = new Map(users.map((u) => [u.id, u]));
    return subs.map((s) => ({ ...s, user: map.get(s.userId) || null }));
  }

  async adminGet(id: string) {
    const sub = await this.prisma.kycSubmission.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException('طلب التوثيق غير موجود');
    const user = await this.prisma.user.findUnique({
      where: { id: sub.userId },
      select: USER_SELECT,
    });
    return { ...sub, user };
  }

  async review(id: string, adminId: string, dto: ReviewKycDto) {
    const sub = await this.prisma.kycSubmission.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException('طلب التوثيق غير موجود');

    const updated = await this.prisma.kycSubmission.update({
      where: { id },
      data: {
        status: dto.status,
        reviewNote: dto.reviewNote || null,
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
      select: META_SELECT,
    });

    if (dto.status === 'APPROVED') {
      await this.prisma.user.update({
        where: { id: sub.userId },
        data: { isVerified: true },
      });
    }

    return updated;
  }
}
