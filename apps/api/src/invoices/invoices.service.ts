import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  InvoiceItemDto,
} from './dto/invoice.dto';

const CLIENT_SELECT = { id: true, name: true, company: true };

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  private parse(s?: string | null): any[] {
    if (!s) return [];
    try {
      const a = JSON.parse(s);
      return Array.isArray(a) ? a : [];
    } catch {
      return [];
    }
  }

  private compute(items: InvoiceItemDto[] | any[], taxRate?: number, discount?: number) {
    const subtotal = (items || []).reduce(
      (s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0),
      0,
    );
    const tax = (subtotal * (Number(taxRate) || 0)) / 100;
    const total = subtotal + tax - (Number(discount) || 0);
    return { subtotal, total };
  }

  private async attachClient(providerId: string, inv: any) {
    let client = null;
    if (inv.clientId) {
      client = await this.prisma.providerClient.findFirst({
        where: { id: inv.clientId, providerId },
        select: CLIENT_SELECT,
      });
    }
    return { ...inv, items: this.parse(inv.items), client };
  }

  async create(providerId: string, dto: CreateInvoiceDto) {
    const items = dto.items || [];
    const { subtotal, total } = this.compute(items, dto.taxRate, dto.discount);
    const inv = await this.prisma.invoice.create({
      data: {
        providerId,
        clientId: dto.clientId || null,
        number: dto.number || `INV-${Date.now()}`,
        title: dto.title || null,
        status: dto.status || 'DRAFT',
        currency: dto.currency || 'EGP',
        items: JSON.stringify(items),
        subtotal,
        taxRate: dto.taxRate ?? 0,
        discount: dto.discount ?? 0,
        total,
        notes: dto.notes || null,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        paidAt: dto.status === 'PAID' ? new Date() : null,
      },
    });
    return this.attachClient(providerId, inv);
  }

  async list(providerId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { providerId },
      orderBy: { createdAt: 'desc' },
    });
    const clientIds = Array.from(
      new Set(invoices.map((i) => i.clientId).filter(Boolean)),
    ) as string[];
    const clients = clientIds.length
      ? await this.prisma.providerClient.findMany({
          where: { id: { in: clientIds } },
          select: CLIENT_SELECT,
        })
      : [];
    const map = new Map(clients.map((c) => [c.id, c]));
    return invoices.map((i) => ({
      ...i,
      items: this.parse(i.items),
      client: i.clientId ? map.get(i.clientId) || null : null,
    }));
  }

  async get(providerId: string, id: string) {
    const inv = await this.prisma.invoice.findFirst({ where: { id, providerId } });
    if (!inv) throw new NotFoundException('الفاتورة غير موجودة');
    return this.attachClient(providerId, inv);
  }

  async update(providerId: string, id: string, dto: UpdateInvoiceDto) {
    const current = await this.prisma.invoice.findFirst({ where: { id, providerId } });
    if (!current) throw new NotFoundException('الفاتورة غير موجودة');

    const data: any = {};
    if ('clientId' in dto) data.clientId = dto.clientId || null;
    if ('number' in dto) data.number = dto.number || null;
    if ('title' in dto) data.title = dto.title || null;
    if ('currency' in dto) data.currency = dto.currency || 'EGP';
    if ('notes' in dto) data.notes = dto.notes || null;
    if ('issueDate' in dto) data.issueDate = dto.issueDate ? new Date(dto.issueDate) : null;
    if ('dueDate' in dto) data.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    if ('status' in dto) {
      data.status = dto.status;
      data.paidAt = dto.status === 'PAID' ? new Date() : null;
    }

    if ('items' in dto || 'taxRate' in dto || 'discount' in dto) {
      const items = 'items' in dto ? dto.items || [] : this.parse(current.items);
      const taxRate = 'taxRate' in dto ? dto.taxRate : Number(current.taxRate);
      const discount = 'discount' in dto ? dto.discount : Number(current.discount);
      const { subtotal, total } = this.compute(items, taxRate, discount);
      data.items = JSON.stringify(items);
      data.taxRate = taxRate ?? 0;
      data.discount = discount ?? 0;
      data.subtotal = subtotal;
      data.total = total;
    }

    const updated = await this.prisma.invoice.update({ where: { id }, data });
    return this.attachClient(providerId, updated);
  }

  async remove(providerId: string, id: string) {
    const current = await this.prisma.invoice.findFirst({ where: { id, providerId } });
    if (!current) throw new NotFoundException('الفاتورة غير موجودة');
    await this.prisma.invoice.delete({ where: { id } });
    return { ok: true };
  }
}
