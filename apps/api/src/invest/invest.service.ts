import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const VALID_STAGES = ['IDEA', 'PROTOTYPE', 'MVP', 'REVENUE', 'SCALING'];
const VALID_OPP_STATUS = ['OPEN', 'IN_TALKS', 'FUNDED', 'CLOSED', 'REJECTED'];

@Injectable()
export class InvestService {
  constructor(private prisma: PrismaService) {}

  private genCode() {
    const year = new Date().getFullYear();
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `INV-${year}-${rand}`;
  }

  private async enrichOpps(list: any[]) {
    const ids = Array.from(
      new Set(list.map((o) => o.founderId).filter(Boolean)),
    );
    if (ids.length === 0) return list;
    const users = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, fullName: true, email: true, avatarUrl: true },
    });
    const map = new Map(users.map((u) => [u.id, u]));
    return list.map((o) => ({ ...o, founder: map.get(o.founderId) || null }));
  }

  private async enrichInterests(list: any[]) {
    const investorIds = Array.from(
      new Set(list.map((i) => i.investorId).filter(Boolean)),
    );
    const oppIds = Array.from(
      new Set(list.map((i) => i.opportunityId).filter(Boolean)),
    );
    const [users, opps] = await Promise.all([
      investorIds.length
        ? this.prisma.user.findMany({
            where: { id: { in: investorIds } },
            select: { id: true, fullName: true, email: true, avatarUrl: true },
          })
        : Promise.resolve([] as any[]),
      oppIds.length
        ? this.prisma.investmentOpportunity.findMany({
            where: { id: { in: oppIds } },
          })
        : Promise.resolve([] as any[]),
    ]);
    const uMap = new Map(users.map((u: any) => [u.id, u]));
    const oMap = new Map(opps.map((o: any) => [o.id, o]));
    return list.map((i) => ({
      ...i,
      investor: uMap.get(i.investorId) || null,
      opportunity: oMap.get(i.opportunityId) || null,
    }));
  }

  // ---------- الفرص الاستثمارية ----------

  async createOpportunity(founderId: string, b: any) {
    const title = String(b?.title || '').trim();
    const summary = String(b?.summary || '').trim();
    const description = String(b?.description || '').trim();
    const sector = String(b?.sector || '').trim();
    const amountSought = Number(b?.amountSought);
    if (title.length < 3) throw new BadRequestException('العنوان قصير جدًا');
    if (summary.length < 5) throw new BadRequestException('اكتب نبذة مختصرة عن الفرصة');
    if (description.length < 20) throw new BadRequestException('اكتب وصف كافٍ للفرصة');
    if (!sector) throw new BadRequestException('حدد القطاع أو المجال');
    if (!amountSought || amountSought <= 0)
      throw new BadRequestException('حدد قيمة التمويل المطلوب');
    const stage = VALID_STAGES.includes(b?.stage) ? b.stage : 'IDEA';

    return this.prisma.investmentOpportunity.create({
      data: {
        code: this.genCode(),
        founderId,
        title,
        summary,
        description,
        sector,
        stage: stage as any,
        amountSought,
        currency: String(b?.currency || 'EGP').trim() || 'EGP',
        equityOffered:
          b?.equityOffered != null && b.equityOffered !== ''
            ? Number(b.equityOffered)
            : null,
        useOfFunds: b?.useOfFunds ? String(b.useOfFunds).trim() : null,
        location: b?.location ? String(b.location).trim() : null,
        website: b?.website ? String(b.website).trim() : null,
        pitchDeckUrl: b?.pitchDeckUrl ? String(b.pitchDeckUrl).trim() : null,
        coverImage: b?.coverImage ? String(b.coverImage) : null,
      },
    });
  }

  async listMine(founderId: string) {
    const list = await this.prisma.investmentOpportunity.findMany({
      where: { founderId },
      orderBy: { createdAt: 'desc' },
    });
    return this.enrichOpps(list);
  }

  async listPublic(q: { sector?: string; stage?: string; q?: string }) {
    const where: any = { status: { in: ['OPEN', 'IN_TALKS'] } };
    if (q.sector) where.sector = q.sector;
    if (q.stage && VALID_STAGES.includes(q.stage)) where.stage = q.stage;
    if (q.q && q.q.trim()) {
      const term = q.q.trim();
      where.OR = [
        { title: { contains: term } },
        { summary: { contains: term } },
        { sector: { contains: term } },
      ];
    }
    const list = await this.prisma.investmentOpportunity.findMany({
      where,
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      take: 200,
    });
    return this.enrichOpps(list);
  }

  async listAdmin(q: { status?: string; sector?: string; q?: string }) {
    const where: any = {};
    if (q.status && VALID_OPP_STATUS.includes(q.status)) where.status = q.status;
    if (q.sector) where.sector = q.sector;
    if (q.q && q.q.trim()) {
      const term = q.q.trim();
      where.OR = [
        { title: { contains: term } },
        { code: { contains: term } },
        { sector: { contains: term } },
      ];
    }
    const list = await this.prisma.investmentOpportunity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 300,
    });
    return this.enrichOpps(list);
  }

  private async getOppRaw(id: string) {
    const opp = await this.prisma.investmentOpportunity.findUnique({
      where: { id },
    });
    if (!opp) throw new NotFoundException('الفرصة غير موجودة');
    return opp;
  }

  async getOne(id: string, user: { id: string; role: string }) {
    const opp = await this.getOppRaw(id);
    const isOwner = opp.founderId === user.id;
    const isAdmin = user.role === 'ADMIN';
    const isPublic = ['OPEN', 'IN_TALKS'].includes(opp.status);
    if (!isOwner && !isAdmin && !isPublic)
      throw new ForbiddenException('غير مصرح لك بعرض هذه الفرصة');
    const [enriched] = await this.enrichOpps([opp]);
    return enriched;
  }

  async updateMine(id: string, founderId: string, b: any) {
    const opp = await this.getOppRaw(id);
    if (opp.founderId !== founderId)
      throw new ForbiddenException('غير مصرح لك بتعديل هذه الفرصة');
    const data: any = {};
    if (b?.title != null) data.title = String(b.title).trim();
    if (b?.summary != null) data.summary = String(b.summary).trim();
    if (b?.description != null) data.description = String(b.description).trim();
    if (b?.sector != null) data.sector = String(b.sector).trim();
    if (b?.stage != null && VALID_STAGES.includes(b.stage)) data.stage = b.stage;
    if (b?.amountSought != null && b.amountSought !== '')
      data.amountSought = Number(b.amountSought);
    if (b?.currency != null) data.currency = String(b.currency).trim() || 'EGP';
    if (b?.equityOffered !== undefined)
      data.equityOffered =
        b.equityOffered === '' || b.equityOffered == null
          ? null
          : Number(b.equityOffered);
    if (b?.useOfFunds !== undefined)
      data.useOfFunds = b.useOfFunds ? String(b.useOfFunds).trim() : null;
    if (b?.location !== undefined)
      data.location = b.location ? String(b.location).trim() : null;
    if (b?.website !== undefined)
      data.website = b.website ? String(b.website).trim() : null;
    if (b?.pitchDeckUrl !== undefined)
      data.pitchDeckUrl = b.pitchDeckUrl ? String(b.pitchDeckUrl).trim() : null;
    if (b?.coverImage !== undefined) data.coverImage = b.coverImage || null;
    // صاحب الفرصة يقدر يقفلها أو يعيد فتحها بس
    if (b?.status != null && ['OPEN', 'CLOSED'].includes(b.status))
      data.status = b.status;
    return this.prisma.investmentOpportunity.update({ where: { id }, data });
  }

  async adminUpdate(id: string, b: any) {
    await this.getOppRaw(id);
    const data: any = {};
    if (b?.status != null && VALID_OPP_STATUS.includes(b.status))
      data.status = b.status;
    if (b?.featured != null) data.featured = !!b.featured;
    if (b?.adminNote !== undefined)
      data.adminNote = b.adminNote ? String(b.adminNote).trim() : null;
    return this.prisma.investmentOpportunity.update({ where: { id }, data });
  }

  // ---------- اهتمامات المستثمرين ----------

  async expressInterest(investorId: string, opportunityId: string, b: any) {
    const opp = await this.getOppRaw(opportunityId);
    if (!['OPEN', 'IN_TALKS'].includes(opp.status))
      throw new BadRequestException('الفرصة غير متاحة للاستثمار حاليًا');
    if (opp.founderId === investorId)
      throw new BadRequestException('لا يمكنك الاستثمار في فرصتك الخاصة');
    const amountOffered =
      b?.amountOffered != null && b.amountOffered !== ''
        ? Number(b.amountOffered)
        : null;
    const message = b?.message ? String(b.message).trim() : null;
    return this.prisma.investmentInterest.upsert({
      where: {
        opportunityId_investorId: { opportunityId, investorId },
      },
      update: { amountOffered, message, status: 'PENDING' },
      create: { opportunityId, investorId, amountOffered, message },
    });
  }

  async listMyInterests(investorId: string) {
    const list = await this.prisma.investmentInterest.findMany({
      where: { investorId },
      orderBy: { createdAt: 'desc' },
    });
    return this.enrichInterests(list);
  }

  async listInterestsForOpportunity(opportunityId: string, founderId: string) {
    const opp = await this.getOppRaw(opportunityId);
    if (opp.founderId !== founderId)
      throw new ForbiddenException('غير مصرح لك بعرض اهتمامات هذه الفرصة');
    const list = await this.prisma.investmentInterest.findMany({
      where: { opportunityId },
      orderBy: { createdAt: 'desc' },
    });
    return this.enrichInterests(list);
  }

  async founderRespond(interestId: string, founderId: string, b: any) {
    const interest = await this.prisma.investmentInterest.findUnique({
      where: { id: interestId },
    });
    if (!interest) throw new NotFoundException('الطلب غير موجود');
    const opp = await this.getOppRaw(interest.opportunityId);
    if (opp.founderId !== founderId)
      throw new ForbiddenException('غير مصرح لك بالرد على هذا الطلب');
    const data: any = {};
    if (b?.status != null && ['ACCEPTED', 'DECLINED'].includes(b.status))
      data.status = b.status;
    if (b?.founderNote !== undefined)
      data.founderNote = b.founderNote ? String(b.founderNote).trim() : null;
    const updated = await this.prisma.investmentInterest.update({
      where: { id: interestId },
      data,
    });
    // عند قبول أول مستثمر، الفرصة تدخل مرحلة التفاوض
    if (data.status === 'ACCEPTED' && opp.status === 'OPEN') {
      await this.prisma.investmentOpportunity.update({
        where: { id: opp.id },
        data: { status: 'IN_TALKS' },
      });
    }
    return updated;
  }
}
