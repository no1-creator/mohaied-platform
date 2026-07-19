import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWithdrawalDto, CreateWalletTxnDto } from './dto/wallet.dto';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  private num(v: any): number {
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
  }

  async summary(providerId: string) {
    const [paidInvoices, ledger] = await Promise.all([
      this.prisma.providerInvoice.findMany({
        where: { providerId, status: 'PAID' },
        select: { total: true },
      }),
      this.prisma.providerWalletTransaction.findMany({ where: { providerId } }),
    ]);

    const invoiceEarnings = paidInvoices.reduce((s, i) => s + this.num(i.total), 0);
    const manualEarnings = ledger
      .filter((t) => ['EARNING', 'ADJUSTMENT'].includes(t.type) && t.status === 'COMPLETED')
      .reduce((s, t) => s + this.num(t.amount), 0);
    const grossEarnings = invoiceEarnings + manualEarnings;

    const withdrawnCompleted = ledger
      .filter((t) => t.type === 'WITHDRAWAL' && t.status === 'COMPLETED')
      .reduce((s, t) => s + this.num(t.amount), 0);
    const withdrawnPending = ledger
      .filter((t) => t.type === 'WITHDRAWAL' && t.status === 'PENDING')
      .reduce((s, t) => s + this.num(t.amount), 0);

    const available = grossEarnings - withdrawnCompleted - withdrawnPending;

    return {
      currency: 'EGP',
      grossEarnings,
      invoiceEarnings,
      manualEarnings,
      withdrawnCompleted,
      withdrawnPending,
      available,
    };
  }

  async transactions(providerId: string) {
    const [paidInvoices, ledger] = await Promise.all([
      this.prisma.providerInvoice.findMany({
        where: { providerId, status: 'PAID' },
        select: { id: true, number: true, title: true, total: true, currency: true, paidAt: true, createdAt: true },
      }),
      this.prisma.providerWalletTransaction.findMany({
        where: { providerId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const invoiceRows = paidInvoices.map((i) => ({
      id: `inv-${i.id}`,
      type: 'EARNING',
      amount: this.num(i.total),
      currency: i.currency || 'EGP',
      status: 'COMPLETED',
      description: `فاتورة مدفوعة${i.number ? ` — ${i.number}` : ''}${i.title ? ` (${i.title})` : ''}`,
      refType: 'INVOICE',
      refId: i.id,
      date: i.paidAt || i.createdAt,
    }));

    const ledgerRows = ledger.map((t) => ({
      id: t.id,
      type: t.type,
      amount: this.num(t.amount),
      currency: t.currency || 'EGP',
      status: t.status,
      description: t.description || null,
      method: t.method || null,
      refType: t.refType || null,
      refId: t.refId || null,
      date: t.createdAt,
    }));

    return [...invoiceRows, ...ledgerRows].sort(
      (a, b) => new Date(b.date as any).getTime() - new Date(a.date as any).getTime(),
    );
  }

  async requestWithdrawal(providerId: string, dto: CreateWithdrawalDto) {
    const amount = Number(dto.amount);
    if (!amount || amount <= 0) throw new BadRequestException('اكتب مبلغ صحيح');
    const { available } = await this.summary(providerId);
    if (amount > available) throw new BadRequestException('المبلغ أكبر من رصيدك المتاح');
    return this.prisma.providerWalletTransaction.create({
      data: {
        providerId,
        type: 'WITHDRAWAL',
        amount,
        currency: 'EGP',
        status: 'PENDING',
        method: dto.method || null,
        description: dto.note || null,
        refType: 'MANUAL',
      },
    });
  }

  async cancelWithdrawal(providerId: string, id: string) {
    const tx = await this.prisma.providerWalletTransaction.findFirst({ where: { id, providerId } });
    if (!tx || tx.type !== 'WITHDRAWAL') throw new NotFoundException('طلب السحب غير موجود');
    if (tx.status !== 'PENDING') throw new BadRequestException('لا يمكن إلغاء هذا الطلب');
    return this.prisma.providerWalletTransaction.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  async addManual(providerId: string, dto: CreateWalletTxnDto) {
    const type = (dto.type || 'EARNING').toUpperCase();
    if (!['EARNING', 'ADJUSTMENT'].includes(type)) throw new BadRequestException('نوع غير صحيح');
    const amount = Number(dto.amount);
    if (Number.isNaN(amount)) throw new BadRequestException('مبلغ غير صحيح');
    return this.prisma.providerWalletTransaction.create({
      data: {
        providerId,
        type,
        amount,
        currency: 'EGP',
        status: 'COMPLETED',
        description: dto.description || null,
        refType: 'MANUAL',
      },
    });
  }
}
