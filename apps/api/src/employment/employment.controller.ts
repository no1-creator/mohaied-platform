import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { EmploymentService } from './employment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('employment')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmploymentController {
  constructor(private readonly svc: EmploymentService) {}

  // -------- Offices (مكاتب محايد) --------
  @Post('offices')
  @Roles(UserRole.ADMIN)
  createOffice(@Body() body: any) {
    return this.svc.createOffice(body);
  }

  @Get('offices')
  listOffices() {
    return this.svc.listOffices();
  }

  @Get('offices/admin')
  @Roles(UserRole.ADMIN)
  listOfficesAdmin() {
    return this.svc.listOfficesAdmin();
  }

  @Patch('offices/:id')
  @Roles(UserRole.ADMIN)
  updateOffice(@Param('id') id: string, @Body() body: any) {
    return this.svc.updateOffice(id, body);
  }

  // -------- Jobs (وظائف) --------
  @Post('jobs')
  @Roles(UserRole.EMPLOYER)
  createJob(@GetUser('id') employerId: string, @Body() body: any) {
    return this.svc.createJob(employerId, body);
  }

  @Get('jobs/mine')
  @Roles(UserRole.EMPLOYER)
  listMyJobs(@GetUser('id') employerId: string) {
    return this.svc.listMyJobs(employerId);
  }

  @Get('jobs/admin')
  @Roles(UserRole.ADMIN)
  listAdminJobs(@Query('status') status: string, @Query('q') q: string) {
    return this.svc.listAdminJobs({ status, q });
  }

  @Get('jobs')
  listPublic(@Query('workMode') workMode: string, @Query('q') q: string) {
    return this.svc.listPublic({ workMode, q });
  }

  @Get('jobs/:id/applications')
  @Roles(UserRole.EMPLOYER)
  listJobApplications(@Param('id') id: string, @GetUser('id') employerId: string) {
    return this.svc.listJobApplications(id, employerId);
  }

  @Post('jobs/:id/apply')
  @Roles(UserRole.EMPLOYEE)
  apply(@Param('id') id: string, @GetUser('id') employeeId: string, @Body() body: any) {
    return this.svc.apply(employeeId, id, body);
  }

  @Patch('jobs/:id/admin')
  @Roles(UserRole.ADMIN)
  adminUpdateJob(@Param('id') id: string, @Body() body: any) {
    return this.svc.adminUpdateJob(id, body);
  }

  @Get('jobs/:id')
  getJob(@Param('id') id: string) {
    return this.svc.getJob(id);
  }

  @Patch('jobs/:id')
  @Roles(UserRole.EMPLOYER)
  updateMyJob(@Param('id') id: string, @GetUser('id') employerId: string, @Body() body: any) {
    return this.svc.updateMyJob(employerId, id, body);
  }

  // -------- Applications (طلبات التقديم) --------
  @Get('applications/mine')
  @Roles(UserRole.EMPLOYEE)
  listMyApplications(@GetUser('id') employeeId: string) {
    return this.svc.listMyApplications(employeeId);
  }

  @Patch('applications/:id/withdraw')
  @Roles(UserRole.EMPLOYEE)
  withdraw(@Param('id') id: string, @GetUser('id') employeeId: string) {
    return this.svc.withdrawApplication(id, employeeId);
  }

  @Patch('applications/:id')
  @Roles(UserRole.EMPLOYER)
  respond(@Param('id') id: string, @GetUser('id') employerId: string, @Body() body: any) {
    return this.svc.employerRespond(id, employerId, body);
  }

  // -------- Contracts (عقود التوظيف) --------
  @Get('contracts/mine')
  @Roles(UserRole.EMPLOYER, UserRole.EMPLOYEE)
  listMyEmployments(@GetUser('id') userId: string, @GetUser('role') role: string) {
    return this.svc.listMyEmployments({ id: userId, role });
  }

  @Get('contracts/:id/logs')
  listLogs(@Param('id') id: string, @GetUser('id') userId: string, @GetUser('role') role: string) {
    return this.svc.listLogs(id, { id: userId, role });
  }

  @Post('contracts/:id/logs')
  @Roles(UserRole.EMPLOYEE)
  createLog(@Param('id') id: string, @GetUser('id') employeeId: string, @Body() body: any) {
    return this.svc.createLog(id, employeeId, body);
  }

  @Get('contracts/:id')
  getEmployment(@Param('id') id: string, @GetUser('id') userId: string, @GetUser('role') role: string) {
    return this.svc.getEmployment(id, { id: userId, role });
  }

  @Patch('contracts/:id')
  @Roles(UserRole.EMPLOYER)
  updateEmployment(@Param('id') id: string, @GetUser('id') employerId: string, @Body() body: any) {
    return this.svc.updateEmployment(id, employerId, body);
  }

  // -------- Work logs (مراجعة سجل الشغل) --------
  @Patch('logs/:id')
  @Roles(UserRole.EMPLOYER)
  reviewLog(@Param('id') id: string, @GetUser('id') employerId: string, @Body() body: any) {
    return this.svc.reviewLog(id, employerId, body);
  }
}
