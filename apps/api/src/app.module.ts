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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
