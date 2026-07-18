import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private notifications: NotificationsService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('البريد الإلكتروني مستخدم بالفعل');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        role: dto.role,
        phone: dto.phone,
      },
    });

    // 🔔 إشعار ترحيب
    await this.notifications.create({
      userId: user.id,
      type: 'SYSTEM',
      title: 'أهلًا بك في محايد 👋',
      body: 'تم إنشاء حسابك بنجاح. اكمل بياناتك وابدأ رحلتك على المنصة.',
      linkUrl: '/dashboard',
    });

    return this.buildAuthResponse(user.id, user.email, user.role, user.fullName);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('الحساب غير مفعّل');
    }

    return this.buildAuthResponse(user.id, user.email, user.role, user.fullName);
  }

  private async buildAuthResponse(
    id: string,
    email: string,
    role: string,
    fullName: string,
  ) {
    const payload = { sub: id, email, role };
    const accessToken = await this.jwt.signAsync(payload);

    return {
      accessToken,
      user: { id, email, role, fullName },
    };
  }
}
