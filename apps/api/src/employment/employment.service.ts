import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const VALID_JOB_STATUS = ['OPEN', 'PAUSED', 'CLOSED', 'FILLED'];
const VALID_EMP_TYPE = ['FULL_TIME', 'PART_TIME', 'CONTRACT'];
const VALID_WORK_MODE = ['ONSITE', 'REMOTE', 'HYBRID'];
const VALID_EMPLOYMENT_STATUS = ['ACTIVE', 'PAUSED', 'ENDED'];

@Injectable()
export class EmploymentService {
  constructor(private prisma: PrismaService) {}

  private genCode(prefix: string) {
    const year = new Date().getFullYear();
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${prefix}-${year}-${rand}`;
  }

  private async usersMap(ids: (string | null | undefined)[]) {
    const uniq = [...new Set(ids.filter(Boolean) as string[])];
    if (!uniq.length) return {} as Record<string, any>;
    const users = await this.prisma.user.findMany({
      where: { id: { in: uniq } },
      select: { id: true, fullName: true, email: true },
    });
    const map: Record<string, any> = {};
    users.forEach((u) => {
      map[u.id] = u;
    });
    return map;
  }

  private async officesMap(ids: (string | null | undefined)[]) {
    const uniq = [...new Set(ids.filter(Boolean) as string[])];
    if (!uniq.length) return {} as Record<string, any>;
    const offices = await this.prisma.office.findMany({ where: { id: { in: uniq } } });
    const map: Record<string, any> = {};
    offices.forEach((o) => {
      map[o.id] = o;
    });
    return map;
  }

  private async enrichJobs(jobs: any[]) {
    const uMap = await this.usersMap(jobs.map((j) => j.employerId));
    const oMap = await this.officesMap(jobs.map((j) => j.officeId));
    return jobs.map((j) => ({
      ...j,
      employer: uMap[j.employerId] || null,
      office: j.officeId ? oMap[j.officeId] || null : null,
    }));
  }

  private async enrichApplications(apps: any[]) {
    const uMap = await this.usersMap(apps.map((a) => a.employeeId));
    const jobs = await this.prisma.remoteJob.findMany({
      where: { id: { in: [...new Set(apps.map((a) => a.jobId))] } },
    });
    const jMap: Record<string, any> = {};
    jobs.forEach((j) => {
      jMap[j.id] = j;
    });
    return apps.map((a) => ({
      ...a,
      employee: uMap[a.employeeId] || null,
      job: jMap[a.jobId] || null,
    }));
  }

  private async enrichEmployments(emps: any[]) {
    const uMap = await this.usersMap([
      ...emps.map((e) => e.employerId),
      ...emps.map((e) => e.employeeId),
    ]);
    const oMap = await this.officesMap(emps.map((e) => e.officeId));
    return emps.map((e) => ({
      ...e,
      employer: uMap[e.employerId] || null,
      employee: uMap[e.employeeId] || null,
      office: e.officeId ? oMap[e.officeId] || null : null,
    }));
  }

  // ==================== OFFICES (مكاتب محايد) ====================
  async createOffice(b: any) {
    if (!b?.name || String(b.name).trim().length < 2)
      throw new BadRequestException('اسم المكتب مطلوب');
    if (!b?.city || String(b.city).trim().length < 2)
      throw new BadRequestException('مدينة المكتب مطلوبة');
    return this.prisma.office.create({
      data: {
        code: this.genCode('OFF'),
        name: String(b.name).trim(),
        city: String(b.city).trim(),
        address: b.address ? String(b.address).trim() : null,
        capacity: b.capacity != null && b.capacity !== '' ? Number(b.capacity) : null,
        description: b.description ? String(b.description).trim() : null,
        active: b.active != null ? !!b.active : true,
      },
    });
  }

  async listOffices() {
    return this.prisma.office.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listOfficesAdmin() {
    return this.prisma.office.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async updateOffice(id: string, b: any) {
    const office = await this.prisma.office.findUnique({ where: { id } });
    if (!office) throw new NotFoundException('المكتب غير موجود');
    const data: any = {};
    if (b.name != null) data.name = String(b.name).trim();
    if (b.city != null) data.city = String(b.city).trim();
    if (b.address !== undefined) data.address = b.address ? String(b.address).trim() : null;
    if (b.capacity !== undefined)
      data.capacity = b.capacity != null && b.capacity !== '' ? Number(b.capacity) : null;
    if (b.description !== undefined)
      data.description = b.description ? String(b.description).trim() : null;
    if (b.active != null) data.active = !!b.active;
    return this.prisma.office.update({ where: { id }, data });
  }

  // ==================== JOBS (وظائف الشركات) ====================
  async createJob(employerId: string, b: any) {
    if (!b?.title || String(b.title).trim().length < 3)
      throw new BadRequestException('اكتب عنوان وظيفة واضح');
    if (!b?.description || String(b.description).trim().length < 20)
      throw new BadRequestException('اكتب وصف كافٍ للوظيفة (20 حرف على الأقل)');
    if (b.monthlySalary == null || Number(b.monthlySalary) <= 0)
      throw new BadRequestException('حدد الراتب الشهري');
    const employmentType = VALID_EMP_TYPE.includes(b.employmentType) ? b.employmentType : 'FULL_TIME';
    const workMode = VALID_WORK_MODE.includes(b.workMode) ? b.workMode : 'REMOTE';
    return this.prisma.remoteJob.create({
      data: {
        code: this.genCode('JOB'),
        employerId,
        title: String(b.title).trim(),
        description: String(b.description).trim(),
        skills: b.skills ? String(b.skills).trim() : null,
        seniority: b.seniority ? String(b.seniority).trim() : null,
        employmentType: employmentType as any,
        workMode: workMode as any,
        monthlySalary: Number(b.monthlySalary),
        currency: b.currency ? String(b.currency).trim() : 'USD',
        headcount: b.headcount != null && b.headcount !== '' ? Number(b.headcount) : 1,
        location: b.location ? String(b.location).trim() : null,
        officeId: b.officeId ? String(b.officeId) : null,
      },
    });
  }

  async listMyJobs(employerId: string) {
    const jobs = await this.prisma.remoteJob.findMany({
      where: { employerId },
      orderBy: { createdAt: 'desc' },
    });
    return this.enrichJobs(jobs);
  }

  async listAdminJobs(q: { status?: string; q?: string }) {
    const where: any = {};
    if (q.status && VALID_JOB_STATUS.includes(q.status)) where.status = q.status;
    if (q.q && q.q.trim()) {
      where.OR = [
        { title: { contains: q.q.trim(), mode: 'insensitive' } },
        { code: { contains: q.q.trim(), mode: 'insensitive' } },
      ];
    }
    const jobs = await this.prisma.remoteJob.findMany({
      where,
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      take: 300,
    });
    return this.enrichJobs(jobs);
  }

  async listPublic(q: { workMode?: string; q?: string }) {
    const where: any = { status: 'OPEN' };
    if (q.workMode && VALID_WORK_MODE.includes(q.workMode)) where.workMode = q.workMode;
    if (q.q && q.q.trim()) {
      where.OR = [
        { title: { contains: q.q.trim(), mode: 'insensitive' } },
        { skills: { contains: q.q.trim(), mode: 'insensitive' } },
      ];
    }
    const jobs = await this.prisma.remoteJob.findMany({
      where,
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      take: 200,
    });
    return this.enrichJobs(jobs);
  }

  private async getJobRaw(id: string) {
    const job = await this.prisma.remoteJob.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('الوظيفة غير موجودة');
    return job;
  }

  async getJob(id: string) {
    const job = await this.getJobRaw(id);
    const [enriched] = await this.enrichJobs([job]);
    return enriched;
  }

  async updateMyJob(employerId: string, id: string, b: any) {
    const job = await this.getJobRaw(id);
    if (job.employerId !== employerId) throw new ForbiddenException('مش من حقك تعدّل الوظيفة دي');
    const data: any = {};
    if (b.title != null) data.title = String(b.title).trim();
    if (b.description != null) data.description = String(b.description).trim();
    if (b.skills !== undefined) data.skills = b.skills ? String(b.skills).trim() : null;
    if (b.seniority !== undefined) data.seniority = b.seniority ? String(b.seniority).trim() : null;
    if (b.employmentType && VALID_EMP_TYPE.includes(b.employmentType))
      data.employmentType = b.employmentType;
    if (b.workMode && VALID_WORK_MODE.includes(b.workMode)) data.workMode = b.workMode;
    if (b.monthlySalary != null && Number(b.monthlySalary) > 0)
      data.monthlySalary = Number(b.monthlySalary);
    if (b.currency != null) data.currency = String(b.currency).trim();
    if (b.headcount != null && b.headcount !== '') data.headcount = Number(b.headcount);
    if (b.location !== undefined) data.location = b.location ? String(b.location).trim() : null;
    if (b.officeId !== undefined) data.officeId = b.officeId ? String(b.officeId) : null;
    if (b.status && VALID_JOB_STATUS.includes(b.status)) data.status = b.status;
    return this.prisma.remoteJob.update({ where: { id }, data });
  }

  async adminUpdateJob(id: string, b: any) {
    await this.getJobRaw(id);
    const data: any = {};
    if (b.status && VALID_JOB_STATUS.includes(b.status)) data.status = b.status;
    if (b.featured != null) data.featured = !!b.featured;
    if (b.adminNote !== undefined) data.adminNote = b.adminNote ? String(b.adminNote).trim() : null;
    return this.prisma.remoteJob.update({ where: { id }, data });
  }

  // ==================== APPLICATIONS (طلبات التقديم) ====================
  async apply(employeeId: string, jobId: string, b: any) {
    const job = await this.getJobRaw(jobId);
    if (job.status !== 'OPEN') throw new BadRequestException('الوظيفة دي مش مفتوحة للتقديم');
    const data: any = {
      coverLetter: b.coverLetter ? String(b.coverLetter).trim() : null,
      expectedSalary:
        b.expectedSalary != null && b.expectedSalary !== '' ? Number(b.expectedSalary) : null,
      cvUrl: b.cvUrl ? String(b.cvUrl).trim() : null,
      status: 'SUBMITTED',
    };
    return this.prisma.jobApplication.upsert({
      where: { jobId_employeeId: { jobId, employeeId } },
      create: { jobId, employeeId, ...data },
      update: { ...data },
    });
  }

  async listMyApplications(employeeId: string) {
    const apps = await this.prisma.jobApplication.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });
    return this.enrichApplications(apps);
  }

  async listJobApplications(jobId: string, employerId: string) {
    const job = await this.getJobRaw(jobId);
    if (job.employerId !== employerId)
      throw new ForbiddenException('مش من حقك تشوف متقدمين الوظيفة دي');
    const apps = await this.prisma.jobApplication.findMany({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
    });
    return this.enrichApplications(apps);
  }

  async employerRespond(appId: string, employerId: string, b: any) {
    const app = await this.prisma.jobApplication.findUnique({ where: { id: appId } });
    if (!app) throw new NotFoundException('طلب التقديم غير موجود');
    const job = await this.getJobRaw(app.jobId);
    if (job.employerId !== employerId) throw new ForbiddenException('مش من حقك ترد على الطلب ده');
    const status = b.status;
    if (!['SHORTLISTED', 'INTERVIEW', 'OFFERED', 'HIRED', 'REJECTED'].includes(status))
      throw new BadRequestException('حالة غير صحيحة');
    const updated = await this.prisma.jobApplication.update({
      where: { id: appId },
      data: {
        status,
        employerNote:
          b.employerNote !== undefined
            ? b.employerNote
              ? String(b.employerNote).trim()
              : null
            : undefined,
      },
    });
    let employment: any = null;
    if (status === 'HIRED') {
      const existing = await this.prisma.employment.findFirst({
        where: { jobId: job.id, employeeId: app.employeeId, status: { not: 'ENDED' } },
      });
      if (!existing) {
        employment = await this.prisma.employment.create({
          data: {
            code: this.genCode('EMP'),
            jobId: job.id,
            employerId: job.employerId,
            employeeId: app.employeeId,
            title: job.title,
            monthlySalary: app.expectedSalary ?? job.monthlySalary,
            currency: job.currency ?? 'USD',
            workMode: job.workMode,
            officeId: job.officeId ?? null,
          },
        });
      }
    }
    return { application: updated, employment };
  }

  async withdrawApplication(appId: string, employeeId: string) {
    const app = await this.prisma.jobApplication.findUnique({ where: { id: appId } });
    if (!app) throw new NotFoundException('طلب التقديم غير موجود');
    if (app.employeeId !== employeeId) throw new ForbiddenException('مش من حقك تسحب الطلب ده');
    return this.prisma.jobApplication.update({
      where: { id: appId },
      data: { status: 'WITHDRAWN' },
    });
  }

  // ==================== EMPLOYMENTS (عقود التوظيف) ====================
  async listMyEmployments(user: { id: string; role: string }) {
    const where: any = user.role === 'EMPLOYER' ? { employerId: user.id } : { employeeId: user.id };
    const emps = await this.prisma.employment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return this.enrichEmployments(emps);
  }

  private async getEmploymentRaw(id: string) {
    const emp = await this.prisma.employment.findUnique({ where: { id } });
    if (!emp) throw new NotFoundException('عقد التوظيف غير موجود');
    return emp;
  }

  async getEmployment(id: string, user: { id: string; role: string }) {
    const emp = await this.getEmploymentRaw(id);
    if (user.role !== 'ADMIN' && emp.employerId !== user.id && emp.employeeId !== user.id)
      throw new ForbiddenException('مش من حقك تشوف العقد ده');
    const [enriched] = await this.enrichEmployments([emp]);
    return enriched;
  }

  async updateEmployment(id: string, employerId: string, b: any) {
    const emp = await this.getEmploymentRaw(id);
    if (emp.employerId !== employerId) throw new ForbiddenException('مش من حقك تعدّل العقد ده');
    const data: any = {};
    if (b.status && VALID_EMPLOYMENT_STATUS.includes(b.status)) {
      data.status = b.status;
      if (b.status === 'ENDED') data.endDate = new Date();
    }
    if (b.notes !== undefined) data.notes = b.notes ? String(b.notes).trim() : null;
    if (b.monthlySalary != null && Number(b.monthlySalary) > 0)
      data.monthlySalary = Number(b.monthlySalary);
    return this.prisma.employment.update({ where: { id }, data });
  }

  // ==================== WORK LOGS (سجل الشغل اليومي) ====================
  async createLog(employmentId: string, employeeId: string, b: any) {
    const emp = await this.getEmploymentRaw(employmentId);
    if (emp.employeeId !== employeeId) throw new ForbiddenException('مش من حقك تسجّل شغل على العقد ده');
    if (emp.status !== 'ACTIVE') throw new BadRequestException('العقد مش نشط حاليًا');
    if (!b?.summary || String(b.summary).trim().length < 3)
      throw new BadRequestException('اكتب ملخص للشغل اللي اتعمل');
    return this.prisma.workLog.create({
      data: {
        employmentId,
        employeeId,
        date: b.date ? new Date(b.date) : new Date(),
        hours: b.hours != null && b.hours !== '' ? Number(b.hours) : null,
        summary: String(b.summary).trim(),
      },
    });
  }

  async listLogs(employmentId: string, user: { id: string; role: string }) {
    const emp = await this.getEmploymentRaw(employmentId);
    if (user.role !== 'ADMIN' && emp.employerId !== user.id && emp.employeeId !== user.id)
      throw new ForbiddenException('مش من حقك تشوف سجلّات العقد ده');
    const logs = await this.prisma.workLog.findMany({
      where: { employmentId },
      orderBy: { date: 'desc' },
    });
    const uMap = await this.usersMap(logs.map((l) => l.employeeId));
    return logs.map((l) => ({ ...l, employee: uMap[l.employeeId] || null }));
  }

  async reviewLog(logId: string, employerId: string, b: any) {
    const log = await this.prisma.workLog.findUnique({ where: { id: logId } });
    if (!log) throw new NotFoundException('سجل العمل غير موجود');
    const emp = await this.getEmploymentRaw(log.employmentId);
    if (emp.employerId !== employerId) throw new ForbiddenException('مش من حقك تراجع السجل ده');
    const status = b.status;
    if (!['APPROVED', 'REJECTED'].includes(status)) throw new BadRequestException('حالة غير صحيحة');
    return this.prisma.workLog.update({
      where: { id: logId },
      data: {
        status,
        employerNote:
          b.employerNote !== undefined
            ? b.employerNote
              ? String(b.employerNote).trim()
              : null
            : undefined,
      },
    });
  }
}
