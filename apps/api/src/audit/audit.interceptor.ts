import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

// مسارات نتجاهلها عشان مانسجّلش بيانات حساسة (باسوردات مثلاً)
const SKIP = ['/auth/login', '/auth/register'];

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method: string = req?.method || 'GET';

    // نسجّل بس العمليات اللي بتغيّر بيانات
    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const rawUrl: string = req?.originalUrl || req?.url || '';
    const path = rawUrl.split('?')[0];

    if (SKIP.some((s) => path.includes(s))) {
      return next.handle();
    }

    const user = req?.user;

    // التسجيل بيحصل بعد نجاح العملية بس
    return next.handle().pipe(
      tap(() => {
        void this.audit.record({
          actorId: user?.id ?? null,
          actorName: user?.fullName ?? null,
          actorRole: user?.role ?? null,
          action: `${method} ${path}`,
          method,
          path,
        });
      }),
    );
  }
}
