'use client';

import Link from 'next/link';
import { useEffect } from 'react';

const STEPS = [
  { t: 'اطرح مشروعك', d: 'اكتب اللي محتاجه بوضوح — المطلوب، الميزانية، والمدة المتوقّعة.' },
  { t: 'اتفاق موثّق', d: 'يتحدد نطاق الشغل والمراحل والحقوق المالية في اتفاق رسمي مسجّل.' },
  { t: 'متابعة بالمراحل', d: 'تسليم ومراجعة خطوة بخطوة، وكل تحديث متوثّق على المنصة.' },
  { t: 'تسليم وحماية', d: 'استلام آمن للمشروع، ولو حصل خلاف يتحل بحياد وقرار عادل.' },
];

const SERVICES = [
  { icon: '💻', t: 'برمجة ومواقع', d: 'مواقع، تطبيقات، وأنظمة ويب بمتابعة موثّقة.' },
  { icon: '📐', t: 'هندسة وتصميم', d: 'تصميمات ومخططات هندسية بإشراف متخصص.' },
  { icon: '🎨', t: 'تصميم جرافيك', d: 'هوية بصرية وتصميمات احترافية بعقد واضح.' },
];

const ROLES = [
  {
    icon: '🧑‍💼',
    t: 'العميل',
    items: ['يطلب مشروعه بثقة', 'يتابع كل مرحلة أول بأول', 'يستلم شغل بجودة متفق عليها', 'حقه محفوظ لو حصل أي خلاف'],
  },
  {
    icon: '🏗️',
    t: 'المهندس أو الشركة',
    items: ['يستقبل طلبات جادّة', 'حقوقه المالية موثّقة', 'تقييم يبني سمعته المهنية', 'حماية من التلاعب والمماطلة'],
  },
  {
    icon: '🛡️',
    t: 'المشرف المتخصص',
    items: ['مراجعة فنية اختيارية', 'يضمن الجودة والحياد', 'يوثّق الملاحظات رسميًا', 'يساعد في حل النزاع بعدالة'],
  },
];

export default function LandingPage() {
  useEffect(() => {
    const header = document.querySelector('.site-header');
    const onScroll = () => {
      if (!header) return;
      header.classList.toggle('scrolled', window.scrollY > 20);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

    return () => {
      window.removeEventListener('scroll', onScroll);
      io.disconnect();
    };
  }, []);

  return (
    <>
      {/* الهيدر */}
      <header className="site-header">
        <div className="nav-inner">
          <div className="brand">
            <div className="logo-mark">◇</div>
            <div>
              <div className="brand-name">محايد</div>
              <div className="brand-tag">تحت إشراف حكومي</div>
            </div>
          </div>
          <nav className="main-nav">
            <a href="#how">كيف تعمل</a>
            <a href="#sectors">المجالات</a>
            <a href="#roles">لكل الأطراف</a>
            <a href="#gov">الإشراف الحكومي</a>
          </nav>
          <div className="nav-actions">
            <Link href="/login" className="nav-login">تسجيل الدخول</Link>
            <Link href="/register" className="nav-cta">ابدأ الآن</Link>
          </div>
        </div>
      </header>

      {/* الهيرو */}
      <section className="hero">
        <div className="hero-blob one" />
        <div className="hero-blob two" />
        <div className="hero-inner">
          <div className="hero-text">
            <span className="hero-badge">🏛️ منصة تعمل تحت إشراف الحكومة المصرية</span>
            <h1>نفّذ مشروعك بثقة، وحقوقك محفوظة من الأول للآخر</h1>
            <p>
              محايد منصة مستقلة تربط العميل بالمهندس أو الشركة داخل بيئة موثّقة:
              اتفاق واضح، متابعة بالمراحل، وإشراف متخصص يحمي كل الأطراف ويحل النزاعات بعدالة.
            </p>
            <div className="hero-buttons">
              <Link href="/register" className="lp-btn-primary">ابدأ مشروعك</Link>
              <a href="#how" className="lp-btn-ghost">اعرف كيف تعمل</a>
            </div>
            <div className="hero-stats">
              <div><b>100%</b><span>توثيق للاتفاقات</span></div>
              <div><b>3</b><span>أطراف محميّة</span></div>
              <div><b>24/7</b><span>متابعة ودعم</span></div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-card floating">
              <span className="mini-chip">قيد التنفيذ</span>
              <h3>موقع تعريفي لشركة</h3>
              <div className="visual-bar">
                <span style={{ ['--bar' as string]: '66%' } as React.CSSProperties} />
              </div>
              <p>المرحلة 2 من 3 — التصميم والتطوير</p>
              <div className="visual-row">
                <span>العميل</span>
                <span>مقدم الخدمة</span>
              </div>
            </div>
            <div className="float-badge one">✅ اتفاق موثّق</div>
            <div className="float-badge two">🛡️ إشراف حكومي</div>
          </div>
        </div>
      </section>

      {/* بانر الإشراف الحكومي */}
      <div className="gov-band reveal" id="gov">
        <div className="gov-inner">
          <div className="gov-emblem">🏛️</div>
          <div className="gov-content">
            <h2>منصة تعمل تحت إشراف الحكومة المصرية</h2>
            <p>
              محايد تعمل ضمن إطار رقابي يضمن الشفافية والعدالة، ويحمي حقوق العميل
              والمهندس والشركة على حدٍّ سواء — من توثيق الاتفاق لحد تسليم المشروع.
            </p>
            <div className="gov-points">
              <div className="gov-point">
                <b>حماية العميل</b>
                <span>ضمان تنفيذ المتفق عليه بالجودة والوقت المحدد.</span>
              </div>
              <div className="gov-point">
                <b>حماية المهندس والشركة</b>
                <span>توثيق الحقوق المالية والمهنية بشكل رسمي.</span>
              </div>
              <div className="gov-point">
                <b>رقابة وحياد</b>
                <span>فضّ النزاعات بقرارات عادلة وموثّقة.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* كيف تعمل */}
      <section className="section" id="how">
        <div className="section-inner">
          <h2 className="section-title reveal">إزاي محايد بيحمي حقك؟</h2>
          <p className="section-sub reveal">أربع خطوات واضحة من بداية الفكرة لحد التسليم</p>
          <div className="steps-grid">
            {STEPS.map((s, i) => (
              <div className="step-card reveal" style={{ transitionDelay: `${i * 0.08}s` }} key={i}>
                <div className="step-num">{i + 1}</div>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* المجالات */}
      <section className="section alt" id="sectors">
        <div className="section-inner">
          <h2 className="section-title reveal">المجالات المتاحة الآن</h2>
          <p className="section-sub reveal">نبدأ بالمجالات الأكثر طلبًا، وبنوسّع تباعًا</p>
          <div className="services-grid">
            {SERVICES.map((s, i) => (
              <div className="service-card reveal" style={{ transitionDelay: `${i * 0.08}s` }} key={i}>
                <div className="service-icon">{s.icon}</div>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
          <p className="soon-note reveal">🚀 مجالات أكثر في الطريق قريبًا</p>
        </div>
      </section>

      {/* لكل الأطراف */}
      <section className="section" id="roles">
        <div className="section-inner">
          <h2 className="section-title reveal">منصة واحدة تحمي كل الأطراف</h2>
          <p className="section-sub reveal">حقوق واضحة ومتوازنة للعميل، للمهندس والشركة، وللمشرف</p>
          <div className="roles-grid">
            {ROLES.map((r, i) => (
              <div className="role-card reveal" style={{ transitionDelay: `${i * 0.08}s` }} key={i}>
                <div className="role-icon">{r.icon}</div>
                <h3>{r.t}</h3>
                <ul>
                  {r.items.map((it, j) => (
                    <li key={j}>{it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-band">
        <div className="cta-inner">
          <h2>جاهز تبدأ مشروعك بثقة؟</h2>
          <p>سجّل دلوقتي وابدأ أول مشروع محمي بالكامل تحت إشراف محايد.</p>
          <Link href="/register" className="btn-light">أنشئ حسابك مجانًا</Link>
        </div>
      </section>

      {/* الفوتر */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div>
            <div className="footer-brand">
<span className="logo-mark small">
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M16 3.2l9.5 3.6v6.8c0 6.2-4.2 10.7-9.5 12.4C10.7 24.3 6.5 19.8 6.5 13.6V6.8L16 3.2z"
      fill="white"
      fillOpacity="0.2"
      stroke="white"
      strokeWidth="1.4"
    />
    <path
      d="M11.5 16l3 3 6-6.5"
      stroke="white"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
</span>
              محايد
            </div>
            <p className="footer-about">
              منصة محايدة لحماية الحقوق، تعمل تحت إشراف الحكومة المصرية لضمان تنفيذ
              المشاريع بعدالة وشفافية.
            </p>
          </div>
          <div className="footer-cols">
            <div>
              <h4>المنصة</h4>
              <a href="#how">كيف تعمل</a>
              <a href="#sectors">المجالات</a>
              <a href="#roles">لكل الأطراف</a>
            </div>
            <div>
              <h4>ابدأ</h4>
              <Link href="/register">إنشاء حساب</Link>
              <Link href="/login">تسجيل الدخول</Link>
            </div>
            <div>
              <h4>عن محايد</h4>
              <a href="#gov">الإشراف الحكومي</a>
              <a href="#">حماية الحقوق</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">© 2026 محايد — جميع الحقوق محفوظة.</div>
      </footer>
    </>
  );
}
