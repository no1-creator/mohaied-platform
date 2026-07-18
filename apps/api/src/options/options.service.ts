import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOptionDto, UpdateOptionDto } from './dto/option.dto';

@Injectable()
export class OptionsService {
  constructor(private prisma: PrismaService) {}

  // الخيارات المفعّلة فقط (للنماذج والواجهات)
  async listPublic(groupKey: string) {
    return this.prisma.optionItem.findMany({
      where: { groupKey, isActive: true },
      orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }],
    });
  }

  // كل الخيارات شاملة الموقوفة (لإدارة محايد)
  async listAll(groupKey: string) {
    return this.prisma.optionItem.findMany({
      where: { groupKey },
      orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async create(dto: CreateOptionDto) {
    const groupKey = dto.groupKey.trim();
    const label = dto.label.trim();
    let value = (dto.value && dto.value.trim()) || this.makeValue(label);

    // ضمان عدم تكرار القيمة داخل نفس المجموعة
    const exists = await this.prisma.optionItem.findUnique({
      where: { groupKey_value: { groupKey, value } },
    });
    if (exists) {
      value = `${value}_${Math.floor(Math.random() * 9000 + 1000)}`;
    }

    return this.prisma.optionItem.create({
      data: {
        groupKey,
        value,
        label,
        isActive: dto.isActive ?? true,
        orderIndex: dto.orderIndex ?? 0,
      },
    });
  }

  async update(id: string, dto: UpdateOptionDto) {
    await this.ensure(id);
    return this.prisma.optionItem.update({
      where: { id },
      data: {
        label: dto.label?.trim(),
        isActive: dto.isActive,
        orderIndex: dto.orderIndex,
      },
    });
  }

  async remove(id: string) {
    await this.ensure(id);
    await this.prisma.optionItem.delete({ where: { id } });
    return { ok: true };
  }

  private async ensure(id: string) {
    const item = await this.prisma.optionItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('الخيار غير موجود');
    }
    return item;
  }

  private makeValue(label: string): string {
    const slug = label
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    if (slug) return slug;
    return 'OPT_' + Date.now().toString(36).toUpperCase();
  }
}
