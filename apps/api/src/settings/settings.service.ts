import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/settings.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  // نضمن وجود صف إعدادات واحد دايمًا (singleton)
  async get() {
    let settings = await this.prisma.platformSettings.findFirst();
    if (!settings) {
      settings = await this.prisma.platformSettings.create({ data: {} });
    }
    return settings;
  }

  async update(dto: UpdateSettingsDto) {
    const current = await this.get();
    return this.prisma.platformSettings.update({
      where: { id: current.id },
      data: dto,
    });
  }
}
