import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between px-8 py-5 border-b border-line bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand text-white grid place-items-center text-xl">
            ◇
          </div>
          <span className="text-xl font-black">محايد</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-brand font-extrabold text-sm">
            تسجيل الدخول
          </Link>
          <Link
            href="/register"
            className="bg-brand text-white px-4 py-2 rounded-xl text-sm font-extrabold"
          >
            ابدأ الآن
          </Link>
        </div>
      </header>

      <section className="max-w-3xl mx-auto text-center px-6 py-24">
        <span className="inline-block bg-brand-mint text-brand text-sm font-extrabold px-4 py-2 rounded-full mb-6">
          منصة محايدة لحماية الحقوق
        </span>
        <h1 className="text-4xl md:text-5xl font-black leading-tight mb-6">
          نفّذ مشروعك بثقة، وحقوقك محفوظة من الأول للآخر
        </h1>
        <p className="text-muted text-lg leading-loose mb-10">
          محايد بتربط بين العميل ومقدم الخدمة داخل بيئة موثقة، مع اتفاق واضح،
          متابعة للمراحل، وإمكانية إضافة مشرف متخصص لضمان الجودة وحل النزاعات.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/register"
            className="bg-brand text-white px-6 py-3 rounded-xl font-extrabold"
          >
            إنشاء حساب
          </Link>
          <Link
            href="/login"
            className="bg-white border border-line text-brand px-6 py-3 rounded-xl font-extrabold"
          >
            تسجيل الدخول
          </Link>
        </div>
      </section>
    </main>
  );
}
