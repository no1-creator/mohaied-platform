import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  InviteSupervisorDto,
  RespondInviteDto,
  CreateReportDto,
} from './dto/supervisor.dto';
import {
  SupervisorAssignmentStatus,
  SupervisorReportStatus,
  UserRole,
} from '@prisma/client';

@Injectable()
export class SupervisorsService {
  constructor(private prisma: PrismaService) {}

  // العميل يدعو مشرف للمشروع
  async invite(clientId: string, dto: InviteSupervisorDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });
    if (!project) {
      throw new NotFoundException('المشروع غير موجود');
    }
    if (project.clientId !== clientId) {
      throw new ForbiddenException('لست صاحب هذا المشروع');
    }

    const supervisor = await this.prisma.user.findUnique({
      where: { id: dto.supervisorId },
    });
    if (!supervisor || supervisor.role !== UserRole.SUPERVISOR) {
      throw new BadRequestException('المستخدم المحدد ليس مشرفًا');
    }

    const existing = await this.prisma.supervisorAssignment.findFirst({
      where: {
        projectId: dto.projectId,
        supervisorId: dto.supervisorId,
        status: {
          in: [
            SupervisorAssignmentStatus.INVITED,
            SupervisorAssignmentStatus.ACCEPTED,
            SupervisorAssignmentStatus.ACTIVE,
          ],
        },
      },
    });
    if (existing) {
      throw new ConflictException('يوجد تكليف قائم لهذا المشرف على المشروع');
    }

    const assignment = await this.prisma.supervisorAssignment.create({
      data: {
        projectId: dto.projectId,
        supervisorId: dto.supervisorId,
        ratePerReview: dto.ratePerReview,
        status: SupervisorAssignmentStatus.INVITED,
      },
    });

    await this.prisma.activityLog.create({
      data: {
        projectId: dto.projectId,
        actorId: clientId,
        action: 'SUPERVISOR_INVITED',
        metadata: { assignmentId: assignment.id, supervisorId: dto.supervisorId },
      },
    });

    return assignment;
  }

  // المشرف يقبل أو يرفض التكليف
  async respondInvite(
    assignmentId: string,
    supervisorId: string,
    dto: RespondInviteDto,
  ) {
    const assignment = await this.prisma.supervisorAssignment.findUnique({
      where: { id: assignmentId },
    });
    if (!assignment) {
      throw new NotFoundException('التكليف غير موجود');
    }
    if (assignment.supervisorId !== supervisorId) {
      throw new ForbiddenException('هذا التكليف ليس لك');
    }
    if (assignment.status !== SupervisorAssignmentStatus.INVITED) {
      throw new BadRequestException('تم الرد على هذا التكليف بالفعل');
    }

    const updated = await this.prisma.supervisorAssignment.update({
      where: { id: assignmentId },
      data: {
        status: dto.accept
          ? SupervisorAssignmentStatus.ACTIVE
          : SupervisorAssignmentStatus.DECLINED,
      },
    });

    await this.prisma.activityLog.create({
      data: {
        projectId: assignment.projectId,
        actorId: supervisorId,
        action: dto.accept ? 'SUPERVISOR_ACCEPTED' : 'SUPERVISOR_DECLINED',
        metadata: { assignmentId },
      },
    });

    return updated;
  }

  // المشرف يكتب تقرير
  async createReport(
    assignmentId: string,
    supervisorId: string,
    dto: CreateReportDto,
  ) {
    const assignment = await this.prisma.supervisorAssignment.findUnique({
      where: { id: assignmentId },
    });
    if (!assignment) {
      throw new NotFoundException('التكليف غير موجود');
    }
    if (assignment.supervisorId !== supervisorId) {
      throw new ForbiddenException('هذا التكليف ليس لك');
    }
    if (assignment.status !== SupervisorAssignmentStatus.ACTIVE) {
      throw new BadRequestException('التكليف غير مفعّل');
    }

    const report = await this.prisma.supervisorReport.create({
      data: {
        assignmentId,
        milestoneId: dto.milestoneId,
        summary: dto.summary,
        notes: dto.notes,
        status: dto.status ?? SupervisorReportStatus.SUBMITTED,
      },
    });

    await this.prisma.activityLog.create({
      data: {
        projectId: assignment.projectId,
        actorId: supervisorId,
        action: 'SUPERVISOR_REPORT_CREATED',
        metadata: { assignmentId, reportId: report.id },
      },
    });

    return report;
  }

  // تكليفات المشرف الحالي
  async listMine(supervisorId: string) {
    return this.prisma.supervisorAssignment.findMany({
      where: { supervisorId },
      orderBy: { createdAt: 'desc' },
      include: {
        project: { select: { id: true, title: true, status: true } },
        reports: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  // تكليفات مشروع معيّن (للطرفين)
  async listForProject(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException('المشروع غير موجود');
    }
    if (project.clientId !== userId && project.providerId !== userId) {
      throw new ForbiddenException('ليس لديك صلاحية لعرض هذا المشروع');
    }

    return this.prisma.supervisorAssignment.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        supervisor: { select: { id: true, fullName: true } },
        reports: { orderBy: { createdAt: 'desc' } },
      },
    });
  }
}
