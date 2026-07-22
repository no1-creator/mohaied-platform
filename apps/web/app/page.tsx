'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import Icon from '@/components/Icon';
import AdBanners from '@/components/AdBanners';
import { useSiteContent } from '@/lib/content';
import { useI18n } from '@/lib/i18n';
import LangSwitch from '@/components/LangSwitch';
const STEPS = [
  { t: 'اطرح مشروعك', d: 'اكتب اللي محتاجه بوضوح — المطلوب، الميزانية، والمدة المتوقّعة.' },
  { t: 'اتفاق موثّق', d: 'يتحدد نطاق الشغل والمراحل والحقوق المالية في اتفاق رسمي مسجّل.' },
  { t: 'متابعة بالمراحل', d: 'تسليم ومراجعة خطوة بخطوة، وكل تحديث متوثّق على المنصة.' },
  { t: 'تسليم وحماية', d: 'استلام آمن للمشروع، ولو حصل خلاف يتحل بحياد وقرار عادل.' },
];

const SERVICES = [
  { icon: 'laptop', t: 'برمجة ومواقع', d: 'مواقع، تطبيقات، وأنظمة ويب بمتابعة موثّقة.' },
  { icon: 'ruler', t: 'هندسة وتصميم', d: 'تصميمات ومخططات هندسية بإشراف متخصص.' },
  { icon: 'palette', t: 'تصميم جرافيك', d: 'هوية بصرية وتصميمات احترافية بعقد واضح.' },
  { icon: 'scale', t: 'خدمات قانونية', d: 'حماية أفكار، تأسيس شركات، وقضايا الأجانب بإشراف مستشارين معتمدين.' },
  { icon: 'rocket', t: 'بوابة الاستثمار', d: 'اعرض مشروعك على مستثمرين، أو موّل أفكارًا واعدة بثقة وشفافية.' },
  { icon: 'briefcase', t: 'توظيف عن بُعد', d: 'شركات الخليج توظّف مواهب مصرية بعقود موثّقة ومكاتب محايد.' },
];

const ROLES = [
  {
    icon: 'user',
    t: 'العميل',
    items: ['يطلب مشروعه بثقة', 'يتابع كل مرحلة أول بأول', 'يستلم شغل بجودة متفق عليها', 'حقه محفوظ لو حصل أي خلاف'],
  },
  {
    icon: 'building',
    t: 'المهندس أو الشركة',
    items: ['يستقبل طلبات جادّة', 'حقوقه المالية موثّقة', 'تقييم يبني سمعته المهنية', 'حماية من التلاعب والمماطلة'],
  },
   {
    icon: 'shield',
    t: 'المشرف المتخصص',
    items: ['مراجعة فنية اختيارية', 'يضمن الجودة والحياد', 'يوثّق الملاحظات رسميًا', 'يساعد في حل النزاع بعدالة'],
  },
  {
    icon: 'scale',
    t: 'المستشار القانوني',
    items: ['يستقبل طلبات قانونية موثّقة', 'يصيغ ويراجع العقود', 'يحمي حقوق كل الأطراف', 'يتدخّل بالحياد وقت الخلاف'],
  },
  {
    icon: 'rocket',
    t: 'المستثمر',
    items: ['يتصفّح فرص استثمار مدروسة', 'يتواصل مع أصحاب المشاريع', 'بيانات وأرقام واضحة', 'صفقات موثّقة على المنصة'],
  },
  {
    icon: 'briefcase',
    t: 'الشركة الموظِّفة',
    items: ['توظّف مواهب مصرية عن بُعد', 'تتابع الشغل لحظة بلحظة', 'عقود ومكاتب موثّقة', 'دفعات وحقوق محفوظة'],
  },
  {
    icon: 'laptop',
    t: 'الباحث عن عمل',
    items: ['وظائف عن بُعد لشركات الخليج', 'تقديم سهل ومتابعة للطلبات', 'عقود تحمي حقّه المالي', 'سجل شغل يومي موثّق'],
  },
];

const LOGO = (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 3.2l9.5 3.6v6.8c0 6.2-4.2 10.7-9.5 12.4C10.7 24.3 6.5 19.8 6.5 13.6V6.8L16 3.2z" fill="rgba(255,255,255,.16)" stroke="#fff" strokeWidth="1.7" />
    <path d="M11.5 16l3 3 6-6.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function LandingPage() {
 const { t } = useSiteContent();
const { tr } = useI18n();
  const logoUrl = t('site.logo.url', '');
  const logoMark = logoUrl ? (
    <img
      src={logoUrl}
      alt="محايد"
      style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }}
    />
  ) : (
    LOGO
  );

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
      { threshold: 0.12 },
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
<div className="logo-mark small">{logoMark}</div>
            <div>
              <div className="brand-name">محايد</div>
              <span className="brand-tag">
                <Icon name="landmark" size={13} /> تحت إشراف حكومي
              </span>
            </div>
          </div>
          <nav className="main-nav">
            <a href="#how">كيف تعمل</a>
            <a href="#services">المجالات</a>
           <a href="#roles">لكل الأطراف</a>
<a href="#find">اختيار مقدم الخدمة</a>
<a href="#gov">الإشراف الحكومي</a>
          </nav>
          <div className="nav-actions">
          <LangSwitch />
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
            <span className="hero-badge">منصة تعمل تحت إشراف الحكومة المصرية</span>
{tr('landing.hero.title', 'نفّذ مشروعك بثقة، وحقوقك محفوظة من الأول للآخر')}
            <p>
              محايد منصة مستقلة تربط العميل بالمهندس أو الشركة داخل بيئة موثّقة:
              اتفاق واضح، متابعة بالمراحل، وإشراف متخصص يحمي كل الأطراف ويحل النزاعات بعدالة.
            </p>
            <div className="hero-buttons">
{tr('landing.hero.cta1', 'ابدأ مشروعك')}
{tr('landing.hero.cta2', 'اعرف كيف تعمل')}
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
              <div className="visual-bar"><span /></div>
              <p>المرحلة 2 من 3 — التصميم والتطوير</p>
              <div className="visual-row">
                <span>العميل</span>
                <span>مقدم الخدمة</span>
              </div>
            </div>
            <div className="float-badge one">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Icon name="badgeCheck" size={15} /> اتفاق موثّق
              </span>
            </div>
            <div className="float-badge two">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Icon name="shield" size={15} /> إشراف حكومي
              </span>
            </div>
          </div>
        </div>
      </section>

      <AdBanners placement="HOME_TOP" />
      {/* بانر الإشراف الحكومي */}
      <section id="gov" className="gov-band">
        <div className="gov-inner">
          <div className="gov-emblem">
            <Icon name="landmark" size={54} />
          </div>
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
      </section>

      <AdBanners placement="HOME_STRIP" />
      {/* كيف تعمل */}
      <section id="how" className="section">
        <div className="section-inner">
          <h2 className="section-title">إزاي محايد بيحمي حقك؟</h2>
          <p className="section-sub">أربع خطوات واضحة من بداية الفكرة لحد التسليم</p>
          <div className="steps-grid">
            {STEPS.map((s, i) => (
              <div key={i} className="step-card reveal">
                <div className="step-num">{i + 1}</div>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* المجالات */}
      <section id="services" className="section alt">
        <div className="section-inner">
          <h2 className="section-title">المجالات المتاحة الآن</h2>
          <p className="section-sub">نبدأ بالمجالات الأكثر طلبًا، وبنوسّع تباعًا</p>
          <div className="services-grid">
            {SERVICES.map((s, i) => (
              <div key={i} className="service-card reveal">
                <div className="service-icon">
                  <Icon name={s.icon} size={30} style={{ color: 'var(--green)' }} />
                </div>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
          <p className="soon-note">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon name="rocket" size={16} /> مجالات أكثر في الطريق قريبًا
            </span>
          </p>
        </div>
      </section>

      {/* لكل الأطراف */}
      <section id="roles" className="section">
        <div className="section-inner">
          <h2 className="section-title">منصة واحدة تحمي كل الأطراف</h2>
          <p className="section-sub">حقوق واضحة ومتوازنة للعميل، للمهندس والشركة، وللمشرف</p>
          <div className="roles-grid">
            {ROLES.map((r, i) => (
              <div key={i} className="role-card reveal">
                <div className="role-icon">
                  <Icon name={r.icon} size={26} style={{ color: 'var(--green)' }} />
                </div>
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

          {/* منصة تقنية وقانونية + طرق اختيار مقدم الخدمة */}
      <section id="find" className="section alt">
        <style>{`
.mh-tl{max-width:1080px;margin:0 auto;padding:0 20px;}
.mh-duo{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:8px;}
.mh-dcard{background:#fff;border:1px solid var(--line);border-radius:18px;padding:26px;display:flex;flex-direction:column;gap:12px;}
.mh-dic{width:54px;height:54px;border-radius:15px;background:var(--mint);color:var(--green-dark);display:flex;align-items:center;justify-content:center;}
.mh-dcard h3{font-size:19px;font-weight:800;color:var(--ink);margin:0;}
.mh-dcard p{font-size:14px;color:var(--muted);line-height:1.9;margin:0;}
.mh-ways{margin-top:34px;}
.mh-ways-h{text-align:center;font-size:20px;font-weight:800;color:var(--ink);margin:0 0 6px;}
.mh-ways-s{text-align:center;font-size:14px;color:var(--muted);margin:0 0 22px;}
.mh-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.mh-wc{background:#fff;border:1px solid var(--line);border-radius:16px;padding:20px;display:flex;gap:14px;align-items:flex-start;}
.mh-wn{width:34px;height:34px;border-radius:10px;background:var(--green);color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:15px;}
.mh-wc h4{font-size:15.5px;font-weight:800;color:var(--ink);margin:0 0 4px;}
.mh-wc p{font-size:13px;color:var(--muted);line-height:1.8;margin:0;}
.mh-cta{text-align:center;margin-top:26px;}
@media(max-width:720px){.mh-duo{grid-template-columns:1fr;}.mh-grid{grid-template-columns:1fr;}}
        `}</style>
        <div className="section-inner">
          <h2 className="section-title">منصة تقنية وقانونية في مكان واحد</h2>
          <p className="section-sub">
            مش بس بنوصّلك بمقدم الخدمة — بنحمي مشروعك تقنيًا وقانونيًا من أول خطوة لآخر تسليم
          </p>
          <div className="mh-tl">
            <div className="mh-duo">
              <div className="mh-dcard reveal">
                <div className="mh-dic"><Icon name="laptop" size={28} /></div>
                <h3>خبرة تقنية</h3>
                <p>
                  خبراء في التقنيات والبرمجيات والهندسة بيراجعوا جودة الشغل والتسليمات
                  في كل مرحلة، عشان اللي بيتنفّذ يبقى مطابق للمتفق عليه.
                </p>
              </div>
              <div className="mh-dcard reveal">
                <div className="mh-dic"><Icon name="scale" size={28} /></div>
                <h3>سند قانوني</h3>
                <p>
                  مستشارون قانونيون من فريق محايد بيصيغوا ويوثّقوا العقود، ويحموا حقوق
                  كل الأطراف، ويتدخّلوا بالحياد لو حصل أي خلاف — بقرارات عادلة وموثّقة.
                </p>
              </div>
            </div>

            <div className="mh-ways">
              <h3 className="mh-ways-h">اختار مقدم الخدمة بالطريقة اللي تناسبك</h3>
              <p className="mh-ways-s">أربع طرق مرنة، وكلها تحت نفس الحماية التقنية والقانونية</p>
              <div className="mh-grid">
                <div className="mh-wc reveal">
                  <span className="mh-wn">1</span>
                  <div>
                    <h4>اعرض مشروعك واستقبل عروض</h4>
                    <p>انشر مشروعك وخلّي مقدمي الخدمة المعتمدين يقدّموا عروضهم وتقارن بينهم.</p>
                  </div>
                </div>
                <div className="mh-wc reveal">
                  <span className="mh-wn">2</span>
                  <div>
                    <h4>اختار من المنصة بنفسك</h4>
                    <p>اتصفّح مقدمي الخدمة المعتمدين، شوف تقييماتهم وأعمالهم واختار الأنسب.</p>
                  </div>
                </div>
                <div className="mh-wc reveal">
                  <span className="mh-wn">3</span>
                  <div>
                    <h4>محايد ترشّحلك الأفضل</h4>
                    <p>قوللنا احتياجك وخبراؤنا يرشّحولك أنسب مقدم خدمة لطبيعة مشروعك وميزانيتك.</p>
                  </div>
                </div>
                <div className="mh-wc reveal">
                  <span className="mh-wn">4</span>
                  <div>
                    <h4>ادعُ طرف من خارج المنصة</h4>
                    <p>معاك مهندس أو شركة بتتعامل معاهم؟ ادعوهم يشتغلوا معاك بعقد موثّق وحماية كاملة.</p>
                  </div>
                </div>
              </div>
              <div className="mh-cta">
                <Link href="/register" className="lp-btn-primary">ابدأ واختار طريقتك</Link>
              </div>
            </div>
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
<div className="logo-mark small">{logoMark}</div> محايد
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
              <a href="#services">المجالات</a>
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
              <a href="#roles">حماية الحقوق</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">© 2026 محايد — جميع الحقوق محفوظة.</div>
      </footer>
    </>
  );
}
