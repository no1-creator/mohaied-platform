import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

@Injectable()
export class AdsService {
  constructor(private prisma: PrismaService) {}

  // الإعلانات النشطة للعامة (ضمن المدة + مع احترام الحد اليومي + مرتّبة بالأولوية)
  async publicActive(placement?: string) {
    const now = new Date();
    const ads = await this.prisma.adBanner.findMany({
      where: {
        status: 'ACTIVE',
        ...(placement ? { placement } : {}),
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: now } }] },
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        ],
      },
      orderBy: [{ priority: 'desc' }, { orderIndex: 'asc' }, { createdAt: 'desc' }],
    });
    const today = todayKey();
    return ads.filter(
      (ad) =>
        !(
          ad.dailyImpressionCap > 0 &&
          ad.impressionDay === today &&
          ad.impressionsToday >= ad.dailyImpressionCap
        ),
    );
  }

  async listAll(status?: string, placement?: string) {
    return this.prisma.adBanner.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(placement ? { placement } : {}),
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

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

  // إنشاء: الأدمن ينشئ مفعّل مباشرة، غيره PENDING بانتظار المراجعة
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
        amount: isAdmin ? dto.amount ?? 0 : 0,
        paid: isAdmin ? dto.paid ?? false : false,
        priority: isAdmin ? dto.priority ?? 0 : 0,
        dailyImpressionCap: isAdmin ? dto.dailyImpressionCap ?? 0 : 0,
      },
    });
  }

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
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.dailyImpressionCap !== undefined
          ? { dailyImpressionCap: dto.dailyImpressionCap }
          : {}),
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

  async trackClick(id: string) {
    await this.prisma.adBanner.updateMany({
      where: { id },
      data: { clicks: { increment: 1 } },
    });
    return { ok: true };
  }

  // تتبّع الظهور مع عدّاد يومي بيتصفّر تلقائيًا كل يوم
  async trackImpression(id: string) {
    const ad = await this.prisma.adBanner.findUnique({ where: { id } });
    if (!ad) return { ok: true };
    const today = todayKey();
    const sameDay = ad.impressionDay === today;
    await this.prisma.adBanner.update({
      where: { id },
      data: {
        impressions: { increment: 1 },
        impressionsToday: sameDay ? { increment: 1 } : 1,
        impressionDay: today,
      },
    });
    return { ok: true };
  }
}
