import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateInvitationDto,
  UpdateInvitationStatusDto,
} from './dto/invitation.dto';
import { InvitationStatus } from '@prisma/client';

@Injectable()
export class InvitationsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(clientId: string, dto: CreateInvitationDto) {
    if (!dto.inviteeEmail && !dto.inviteePhone) {
      throw new BadRequestException(
        'لازم تضيف إيميل أو رقم تليفون لمقدم الخدمة عشان نقدر نتواصل معاه.',
      );
    }

    const invitation = await this.prisma.externalInvitation.create({
      data: {
        clientId,
        inviteeName: dto.inviteeName,
        inviteeEmail: dto.inviteeEmail,
        inviteePhone: dto.inviteePhone,
        inviteeType: dto.inviteeType,
        projectTitle: dto.projectTitle,
        field: dto.field,
        projectDescription: dto.projectDescription,
        budgetMin: dto.budgetMin,
        budgetMax: dto.budgetMax,
        durationDays: dto.durationDays,
        message: dto.message,
      },
    });

    await this.notifications.create({
      userId: clientId,
      type: 'GENERAL',
      title: 'استلمنا طلب دعوة مقدم خدمة',
      body: 'فريق محايد هيتواصل مع الطرف اللي دعوته ويجهّز التعاقد الموثّق.',
      linkUrl: `/projects/invite/${invitation.id}`,
    });

    return invitation;
  }

  findMine(clientId: string) {
    return this.prisma.externalInvitation.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneForUser(id: string, userId: string, role: string) {
    const invitation = await this.prisma.externalInvitation.findUnique({
      where: { id },
    });
    if (!invitation) {
      throw new NotFoundException('الدعوة غير موجودة');
    }
    if (role !== 'ADMIN' && invitation.clientId !== userId) {
      throw new ForbiddenException('ليس لديك صلاحية لعرض هذه الدعوة');
    }
    return invitation;
  }

  findAllForAdmin() {
    return this.prisma.externalInvitation.findMany({
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: {
        client: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  async updateStatus(id: string, dto: UpdateInvitationStatusDto) {
    const invitation = await this.prisma.externalInvitation.findUnique({
      where: { id },
    });
    if (!invitation) {
      throw new NotFoundException('الدعوة غير موجودة');
    }

    const updated = await this.prisma.externalInvitation.update({
      where: { id },
      data: {
        status: dto.status as InvitationStatus,
        adminNote: dto.adminNote ?? invitation.adminNote,
      },
    });

    await this.notifications.create({
      userId: invitation.clientId,
      type: 'GENERAL',
      title: 'تحديث على دعوتك',
      body: 'فيه تحديث على حالة دعوة مقدم الخدمة اللي طلبتها — اطّلع على التفاصيل.',
      linkUrl: `/projects/invite/${id}`,
    });

    return updated;
  }
}
