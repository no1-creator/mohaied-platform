import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  create(providerId: string, dto: CreateClientDto) {
    return this.prisma.providerClient.create({
      data: {
        providerId,
        name: dto.name,
        company: dto.company || null,
        email: dto.email || null,
        phone: dto.phone || null,
        whatsapp: dto.whatsapp || null,
        source: dto.source || 'EXTERNAL',
        notes: dto.notes || null,
      },
    });
  }

  list(providerId: string) {
    return this.prisma.providerClient.findMany({
      where: { providerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(providerId: string, id: string) {
    const client = await this.prisma.providerClient.findFirst({
      where: { id, providerId },
    });
    if (!client) throw new NotFoundException('العميل غير موجود');
    return client;
  }

  async update(providerId: string, id: string, dto: UpdateClientDto) {
    await this.get(providerId, id);
    return this.prisma.providerClient.update({
      where: { id },
      data: { ...dto },
    });
  }

  async remove(providerId: string, id: string) {
    await this.get(providerId, id);
    await this.prisma.providerClient.delete({ where: { id } });
    return { ok: true };
  }
}
