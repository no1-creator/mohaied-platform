import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type CreateLegalRequestInput = {
  category: string;
  title: string;
  description: string;
  entityName?: string;
  nationality?: string;
  budget?: number;
  preferredContact?: string;
  attachments?: string;
};

type AdminUpdateInput = {
  status?: string;
  assignedConsultantId?: string | null;
  adminNote?: string;
};

type ConsultantUpdateInput = {
  status?: string;
  consultantNote?: string;
};

const VALID_CATEGORIES = [
  'IP_PROTECTION',
  'COMPANY_FORMATION',
  'FOREIGNER_CASE',
  'GENERAL_CONSULT',
  'OTHER',
];

const VALID_STATUSES = [
  'SUBMITTED',
  'IN_REVIEW',
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
  'REJECTED',
];

@Injectable()
export class LegalService {
  constructor(private prisma: PrismaService) {}

  private genCode() {
    const year = new Date().getFullYear();
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `LEG-${year}-${rand}`;
  }

  // بنضيف اسم العميل واسم المستشار على كل طلب (استعلام مجمّع آمن)
  private async enrich(requests: any[]) {
    const ids = new Set<string>();
    for (const r of requests) {
      if (r.clientId) ids.add(r.clientId);
      if (r.assignedConsultantId) ids.add(r.assignedConsultantId);
    }
    const users = ids.size
      ? await this.prisma.user.findMany({
          where: { id: { in: Array.from(ids) } },
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        })
      : [];
    const map = new Map(users.map((u) => [u.id, u]));
    return requests.map((r) => ({
      ...r,
      client: map.get(r.clientId) ?? null,
      assignedConsultant: r.assignedConsultantId
        ? map.get(r.assignedConsultantId) ?? null
        : null,
    }));
  }

  async create(clientId: string, dto: CreateLegalRequestInput) {
    const category = VALID_CATEGORIES.includes(dto.category)
      ? dto.category
      : 'OTHER';
    return this.prisma.legalRequest.create({
      data: {
        code: this.genCode(),
        clientId,
        category: category as any,
        title: dto.title,
        description: dto.description,
        entityName: dto.entityName,
        nationality: dto.nationality,
        budget: dto.budget,
        preferredContact: dto.preferredContact,
        attachments: dto.attachments,
      },
    });
  }

  async listMine(clientId: string) {
    const rows = await this.prisma.legalRequest.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });
    return this.enrich(rows);
  }

  async listAll(filters: { status?: string; category?: string; q?: string }) {
    const where: any = {};
    if (filters.status && VALID_STATUSES.includes(filters.status))
      where.status = filters.status;
    if (filters.category && VALID_CATEGORIES.includes(filters.category))
      where.category = filters.category;
    if (filters.q) {
      where.OR = [
        { title: { contains: filters.q } },
        { description: { contains: filters.q } },
        { code: { contains: filters.q } },
      ];
    }
    const rows = await this.prisma.legalRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return this.enrich(rows);
  }

  async listAssigned(consultantId: string) {
    const rows = await this.prisma.legalRequest.findMany({
      where: { assignedConsultantId: consultantId },
      orderBy: { createdAt: 'desc' },
    });
    return this.enrich(rows);
  }

  async getOne(id: string, user: { id: string; role: string }) {
    const row = await this.prisma.legalRequest.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('الطلب غير موجود');
    const isOwner = row.clientId === user.id;
    const isAssigned = row.assignedConsultantId === user.id;
    const isAdmin = user.role === 'ADMIN';
    if (!isOwner && !isAssigned && !isAdmin) {
      throw new ForbiddenException('غير مسموح لك بعرض هذا الطلب');
    }
    const [enriched] = await this.enrich([row]);
    return enriched;
  }

  async adminUpdate(id: string, dto: AdminUpdateInput) {
    const existing = await this.prisma.legalRequest.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('الطلب غير موجود');
    const data: any = {};
    if (dto.status !== undefined && VALID_STATUSES.includes(dto.status))
      data.status = dto.status;
    if (dto.assignedConsultantId !== undefined)
      data.assignedConsultantId = dto.assignedConsultantId || null;
    if (dto.adminNote !== undefined) data.adminNote = dto.adminNote;

    // لو تم التعيين والحالة لسه في البداية، خليها ASSIGNED تلقائيًا
    if (
      data.assignedConsultantId &&
      dto.status === undefined &&
      (existing.status === 'SUBMITTED' || existing.status === 'IN_REVIEW')
    ) {
      data.status = 'ASSIGNED';
    }
    if (data.status === 'RESOLVED' || data.status === 'CLOSED') {
      data.resolvedAt = new Date();
    }

    await this.prisma.legalRequest.update({ where: { id }, data });
    return this.getOneRaw(id);
  }

  async consultantUpdate(
    id: string,
    consultantId: string,
    dto: ConsultantUpdateInput,
  ) {
    const existing = await this.prisma.legalRequest.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('الطلب غير موجود');
    if (existing.assignedConsultantId !== consultantId) {
      throw new ForbiddenException('هذا الطلب غير معيّن لك');
    }
    const data: any = {};
    if (dto.status !== undefined && VALID_STATUSES.includes(dto.status))
      data.status = dto.status;
    if (dto.consultantNote !== undefined)
      data.consultantNote = dto.consultantNote;
    if (data.status === 'RESOLVED' || data.status === 'CLOSED') {
      data.resolvedAt = new Date();
    }

    await this.prisma.legalRequest.update({ where: { id }, data });
    return this.getOneRaw(id);
  }

  private async getOneRaw(id: string) {
    const row = await this.prisma.legalRequest.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('الطلب غير موجود');
    const [enriched] = await this.enrich([row]);
    return enriched;
  }
}
