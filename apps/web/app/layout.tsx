import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/Toast';

export const metadata: Metadata = {
  title: 'محايد — منصة حماية الحقوق',
  description:
    'منصة محايدة تربط العميل بمقدم الخدمة داخل بيئة موثقة تحفظ حقوق الطرفين.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
