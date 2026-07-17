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

  // 5) إعدادات المنصة الافتراضية (مرة واحدة بس)
  const settingsCount = await prisma.platformSettings.count();
  if (settingsCount === 0) {
    await prisma.platformSettings.create({
      data: {
        defaultCommissionRate: 15,
        escrowEnabled: true,
        platformName: 'محايد',
      },
    });
    console.log('✅ تم إنشاء إعدادات المنصة الافتراضية');
  }

  // 6) باقات اشتراك مبدئية (مرة واحدة بس)
  const planCount = await prisma.subscriptionPlan.count();
  if (planCount === 0) {
    await prisma.subscriptionPlan.createMany({
      data: [
        {
          name: 'الأساسية',
          description: 'مناسبة لبداية مقدّمي الخدمة الأفراد.',
          price: 199,
          commissionRate: 12,
          features:
            'الظهور في نتائج البحث\nتقديم عروض غير محدودة\nعمولة 12% على كل مرحلة\nدعم فني أساسي',
          orderIndex: 1,
        },
        {
          name: 'الاحترافية',
          description: 'الأكثر طلبًا — لمقدّمي الخدمة الجادّين.',
          price: 399,
          commissionRate: 8,
          isFeatured: true,
          features:
            'كل مميزات الأساسية\nعمولة أقل 8% على كل مرحلة\nشارة "مقدّم مميّز"\nأولوية في الظهور\nدعم فني أولوية',
          orderIndex: 2,
        },
        {
          name: 'الأعمال',
          description: 'للشركات والمكاتب الكبيرة.',
          price: 799,
          commissionRate: 5,
          features:
            'كل مميزات الاحترافية\nأقل عمولة 5% على كل مرحلة\nملف شركة موثّق\nحساب مدير علاقات\nتقارير أداء شهرية',
          orderIndex: 3,
        },
      ],
    });
    console.log('✅ تم إنشاء 3 باقات اشتراك مبدئية');
  }

  console.log('✅ تم زرع الحسابات التجريبية:');
  console.log('   admin@mohaied.test /', PASSWORD);
  console.log('   client@mohaied.test /', PASSWORD);
  console.log('   provider@mohaied.test /', PASSWORD);
  console.log('   supervisor@mohaied.test /', PASSWORD);
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
