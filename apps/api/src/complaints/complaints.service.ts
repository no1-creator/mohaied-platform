import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateComplaintDto,
  RespondComplaintDto,
  DecideComplaintDto,
} from './dto/complaint.dto';
import { ComplaintStatus, ProjectStatus } from '@prisma/client';

@Injectable()
export class ComplaintsService {
  constructor(private prisma: PrismaService) {}

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

    return this.prisma.$transaction(async (tx) => {
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

    return this.prisma.$transaction(async (tx) => {
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
  }

  // رسالة من المُحكّم (إدارة محايد) وتحويل النزاع لمرحلة التحكيم
  async arbitrate(
    complaintId: string,
    adminId: string,
    dto: RespondComplaintDto,
  ) {
    const complaint = await this.getComplaintWithProject(complaintId);

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
          responderId: adminId,
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
          actorId: adminId,
          action: 'COMPLAINT_ARBITRATION_MESSAGE',
          metadata: { complaintId, responseId: response.id },
        },
      });

      return response;
    });
  }

  // قرار إدارة محايد
  async decide(
    complaintId: string,
    adminId: string,
    dto: DecideComplaintDto,
  ) {
    const complaint = await this.getComplaintWithProject(complaintId);

    if (
      complaint.status === ComplaintStatus.RESOLVED ||
      complaint.status === ComplaintStatus.CLOSED
    ) {
      throw new BadRequestException('تم حسم هذه الشكوى بالفعل');
    }

    return this.prisma.$transaction(async (tx) => {
      const decision = await tx.decision.create({
        data: {
          complaintId,
          type: dto.type,
          customType: dto.customType,
          reason: dto.reason,
          decidedById: adminId,
        },
      });

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
          actorId: adminId,
          action: 'COMPLAINT_DECIDED',
          metadata: { complaintId, decisionType: dto.type },
        },
      });

      return decision;
    });
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
    if (!isParty && role !== 'ADMIN') {
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

  private async generateCode(): Promise<string> {
    const count = await this.prisma.complaint.count();
    return `C-${1000 + count + 1}`;
  }
}
