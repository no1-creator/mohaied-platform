import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';

const SENDER_SELECT = {
  id: true,
  fullName: true,
  avatarUrl: true,
  role: true,
};

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  private async assertProjectParty(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, clientId: true, providerId: true },
    });
    if (!project) throw new NotFoundException('المشروع غير موجود');
    if (project.clientId !== userId && project.providerId !== userId) {
      throw new ForbiddenException('ليس لديك صلاحية على هذا المشروع');
    }
    return project;
  }

  async create(userId: string, dto: CreateMessageDto) {
    await this.assertProjectParty(dto.projectId, userId);
    return this.prisma.message.create({
      data: {
        projectId: dto.projectId,
        senderId: userId,
        content: dto.content,
        isSystem: false,
      },
      include: { sender: { select: SENDER_SELECT } },
    });
  }

  async listByProject(projectId: string, userId: string) {
    await this.assertProjectParty(projectId, userId);
    return this.prisma.message.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: SENDER_SELECT } },
    });
  }
}
