import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertBusinessSettingsDto } from './dto/business-settings.dto';

@Injectable()
export class BusinessSettingsService {
  constructor(private prisma: PrismaService) {}

  async get(providerId: string) {
    const existing = await this.prisma.providerBusinessSettings.findUnique({
      where: { providerId },
    });
    if (existing) return existing;
    // قيم افتراضية غير مخزّنة لو لسه معملش إعدادات
    return {
      id: null,
      providerId,
      businessName: null,
      logoUrl: null,
      address: null,
      taxNumber: null,
      phone: null,
      email: null,
      website: null,
      defaultCurrency: 'EGP',
      defaultTaxRate: 0,
      defaultPaymentTerms: null,
      invoiceFooter: null,
    };
  }

  async upsert(providerId: string, dto: UpsertBusinessSettingsDto) {
    const data = {
      businessName: dto.businessName ?? null,
      logoUrl: dto.logoUrl ?? null,
      address: dto.address ?? null,
      taxNumber: dto.taxNumber ?? null,
      phone: dto.phone ?? null,
      email: dto.email ?? null,
      website: dto.website ?? null,
      defaultCurrency: dto.defaultCurrency || 'EGP',
      defaultTaxRate: dto.defaultTaxRate ?? 0,
      defaultPaymentTerms: dto.defaultPaymentTerms ?? null,
      invoiceFooter: dto.invoiceFooter ?? null,
    };
    return this.prisma.providerBusinessSettings.upsert({
      where: { providerId },
      create: { providerId, ...data },
      update: data,
    });
  }
}
