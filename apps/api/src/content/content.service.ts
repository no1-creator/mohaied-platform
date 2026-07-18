import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertContentDto, UpdateContentDto } from './dto/content.dto';

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

  // كل المحتوى كخريطة { key: value } للاستهلاك في الواجهات
  async publicMap() {
    const items = await this.prisma.siteContent.findMany();
    const map: Record<string, string> = {};
    for (const it of items) map[it.key] = it.value;
    return map;
  }

  // كل العناصر بالتفاصيل (لإدارة محايد) — مع إمكانية الفلترة بالمجموعة
  listAll(groupKey?: string) {
    return this.prisma.siteContent.findMany({
      where: groupKey ? { groupKey } : undefined,
      orderBy: [{ groupKey: 'asc' }, { orderIndex: 'asc' }, { createdAt: 'asc' }],
    });
  }

  // إنشاء أو تعديل مفتاح محتوى
  async upsert(dto: UpsertContentDto) {
    const key = dto.key.trim();
    return this.prisma.siteContent.upsert({
      where: { key },
      create: {
        key,
        value: dto.value,
        groupKey: dto.groupKey?.trim() || 'general',
        label: dto.label?.trim(),
        type: dto.type?.trim() || 'text',
        orderIndex: dto.orderIndex ?? 0,
      },
      update: {
        value: dto.value,
        ...(dto.groupKey !== undefined ? { groupKey: dto.groupKey.trim() } : {}),
        ...(dto.label !== undefined ? { label: dto.label.trim() } : {}),
        ...(dto.type !== undefined ? { type: dto.type.trim() } : {}),
        ...(dto.orderIndex !== undefined ? { orderIndex: dto.orderIndex } : {}),
      },
    });
  }

  async update(id: string, dto: UpdateContentDto) {
    await this.ensure(id);
    return this.prisma.siteContent.update({
      where: { id },
      data: {
        value: dto.value,
        label: dto.label?.trim(),
        type: dto.type?.trim(),
        orderIndex: dto.orderIndex,
      },
    });
  }

  async remove(id: string) {
    await this.ensure(id);
    await this.prisma.siteContent.delete({ where: { id } });
    return { ok: true };
  }

  // إنشاء مفاتيح افتراضية دفعة واحدة بدون استبدال الموجود
  async ensureMany(items: UpsertContentDto[]) {
    let created = 0;
    for (const it of items) {
      const key = it.key.trim();
      const found = await this.prisma.siteContent.findUnique({ where: { key } });
      if (!found) {
        await this.prisma.siteContent.create({
          data: {
            key,
            value: it.value,
            groupKey: it.groupKey?.trim() || 'general',
            label: it.label?.trim(),
            type: it.type?.trim() || 'text',
            orderIndex: it.orderIndex ?? 0,
          },
        });
        created++;
      }
    }
    return { created };
  }

  private async ensure(id: string) {
    const item = await this.prisma.siteContent.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('المحتوى غير موجود');
    }
    return item;
  }
}
