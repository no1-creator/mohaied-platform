import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';

@Injectable()
export class AdsService {
  constructor(private prisma: PrismaService) {}

  // الإعلانات النشطة للعامة حسب المكان (ضمن النافذة الزمنية)
  async publicActive(placement?: string) {
    const now = new Date();
    return this.prisma.adBanner.findMany({
      where: {
        status: 'ACTIVE',
        ...(placement ? { placement } : {}),
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: now } }] },
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        ],
      },
      orderBy: [{ orderIndex: 'asc' }, { createdAt: 'desc' }],
    });
  }

  // كل الإعلانات (أدمن)
  async listAll(status?: string, placement?: string) {
    return this.prisma.adBanner.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(placement ? { placement } : {}),
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  // إعلانات مقدم الخدمة نفسه
  async listMine(advertiserId: string) {
    return this.prisma.adBanner.findMany({
      where: { advertiserId },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async getOne(id: string) {
    const ad = await this.prisma.adBanner.findUnique({ where: { id } });
    if (!ad) throw new NotFoundException('الإعلان غير موجود');
    return ad;
  }

  // إنشاء: الأدمن ينشئ مفعّل مباشرة، غيره ينشئ PENDING بانتظار المراجعة
  async create(dto: CreateAdDto, advertiserId: string, isAdmin: boolean) {
    return this.prisma.adBanner.create({
      data: {
        advertiserId,
        title: dto.title,
        subtitle: dto.subtitle,
        imageUrl: dto.imageUrl,
        linkUrl: dto.linkUrl,
        ctaLabel: dto.ctaLabel,
        placement: dto.placement || 'HOME_TOP',
        status: isAdmin ? 'ACTIVE' : 'PENDING',
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
    });
  }

  // تحديث (أدمن)
  async update(id: string, dto: UpdateAdDto) {
    await this.getOne(id);
    return this.prisma.adBanner.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.subtitle !== undefined ? { subtitle: dto.subtitle } : {}),
        ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl } : {}),
        ...(dto.linkUrl !== undefined ? { linkUrl: dto.linkUrl } : {}),
        ...(dto.ctaLabel !== undefined ? { ctaLabel: dto.ctaLabel } : {}),
        ...(dto.placement !== undefined ? { placement: dto.placement } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
        ...(dto.paid !== undefined ? { paid: dto.paid } : {}),
        ...(dto.orderIndex !== undefined ? { orderIndex: dto.orderIndex } : {}),
        ...(dto.startDate !== undefined
          ? { startDate: dto.startDate ? new Date(dto.startDate) : null }
          : {}),
        ...(dto.endDate !== undefined
          ? { endDate: dto.endDate ? new Date(dto.endDate) : null }
          : {}),
      },
    });
  }

  async setStatus(id: string, status: string) {
    await this.getOne(id);
    return this.prisma.adBanner.update({ where: { id }, data: { status } });
  }

  async remove(id: string) {
    await this.getOne(id);
    await this.prisma.adBanner.delete({ where: { id } });
    return { ok: true };
  }

  // تتبّع النقر (عام)
  async trackClick(id: string) {
    await this.prisma.adBanner.updateMany({
      where: { id },
      data: { clicks: { increment: 1 } },
    });
    return { ok: true };
  }

  // تتبّع الظهور (عام)
  async trackImpression(id: string) {
    await this.prisma.adBanner.updateMany({
      where: { id },
      data: { impressions: { increment: 1 } },
    });
    return { ok: true };
  }
}
