import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function monthStart(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
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

  // رصيد الإعلانات الشهري لمقدّم الخدمة حسب باقته (المستخدَم/الإجمالي/المتبقّي)
  async myAdCredits(advertiserId: string) {
    const activeSub = await this.prisma.subscription.findFirst({
      where: {
        userId: advertiserId,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      select: { plan: { select: { monthlyAdCredits: true } } },
    });
    const total = activeSub?.plan?.monthlyAdCredits ?? 0;
    const used = await this.prisma.adBanner.count({
      where: { advertiserId, createdAt: { gte: monthStart() } },
    });
    const remaining = Math.max(0, total - used);
    return { total, used, remaining };
  }

  // إنشاء: الأدمن ينشئ مفعّل مباشرة.
  // مقدّم الخدمة: لو عنده رصيد إعلانات شهري في باقته → الإعلان يتفعّل تلقائيًا
  // ويُحتسب مدفوعًا برصيد الباقة، وإلا PENDING بانتظار المراجعة/الدفع.
  async create(dto: CreateAdDto, advertiserId: string, isAdmin: boolean) {
    if (isAdmin) {
      return this.prisma.adBanner.create({
        data: {
          advertiserId,
          title: dto.title,
          subtitle: dto.subtitle,
          imageUrl: dto.imageUrl,
          linkUrl: dto.linkUrl,
          ctaLabel: dto.ctaLabel,
          placement: dto.placement || 'HOME_TOP',
          status: 'ACTIVE',
          startDate: dto.startDate ? new Date(dto.startDate) : null,
          endDate: dto.endDate ? new Date(dto.endDate) : null,
          amount: dto.amount ?? 0,
          paid: dto.paid ?? false,
          priority: dto.priority ?? 0,
          dailyImpressionCap: dto.dailyImpressionCap ?? 0,
        },
      });
    }

    const { remaining } = await this.myAdCredits(advertiserId);
    const coveredByCredit = remaining > 0;

    return this.prisma.adBanner.create({
      data: {
        advertiserId,
        title: dto.title,
        subtitle: dto.subtitle,
        imageUrl: dto.imageUrl,
        linkUrl: dto.linkUrl,
        ctaLabel: dto.ctaLabel,
        placement: dto.placement || 'HOME_TOP',
        status: coveredByCredit ? 'ACTIVE' : 'PENDING',
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        amount: 0,
        paid: coveredByCredit,
        priority: 0,
        dailyImpressionCap: 0,
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
