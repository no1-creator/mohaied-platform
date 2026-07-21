import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { OffersModule } from './offers/offers.module';
import { AgreementsModule } from './agreements/agreements.module';
import { MilestonesModule } from './milestones/milestones.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { SupervisorsModule } from './supervisors/supervisors.module';
import { AdminModule } from './admin/admin.module';
import { SettingsModule } from './settings/settings.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { EscrowModule } from './escrow/escrow.module';
import { OptionsModule } from './options/options.module';
import { ContentModule } from './content/content.module';
import { AdsModule } from './ads/ads.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { InvitationsModule } from './invitations/invitations.module';
import { ReviewsModule } from './reviews/reviews.module';
import { FilesModule } from './files/files.module';
import { MessagesModule } from './messages/messages.module';
import { KycModule } from './kyc/kyc.module';
import { ClientsModule } from './clients/clients.module';
import { ExternalProjectsModule } from './external-projects/external-projects.module';
import { InvoicesModule } from './invoices/invoices.module';
import { WalletModule } from './wallet/wallet.module';
import { TasksModule } from './tasks/tasks.module';
import { BusinessSettingsModule } from './business-settings/business-settings.module';
import { MatchingModule } from './matching/matching.module';
import { AuditModule } from './audit/audit.module';
import { AuditInterceptor } from './audit/audit.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    OffersModule,
    AgreementsModule,
    MilestonesModule,
    ComplaintsModule,
    SupervisorsModule,
    AdminModule,
    SettingsModule,
    SubscriptionsModule,
    EscrowModule,
    OptionsModule,
    ContentModule,
    AdsModule,
    NotificationsModule,
    RecommendationsModule,
    InvitationsModule,
    ReviewsModule,
    FilesModule,
    MessagesModule,
    KycModule,
    ClientsModule,
    ExternalProjectsModule,
    InvoicesModule,
    WalletModule,
    TasksModule,
    BusinessSettingsModule,
    MatchingModule,
    AuditModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
