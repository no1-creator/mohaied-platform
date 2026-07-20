import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFileDto } from './dto/create-file.dto';
import { CreateMediaDto } from './dto/create-media.dto';

const MAX_BYTES = 10 * 1024 * 1024; // 10 ميجا
const MAX_MEDIA_BYTES = 5 * 1024 * 1024; // 5 ميجا لصور المكتبة (حد الطلب 12 ميجا)

@Injectable()
export class FilesService {
  constructor(private prisma: PrismaService) {}

  // بيانات الملف من غير المحتوى (data)
  private metaSelect = {
    id: true,
    name: true,
    mimeType: true,
    size: true,
    url: true,
    uploaderId: true,
    projectId: true,
    submissionId: true,
    createdAt: true,
  };

  private computeSize(dataUrl: string): number {
    const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
    if (!base64) return 0;
    const len = base64.length;
    const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
    return Math.floor((len * 3) / 4) - padding;
  }

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

  async create(userId: string, dto: CreateFileDto) {
    if (!dto.projectId && !dto.submissionId) {
      throw new BadRequestException('لازم يكون الملف مربوط بمشروع');
    }
    if (dto.projectId) {
      await this.assertProjectParty(dto.projectId, userId);
    }

    const size = this.computeSize(dto.dataUrl);
    if (size <= 0) throw new BadRequestException('ملف غير صالح');
    if (size > MAX_BYTES) {
      throw new BadRequestException('حجم الملف أكبر من 10 ميجا');
    }

    const id = randomUUID();
    return this.prisma.fileAsset.create({
      data: {
        id,
        name: dto.name,
        mimeType: dto.mimeType || null,
        url: `/files/${id}`,
        data: dto.dataUrl,
        size,
        uploaderId: userId,
        projectId: dto.projectId || null,
        submissionId: dto.submissionId || null,
      },
      select: this.metaSelect,
    });
  }

  async listByProject(projectId: string, userId: string) {
    await this.assertProjectParty(projectId, userId);
    return this.prisma.fileAsset.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      select: this.metaSelect,
    });
  }

  // بيرجّع المحتوى (dataUrl) للتحميل — لأطراف المشروع بس
  async getOne(id: string, userId: string) {
    const file = await this.prisma.fileAsset.findUnique({ where: { id } });
    if (!file) throw new NotFoundException('الملف غير موجود');

    if (file.projectId) {
      await this.assertProjectParty(file.projectId, userId);
    } else if (file.uploaderId !== userId) {
      throw new ForbiddenException('ليس لديك صلاحية');
    }

    return {
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: file.size,
      dataUrl: file.data,
      createdAt: file.createdAt,
    };
  }

  async remove(id: string, userId: string) {
    const file = await this.prisma.fileAsset.findUnique({ where: { id } });
    if (!file) throw new NotFoundException('الملف غير موجود');
    if (file.uploaderId !== userId) {
      throw new ForbiddenException('تقدر تمسح الملفات اللي رفعتها بس');
    }
    await this.prisma.fileAsset.delete({ where: { id } });
    return { ok: true };
  }

  // ==================== مكتبة الوسائط (جديد) ====================

  // رفع صورة لمكتبة الوسائط (أدمن) — متاحة للعرض العام
  async createMedia(userId: string, dto: CreateMediaDto) {
    const size = this.computeSize(dto.dataUrl);
    if (size <= 0) throw new BadRequestException('ملف غير صالح');
    if (size > MAX_MEDIA_BYTES) {
      throw new BadRequestException('حجم الصورة أكبر من 5 ميجا');
    }

    const id = randomUUID();
    return this.prisma.fileAsset.create({
      data: {
        id,
        name: dto.name,
        mimeType: dto.mimeType || null,
        url: `/files/public/${id}`,
        data: dto.dataUrl,
        size,
        uploaderId: userId,
        folder: 'MEDIA',
        isPublic: true,
      },
      select: this.metaSelect,
    });
  }

  listMedia() {
    return this.prisma.fileAsset.findMany({
      where: { folder: 'MEDIA' },
      orderBy: { createdAt: 'desc' },
      select: this.metaSelect,
    });
  }

  // عرض عام للصورة كبايتس (بدون تسجيل دخول) — للوسائط العامة فقط
  async getPublicRaw(id: string) {
    const file = await this.prisma.fileAsset.findUnique({ where: { id } });
    if (!file || !file.isPublic || !file.data) {
      throw new NotFoundException('الصورة غير موجودة');
    }
    const dataUrl = file.data;
    const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
    let mime = file.mimeType || 'application/octet-stream';
    const match = /^data:([^;]+);/.exec(dataUrl);
    if (match) mime = match[1];
    return { buffer: Buffer.from(base64, 'base64'), mime };
  }

  async removeMedia(id: string) {
    const file = await this.prisma.fileAsset.findUnique({ where: { id } });
    if (!file || file.folder !== 'MEDIA') {
      throw new NotFoundException('الصورة غير موجودة');
    }
    await this.prisma.fileAsset.delete({ where: { id } });
    return { ok: true };
  }
}
