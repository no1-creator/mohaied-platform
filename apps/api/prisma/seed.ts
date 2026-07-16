import { PrismaClient, UserRole, ProviderType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// كلمة سر موحّدة لكل الحسابات التجريبية
const PASSWORD = 'Test@1234';

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // 1) الأدمن
  const admin = await prisma.user.upsert({
    where: { email: 'admin@mohaied.test' },
    update: {},
    create: {
      email: 'admin@mohaied.test',
      fullName: 'إدارة محايد',
      role: UserRole.ADMIN,
      passwordHash,
      isVerified: true,
    },
  });

  // 2) العميل
  const client = await prisma.user.upsert({
    where: { email: 'client@mohaied.test' },
    update: {},
    create: {
      email: 'client@mohaied.test',
      fullName: 'أحمد العميل',
      role: UserRole.CLIENT,
      passwordHash,
      isVerified: true,
    },
  });

  // 3) مقدم الخدمة + بروفايله
  const provider = await prisma.user.upsert({
    where: { email: 'provider@mohaied.test' },
    update: {},
    create: {
      email: 'provider@mohaied.test',
      fullName: 'شركة إبداع للبرمجيات',
      role: UserRole.PROVIDER,
      passwordHash,
      isVerified: true,
      providerProfile: {
        create: {
          type: ProviderType.COMPANY,
          companyName: 'إبداع للبرمجيات',
          field: 'تطوير المواقع والتطبيقات',
          bio: 'فريق متخصص في بناء المنصات الرقمية.',
        },
      },
    },
  });

  // 4) المشرف + بروفايله
  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@mohaied.test' },
    update: {},
    create: {
      email: 'supervisor@mohaied.test',
      fullName: 'م. سمير المشرف',
      role: UserRole.SUPERVISOR,
      passwordHash,
      isVerified: true,
      supervisorProfile: {
        create: {
          title: 'مهندس برمجيات أول',
          field: 'مراجعة جودة البرمجيات',
          yearsExp: 12,
          ratePerReview: 500,
        },
      },
    },
  });

  console.log('✅ تم زرع الحسابات التجريبية:');
  console.log('  admin@mohaied.test      /', PASSWORD);
  console.log('  client@mohaied.test     /', PASSWORD);
  console.log('  provider@mohaied.test   /', PASSWORD);
  console.log('  supervisor@mohaied.test /', PASSWORD);
  console.log({ admin: admin.id, client: client.id, provider: provider.id, supervisor: supervisor.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
