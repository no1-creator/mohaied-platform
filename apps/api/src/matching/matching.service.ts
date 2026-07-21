import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, SubscriptionStatus } from '@prisma/client';

export type MatchCriteria = {
  field?: string;
  city?: string;
  keywords?: string;
  limit?: number;
};

export type ScoredProvider = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  isVerified: boolean;
  companyName: string | null;
  field: string | null;
  city: string | null;
  rating: number;
  reviewsCount: number;
  yearsExp: number | null;
  type: string | null;
  score: number;
  reasons: string[];
};

@Injectable()
export class MatchingService {
  constructor(private prisma: PrismaService) {}

  private norm(s?: string | null): string {
    return (s || '').toString().toLowerCase().trim();
  }

  private tokenize(s?: string | null): string[] {
    return this.norm(s)
      .split(/[\s،,\/|+()\-.:؛;_"']+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2);
  }

  // القلب: بيدّي كل مقدّم خدمة درجة مطابقة (0–100) وأسباب واضحة
  async matchForCriteria(criteria: MatchCriteria): Promise<ScoredProvider[]> {
    const limit = Math.min(Math.max(criteria.limit ?? 8, 1), 30);

    const providers = await this.prisma.user.findMany({
      where: {
        role: UserRole.PROVIDER,
        isActive: true,
        providerProfile: { isNot: null },
      },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        isVerified: true,
        providerProfile: {
          select: {
            type: true,
            companyName: true,
            field: true,
            bio: true,
            skills: true,
            city: true,
            yearsExp: true,
            rating: true,
            reviewsCount: true,
          },
        },
        subscriptions: {
          where: { status: SubscriptionStatus.ACTIVE },
          select: { plan: { select: { recommendationPriority: true } } },
        },
      },
    });

    const cField = this.norm(criteria.field);
    const cCity = this.norm(criteria.city);
    const cTokens = [
      ...new Set([
        ...this.tokenize(criteria.field),
        ...this.tokenize(criteria.keywords),
      ]),
    ];

    const scored: ScoredProvider[] = [];

    for (const u of providers) {
      const p = u.providerProfile;
      if (!p) continue;

      const reasons: string[] = [];
      let score = 0;

      // 1) تطابق المجال
      const pField = this.norm(p.field);
      if (pField && cField) {
        if (pField === cField) {
          score += 45;
          reasons.push('نفس المجال بالظبط');
        } else if (pField.includes(cField) || cField.includes(pField)) {
          score += 30;
          reasons.push('مجال قريب من المطلوب');
        }
      }

      // 2) تطابق الكلمات المفتاحية (مهارات/وصف)
      const pTokens = [
        ...new Set(
          [p.field, p.skills, p.bio, p.companyName].flatMap((x) =>
            this.tokenize(x),
          ),
        ),
      ];
      const overlap = cTokens.filter((t) => pTokens.includes(t));
      if (overlap.length > 0) {
        score += Math.min(overlap.length * 7, 21);
        reasons.push('مهارات متطابقة: ' + overlap.slice(0, 4).join('، '));
      }

      // 3) التقييم
      const rating = p.rating ?? 0;
      if (rating > 0) {
        score += (rating / 5) * 18;
        if (rating >= 4) reasons.push(`تقييم ممتاز ${rating.toFixed(1)}★`);
      }

      // 4) عدد المراجعات (موثوقية)
      const rc = p.reviewsCount ?? 0;
      if (rc > 0) score += (Math.min(rc, 20) / 20) * 7;

      // 5) توثيق الهوية
      if (u.isVerified) {
        score += 8;
        reasons.push('هوية موثّقة');
      }

      // 6) نفس المدينة
      if (cCity && this.norm(p.city) === cCity) {
        score += 6;
        reasons.push('نفس المدينة');
      }

      // 7) الخبرة
      const ye = p.yearsExp ?? 0;
      if (ye > 0) {
        score += (Math.min(ye, 10) / 10) * 5;
        if (ye >= 5) reasons.push(`خبرة ${ye} سنة`);
      }

      // 8) أولوية الباقة المدفوعة
      const prio = u.subscriptions.reduce(
        (max, s) => Math.max(max, s.plan?.recommendationPriority ?? 0),
        0,
      );
      if (prio > 0) {
        score += Math.min(prio, 15);
        reasons.push('باقة مميزة');
      }

      const finalScore = Math.min(Math.round(score), 100);
      if (finalScore <= 0) continue;

      scored.push({
        id: u.id,
        fullName: u.fullName,
        avatarUrl: u.avatarUrl,
        isVerified: u.isVerified,
        companyName: p.companyName,
        field: p.field,
        city: p.city,
        rating: p.rating ?? 0,
        reviewsCount: p.reviewsCount ?? 0,
        yearsExp: p.yearsExp,
        type: p.type,
        score: finalScore,
        reasons,
      });
    }

    scored.sort((a, b) => b.score - a.score || b.rating - a.rating);
    return scored.slice(0, limit);
  }

  async matchForRecommendation(id: string): Promise<ScoredProvider[]> {
    const req = await this.prisma.recommendationRequest.findUnique({
      where: { id },
    });
    if (!req) throw new NotFoundException('طلب الترشيح غير موجود');
    return this.matchForCriteria({
      field: req.field,
      keywords: `${req.title} ${req.description}`,
      limit: 10,
    });
  }

  async matchForProject(id: string): Promise<ScoredProvider[]> {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('المشروع غير موجود');
    return this.matchForCriteria({
      field: project.field,
      keywords: `${project.title} ${project.description}`,
      limit: 10,
    });
  }
}
