import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateComplaintDto,
  RespondComplaintDto,
  DecideComplaintDto,
  AssignArbitratorDto,
} from './dto/complaint.dto';
import {
  ComplaintStatus,
  ProjectStatus,
  DecisionType,
  EscrowStatus,
  InvoiceType,
  InvoiceStatus,
} from '@prisma/client';

@Injectable()
export class ComplaintsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // فتح شكوى (العميل أو مقدم الخدمة)
  async create(userId: string, dto: CreateComplaintDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });
    if (!project) {
      throw new NotFoundException('المشروع غير موجود');
    }
    if (project.clientId !== userId && project.providerId !== userId) {
      throw new ForbiddenException('لست طرفًا في هذا المشروع');
    }

    const code = await this.generateCode();

    const evidenceRows = [
  ...(dto.evidenceImages || [])
    .filter((u) => typeof u === 'string' && u.trim().length > 0)
    .map((fileUrl) => ({ fileUrl })),
  ...(dto.evidenceLinks || [])
    .filter((l) => typeof l === 'string' && l.trim().length > 0)
    .map((link) => ({ link })),
];

const created = await this.prisma.$transaction(async (tx) => {
  const complaint = await tx.complaint.create({
    data: {
      code,
      projectId: dto.projectId,
      milestoneId: dto.milestoneId,
      creatorId: userId,
      type: dto.type,
      customType: dto.customType,
      details: dto.details,
      status: ComplaintStatus.AWAITING_RESPONSE,
      evidences: evidenceRows.length
        ? { create: evidenceRows }
        : undefined,
    },
  });
      await tx.project.update({
        where: { id: dto.projectId },
        data: { status: ProjectStatus.DISPUTED },
      });

      await tx.activityLog.create({
        data: {
          projectId: dto.projectId,
          actorId: userId,
          action: 'COMPLAINT_OPENED',
          metadata: { complaintId: complaint.id, code },
        },
      });

      return complaint;
    });

    // 🔔 إشعار للطرف الآخر بفتح الشكوى
    const otherPartyId =
      project.clientId === userId ? project.providerId : project.clientId;
    if (otherPartyId) {
      await this.notifications.create({
        userId: otherPartyId,
        type: 'COMPLAINT',
        title: 'تم فتح شكوى على مشروعك',
        body: `تم فتح شكوى (${created.code}) على مشروع «${project.title}».`,
        linkUrl: `/complaints/${created.id}`,
      });
    }

    return created;
  }

  // رد الطرف الآخر
  async respond(
    complaintId: string,
    userId: string,
    dto: RespondComplaintDto,
  ) {
    const complaint = await this.getComplaintWithProject(complaintId);

    const isParty =
      complaint.project.clientId === userId ||
      complaint.project.providerId === userId;
    if (!isParty) {
      throw new ForbiddenException('لست طرفًا في هذا المشروع');
    }

    if (
      complaint.status === ComplaintStatus.RESOLVED ||
      complaint.status === ComplaintStatus.CLOSED
    ) {
      throw new BadRequestException('تم حسم هذا النزاع ولا يمكن إضافة ردود جديدة');
    }

    const createdResp = await this.prisma.$transaction(async (tx) => {
      const response = await tx.complaintResponse.create({
        data: {
          complaintId,
          responderId: userId,
          message: dto.message,
        },
      });

      if (complaint.status === ComplaintStatus.AWAITING_RESPONSE) {
        await tx.complaint.update({
          where: { id: complaintId },
          data: { status: ComplaintStatus.UNDER_REVIEW },
        });
      }

      await tx.activityLog.create({
        data: {
          projectId: complaint.projectId,
          actorId: userId,
          action: 'COMPLAINT_RESPONSE',
          metadata: { complaintId, responseId: response.id },
        },
      });

      return response;
    });

    // 🔔 إشعار للطرف الآخر بوجود رد جديد
    const otherId =
      complaint.project.clientId === userId
        ? complaint.project.providerId
        : complaint.project.clientId;
    if (otherId && otherId !== userId) {
      await this.notifications.create({
        userId: otherId,
        type: 'COMPLAINT',
        title: 'رد جديد على النزاع',
        body: `تم إضافة رد جديد على النزاع (${complaint.code}) في مشروع «${complaint.project.title}».`,
        linkUrl: `/complaints/${complaintId}`,
      });
    }

    return createdResp;
  }

  // تعيين مشرف كمُحكّم تقني على النزاع (إدارة محايد)
  async assignArbitrator(
    complaintId: string,
    adminId: string,
    dto: AssignArbitratorDto,
  ) {
    const complaint = await this.getComplaintWithProject(complaintId);

    if (
      complaint.status === ComplaintStatus.RESOLVED ||
      complaint.status === ComplaintStatus.CLOSED
    ) {
      throw new BadRequestException('تم حسم هذا النزاع بالفعل');
    }

    const supervisor = await this.prisma.user.findUnique({
      where: { id: dto.supervisorId },
    });
    if (!supervisor || supervisor.role !== 'SUPERVISOR') {
      throw new BadRequestException('المستخدم المختار ليس مشرفًا على المنصة');
    }
    if (!supervisor.isActive) {
      throw new BadRequestException('هذا المشرف غير مُفعّل حاليًا');
    }

    const createdAssign = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.complaint.update({
        where: { id: complaintId },
        data: {
          arbitratorId: dto.supervisorId,
          status: ComplaintStatus.IN_ARBITRATION,
        },
      });

      // رسالة نظام داخل سجل النزاع توضّح تعيين المُحكّم
      await tx.complaintResponse.create({
        data: {
          complaintId,
          responderId: adminId,
          message: `تم تعيين المشرف «${supervisor.fullName}» مُحكّمًا تقنيًا على هذا النزاع من قِبل إدارة محايد.`,
        },
      });

      await tx.activityLog.create({
        data: {
          projectId: complaint.projectId,
          actorId: adminId,
          action: 'COMPLAINT_ARBITRATOR_ASSIGNED',
          metadata: {
            complaintId,
            arbitratorId: dto.supervisorId,
            arbitratorName: supervisor.fullName,
          },
        },
      });

      return updated;
    });

    // 🔔 إشعار للمشرف بتعيينه مُحكّمًا
    await this.notifications.create({
      userId: dto.supervisorId,
      type: 'SUPERVISOR',
      title: 'تم تعيينك مُحكّمًا على نزاع',
      body: `تم تعيينك مُحكّمًا تقنيًا على نزاع (${complaint.code}) في مشروع «${complaint.project.title}».`,
      linkUrl: `/complaints/${complaintId}`,
    });

    return createdAssign;
  }

  // رسالة من المُحكّم (إدارة محايد أو المشرف المُحكّم) وتحويل النزاع لمرحلة التحكيم
  async arbitrate(
    complaintId: string,
    actorId: string,
    role: string,
    dto: RespondComplaintDto,
  ) {
    const complaint = await this.getComplaintWithProject(complaintId);
    this.assertCanArbitrate(complaint, actorId, role);

    if (
      complaint.status === ComplaintStatus.RESOLVED ||
      complaint.status === ComplaintStatus.CLOSED
    ) {
      throw new BadRequestException('تم حسم هذا النزاع بالفعل');
    }

    return this.prisma.$transaction(async (tx) => {
      const response = await tx.complaintResponse.create({
        data: {
          complaintId,
          responderId: actorId,
          message: dto.message,
        },
      });

      await tx.complaint.update({
        where: { id: complaintId },
        data: { status: ComplaintStatus.IN_ARBITRATION },
      });

      await tx.activityLog.create({
        data: {
          projectId: complaint.projectId,
          actorId: actorId,
          action: 'COMPLAINT_ARBITRATION_MESSAGE',
          metadata: { complaintId, responseId: response.id },
        },
      });

      return response;
    });
  }

  // قرار المُحكّم (إدارة محايد أو المشرف المُحكّم) + تنفيذ التسوية المالية على الضمان
  async decide(
    complaintId: string,
    actorId: string,
    role: string,
    dto: DecideComplaintDto,
  ) {
    const complaint = await this.getComplaintWithProject(complaintId);
    this.assertCanArbitrate(complaint, actorId, role);

    if (
      complaint.status === ComplaintStatus.RESOLVED ||
      complaint.status === ComplaintStatus.CLOSED
    ) {
      throw new BadRequestException('تم حسم هذه الشكوى بالفعل');
    }

    const createdDecision = await this.prisma.$transaction(async (tx) => {
      const decision = await tx.decision.create({
        data: {
          complaintId,
          type: dto.type,
          customType: dto.customType,
          reason: dto.reason,
          decidedById: actorId,
        },
      });

      // ===== تنفيذ التسوية المالية على الضمان حسب نوع القرار =====
      // لصالح العميل → استرجاع الأموال المحجوزة | لصالح مقدّم الخدمة → تحريرها له
      const settlement: {
        action: 'REFUNDED' | 'RELEASED' | 'NONE';
        escrowIds: string[];
        total: number;
      } = { action: 'NONE', escrowIds: [], total: 0 };

      if (
        dto.type === DecisionType.FAVOR_CLIENT ||
        dto.type === DecisionType.FAVOR_PROVIDER
      ) {
        // لو النزاع على مرحلة محددة → ننفّذ على ضمانها فقط،
        // وإلا ننفّذ على المبالغ المتنازع عليها في المشروع كله.
        const where = complaint.milestoneId
          ? {
              milestoneId: complaint.milestoneId,
              status: { in: [EscrowStatus.FUNDED, EscrowStatus.DISPUTED] },
            }
          : {
              projectId: complaint.projectId,
              status: EscrowStatus.DISPUTED,
            };

        const targets = await tx.escrowTransaction.findMany({
          where,
          include: { milestone: { select: { title: true } } },
        });

        const toClient = dto.type === DecisionType.FAVOR_CLIENT;

        for (const esc of targets) {
          if (toClient) {
            await tx.escrowTransaction.update({
              where: { id: esc.id },
              data: {
                status: EscrowStatus.REFUNDED,
                refundedAt: new Date(),
              },
            });
          } else {
            await tx.escrowTransaction.update({
              where: { id: esc.id },
              data: {
                status: EscrowStatus.RELEASED,
                releasedAt: new Date(),
              },
            });

            // فاتورة عمولة المنصة عند التحرير لمقدّم الخدمة بقرار تحكيم
            await tx.invoice.create({
              data: {
                code: this.genInvoiceCode(),
                userId: complaint.project.clientId,
                type: InvoiceType.COMMISSION,
                status: InvoiceStatus.PAID,
                amount: esc.commissionAmount,
                description: `عمولة المنصة (قرار تحكيم) على مرحلة: ${esc.milestone?.title ?? ''}`,
                escrowId: esc.id,
                paidAt: new Date(),
              },
            });
          }

          settlement.escrowIds.push(esc.id);
          settlement.total += Number(esc.amount);
        }

        settlement.action = toClient ? 'REFUNDED' : 'RELEASED';
      }

      await tx.complaint.update({
        where: { id: complaintId },
        data: { status: ComplaintStatus.RESOLVED },
      });

      // رجوع المشروع لحالة التنفيذ بعد حل النزاع
      await tx.project.update({
        where: { id: complaint.projectId },
        data: { status: ProjectStatus.IN_PROGRESS },
      });

      await tx.activityLog.create({
        data: {
          projectId: complaint.projectId,
          actorId: actorId,
          action: 'COMPLAINT_DECIDED',
          metadata: {
            complaintId,
            decisionType: dto.type,
            decidedByRole: role,
            settlementAction: settlement.action,
            settledEscrowIds: settlement.escrowIds,
            settledTotal: settlement.total,
          },
        },
      });

      return { ...decision, settlement };
    });

    // 🔔 إشعار طرفَي النزاع بصدور القرار
    const parties = [
      complaint.project.clientId,
      complaint.project.providerId,
    ].filter((x): x is string => !!x);
    await this.notifications.createMany(parties, {
      type: 'COMPLAINT',
      title: 'صدر قرار في النزاع',
      body: `صدر قرار نهائي في النزاع (${complaint.code}) على مشروع «${complaint.project.title}».`,
      linkUrl: `/complaints/${complaintId}`,
    });

    return createdDecision;
  }

  async findOne(complaintId: string, userId: string, role: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
      include: {
        project: { select: { id: true, title: true, clientId: true, providerId: true } },
        evidences: true,
        responses: { orderBy: { createdAt: 'asc' } },
        decision: true,
      },
    });
    if (!complaint) {
      throw new NotFoundException('الشكوى غير موجودة');
    }

    const isParty =
      complaint.project.clientId === userId ||
      complaint.project.providerId === userId;
    const isArbiter =
      !!complaint.arbitratorId && complaint.arbitratorId === userId;
    if (!isParty && role !== 'ADMIN' && !isArbiter) {
      throw new ForbiddenException('ليس لديك صلاحية لعرض هذه الشكوى');
    }

    return complaint;
  }

  async findAllForAdmin() {
    return this.prisma.complaint.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        project: { select: { id: true, title: true } },
        decision: true,
      },
    });
  }

  // النزاعات المُسندة للمستخدم الحالي كمُحكّم تقني
  async findForArbitrator(userId: string) {
    return this.prisma.complaint.findMany({
      where: { arbitratorId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        project: { select: { id: true, title: true } },
        decision: true,
      },
    });
  }

  // شكاوى/نزاعات المستخدم الحالي (كعميل أو مقدم خدمة)
  async findForUser(userId: string) {
    return this.prisma.complaint.findMany({
      where: {
        project: {
          OR: [{ clientId: userId }, { providerId: userId }],
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        project: { select: { id: true, title: true } },
        decision: true,
      },
    });
  }

  private async getComplaintWithProject(complaintId: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
      include: { project: true },
    });
    if (!complaint) {
      throw new NotFoundException('الشكوى غير موجودة');
    }
    return complaint;
  }

  // صلاحية التحكيم: الأدمن دائمًا، أو المشرف المُعيَّن مُحكّمًا على هذا النزاع تحديدًا
  private assertCanArbitrate(
    complaint: { arbitratorId: string | null },
    actorId: string,
    role: string,
  ) {
    const isAdmin = role === 'ADMIN';
    const isAssignedArbiter =
      !!complaint.arbitratorId && complaint.arbitratorId === actorId;
    if (!isAdmin && !isAssignedArbiter) {
      throw new ForbiddenException('غير مصرح لك بالتحكيم في هذا النزاع');
    }
  }

  private async generateCode(): Promise<string> {
    const count = await this.prisma.complaint.count();
    return `C-${1000 + count + 1}`;
  }

  private genInvoiceCode(): string {
    return (
      'INV-' +
      Date.now().toString(36).toUpperCase() +
      Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0')
    );
  }
}
