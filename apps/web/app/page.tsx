'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import Icon from '@/components/Icon';
import AdBanners from '@/components/AdBanners';
import { useSiteContent } from '@/lib/content';
import { useI18n } from '@/lib/i18n';
import LangSwitch from '@/components/LangSwitch';

const STEPS = [
  { t: 'landing.steps.1.t', d: 'landing.steps.1.d' },
  { t: 'landing.steps.2.t', d: 'landing.steps.2.d' },
  { t: 'landing.steps.3.t', d: 'landing.steps.3.d' },
  { t: 'landing.steps.4.t', d: 'landing.steps.4.d' },
];

const SERVICES = [
  { icon: 'laptop', t: 'landing.svc.1.t', d: 'landing.svc.1.d' },
  { icon: 'ruler', t: 'landing.svc.2.t', d: 'landing.svc.2.d' },
  { icon: 'palette', t: 'landing.svc.3.t', d: 'landing.svc.3.d' },
  { icon: 'scale', t: 'landing.svc.4.t', d: 'landing.svc.4.d' },
  { icon: 'rocket', t: 'landing.svc.5.t', d: 'landing.svc.5.d' },
  { icon: 'briefcase', t: 'landing.svc.6.t', d: 'landing.svc.6.d' },
];

const ROLES = [
  { icon: 'user', t: 'landing.role.1.t', items: ['landing.role.1.i1', 'landing.role.1.i2', 'landing.role.1.i3', 'landing.role.1.i4'] },
  { icon: 'building', t: 'landing.role.2.t', items: ['landing.role.2.i1', 'landing.role.2.i2', 'landing.role.2.i3', 'landing.role.2.i4'] },
  { icon: 'shield', t: 'landing.role.3.t', items: ['landing.role.3.i1', 'landing.role.3.i2', 'landing.role.3.i3', 'landing.role.3.i4'] },
  { icon: 'scale', t: 'landing.role.4.t', items: ['landing.role.4.i1', 'landing.role.4.i2', 'landing.role.4.i3', 'landing.role.4.i4'] },
  { icon: 'rocket', t: 'landing.role.5.t', items: ['landing.role.5.i1', 'landing.role.5.i2', 'landing.role.5.i3', 'landing.role.5.i4'] },
  { icon: 'briefcase', t: 'landing.role.6.t', items: ['landing.role.6.i1', 'landing.role.6.i2', 'landing.role.6.i3', 'landing.role.6.i4'] },
  { icon: 'laptop', t: 'landing.role.7.t', items: ['landing.role.7.i1', 'landing.role.7.i2', 'landing.role.7.i3', 'landing.role.7.i4'] },
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
                <Icon name="landmark" size={13} /> {tr('landing.brandTag', 'تحت إشراف حكومي')}
              </span>
            </div>
          </div>
          <nav className="main-nav">
            <a href="#how">{tr('landing.nav.how', 'كيف تعمل')}</a>
            <a href="#services">{tr('landing.nav.services', 'المجالات')}</a>
            <a href="#roles">{tr('landing.nav.roles', 'لكل الأطراف')}</a>
            <a href="#find">{tr('landing.nav.find', 'اختيار مقدم الخدمة')}</a>
            <a href="#gov">{tr('landing.nav.gov', 'الإشراف الحكومي')}</a>
          </nav>
          <div className="nav-actions">
            <LangSwitch />
            <Link href="/login" className="nav-login">{tr('common.login', 'تسجيل الدخول')}</Link>
            <Link href="/register" className="nav-cta">{tr('common.startNow', 'ابدأ الآن')}</Link>
          </div>
        </div>
      </header>

      {/* الهيرو */}
      <section className="hero">
        <div className="hero-blob one" />
        <div className="hero-blob two" />
        <div className="hero-inner">
          <div className="hero-text">
            <span className="hero-badge">{tr('landing.hero.eyebrow', 'منصة تعمل تحت إشراف الحكومة المصرية')}</span>
            <h1>{tr('landing.hero.title', 'نفّذ مشروعك بثقة، وحقوقك محفوظة من الأول للآخر')}</h1>
            <p>
              {tr('landing.hero.subtitle', 'محايد منصة مستقلة تربط العميل بالمهندس أو الشركة داخل بيئة موثّقة: اتفاق واضح، متابعة بالمراحل، وإشراف متخصص يحمي كل الأطراف ويحل النزاعات بعدالة.')}
            </p>
            <div className="hero-buttons">
              <Link href="/register" className="lp-btn-primary">{tr('landing.hero.cta1', 'ابدأ مشروعك')}</Link>
              <a href="#how" className="lp-btn-ghost">{tr('landing.hero.cta2', 'اعرف كيف تعمل')}</a>
            </div>
            <div className="hero-stats">
              <div><b>100%</b><span>{tr('landing.hero.stat1', 'توثيق للاتفاقات')}</span></div>
              <div><b>3</b><span>{tr('landing.hero.stat2', 'أطراف محميّة')}</span></div>
              <div><b>24/7</b><span>{tr('landing.hero.stat3', 'متابعة ودعم')}</span></div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-card floating">
              <span className="mini-chip">{tr('landing.hero.card.chip', 'قيد التنفيذ')}</span>
              <h3>{tr('landing.hero.card.title', 'موقع تعريفي لشركة')}</h3>
              <div className="visual-bar"><span /></div>
              <p>{tr('landing.hero.card.phase', 'المرحلة 2 من 3 — التصميم والتطوير')}</p>
              <div className="visual-row">
                <span>{tr('landing.hero.card.client', 'العميل')}</span>
                <span>{tr('landing.hero.card.provider', 'مقدم الخدمة')}</span>
              </div>
            </div>
            <div className="float-badge one">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Icon name="badgeCheck" size={15} /> {tr('landing.hero.badge1', 'اتفاق موثّق')}
              </span>
            </div>
            <div className="float-badge two">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Icon name="shield" size={15} /> {tr('landing.hero.badge2', 'إشراف حكومي')}
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
            <h2>{tr('landing.gov.title', 'منصة تعمل تحت إشراف الحكومة المصرية')}</h2>
            <p>
              {tr('landing.gov.desc', 'محايد تعمل ضمن إطار رقابي يضمن الشفافية والعدالة، ويحمي حقوق العميل والمهندس والشركة على حدٍّ سواء — من توثيق الاتفاق لحد تسليم المشروع.')}
            </p>
            <div className="gov-points">
              <div className="gov-point">
                <b>{tr('landing.gov.p1.t', 'حماية العميل')}</b>
                <span>{tr('landing.gov.p1.d', 'ضمان تنفيذ المتفق عليه بالجودة والوقت المحدد.')}</span>
              </div>
              <div className="gov-point">
                <b>{tr('landing.gov.p2.t', 'حماية المهندس والشركة')}</b>
                <span>{tr('landing.gov.p2.d', 'توثيق الحقوق المالية والمهنية بشكل رسمي.')}</span>
              </div>
              <div className="gov-point">
                <b>{tr('landing.gov.p3.t', 'رقابة وحياد')}</b>
                <span>{tr('landing.gov.p3.d', 'فضّ النزاعات بقرارات عادلة وموثّقة.')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AdBanners placement="HOME_STRIP" />
      {/* كيف تعمل */}
      <section id="how" className="section">
        <div className="section-inner">
          <h2 className="section-title">{tr('landing.how.title', 'إزاي محايد بيحمي حقك؟')}</h2>
          <p className="section-sub">{tr('landing.how.sub', 'أربع خطوات واضحة من بداية الفكرة لحد التسليم')}</p>
          <div className="steps-grid">
            {STEPS.map((s, i) => (
              <div key={i} className="step-card reveal">
                <div className="step-num">{i + 1}</div>
                <h3>{tr(s.t)}</h3>
                <p>{tr(s.d)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* المجالات */}
      <section id="services" className="section alt">
        <div className="section-inner">
          <h2 className="section-title">{tr('landing.services.sectionTitle', 'المجالات المتاحة الآن')}</h2>
          <p className="section-sub">{tr('landing.services.sub', 'نبدأ بالمجالات الأكثر طلبًا، وبنوسّع تباعًا')}</p>
          <div className="services-grid">
            {SERVICES.map((s, i) => (
              <div key={i} className="service-card reveal">
                <div className="service-icon">
                  <Icon name={s.icon} size={30} style={{ color: 'var(--green)' }} />
                </div>
                <h3>{tr(s.t)}</h3>
                <p>{tr(s.d)}</p>
              </div>
            ))}
          </div>
          <p className="soon-note">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon name="rocket" size={16} /> {tr('landing.services.soon', 'مجالات أكثر في الطريق قريبًا')}
            </span>
          </p>
        </div>
      </section>

      {/* لكل الأطراف */}
      <section id="roles" className="section">
        <div className="section-inner">
          <h2 className="section-title">{tr('landing.roles.sectionTitle', 'منصة واحدة تحمي كل الأطراف')}</h2>
          <p className="section-sub">{tr('landing.roles.sub', 'حقوق واضحة ومتوازنة للعميل، للمهندس والشركة، وللمشرف')}</p>
          <div className="roles-grid">
            {ROLES.map((r, i) => (
              <div key={i} className="role-card reveal">
                <div className="role-icon">
                  <Icon name={r.icon} size={26} style={{ color: 'var(--green)' }} />
                </div>
                <h3>{tr(r.t)}</h3>
                <ul>
                  {r.items.map((it, j) => (
                    <li key={j}>{tr(it)}</li>
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
          <h2 className="section-title">{tr('landing.mh.title', 'منصة تقنية وقانونية في مكان واحد')}</h2>
          <p className="section-sub">
            {tr('landing.mh.sub', 'مش بس بنوصّلك بمقدم الخدمة — بنحمي مشروعك تقنيًا وقانونيًا من أول خطوة لآخر تسليم')}
          </p>
          <div className="mh-tl">
            <div className="mh-duo">
              <div className="mh-dcard reveal">
                <div className="mh-dic"><Icon name="laptop" size={28} /></div>
                <h3>{tr('landing.mh.tech.t', 'خبرة تقنية')}</h3>
                <p>
                  {tr('landing.mh.tech.d', 'خبراء في التقنيات والبرمجيات والهندسة بيراجعوا جودة الشغل والتسليمات في كل مرحلة، عشان اللي بيتنفّذ يبقى مطابق للمتفق عليه.')}
                </p>
              </div>
              <div className="mh-dcard reveal">
                <div className="mh-dic"><Icon name="scale" size={28} /></div>
                <h3>{tr('landing.mh.legal.t', 'سند قانوني')}</h3>
                <p>
                  {tr('landing.mh.legal.d', 'مستشارون قانونيون من فريق محايد بيصيغوا ويوثّقوا العقود، ويحموا حقوق كل الأطراف، ويتدخّلوا بالحياد لو حصل أي خلاف — بقرارات عادلة وموثّقة.')}
                </p>
              </div>
            </div>

            <div className="mh-ways">
              <h3 className="mh-ways-h">{tr('landing.mh.ways.h', 'اختار مقدم الخدمة بالطريقة اللي تناسبك')}</h3>
              <p className="mh-ways-s">{tr('landing.mh.ways.s', 'أربع طرق مرنة، وكلها تحت نفس الحماية التقنية والقانونية')}</p>
              <div className="mh-grid">
                <div className="mh-wc reveal">
                  <span className="mh-wn">1</span>
                  <div>
                    <h4>{tr('landing.mh.w1.t', 'اعرض مشروعك واستقبل عروض')}</h4>
                    <p>{tr('landing.mh.w1.d', 'انشر مشروعك وخلّي مقدمي الخدمة المعتمدين يقدّموا عروضهم وتقارن بينهم.')}</p>
                  </div>
                </div>
                <div className="mh-wc reveal">
                  <span className="mh-wn">2</span>
                  <div>
                    <h4>{tr('landing.mh.w2.t', 'اختار من المنصة بنفسك')}</h4>
                    <p>{tr('landing.mh.w2.d', 'اتصفّح مقدمي الخدمة المعتمدين، شوف تقييماتهم وأعمالهم واختار الأنسب.')}</p>
                  </div>
                </div>
                <div className="mh-wc reveal">
                  <span className="mh-wn">3</span>
                  <div>
                    <h4>{tr('landing.mh.w3.t', 'محايد ترشّحلك الأفضل')}</h4>
                    <p>{tr('landing.mh.w3.d', 'قوللنا احتياجك وخبراؤنا يرشّحولك أنسب مقدم خدمة لطبيعة مشروعك وميزانيتك.')}</p>
                  </div>
                </div>
                <div className="mh-wc reveal">
                  <span className="mh-wn">4</span>
                  <div>
                    <h4>{tr('landing.mh.w4.t', 'ادعُ طرف من خارج المنصة')}</h4>
                    <p>{tr('landing.mh.w4.d', 'معاك مهندس أو شركة بتتعامل معاهم؟ ادعوهم يشتغلوا معاك بعقد موثّق وحماية كاملة.')}</p>
                  </div>
                </div>
              </div>
              <div className="mh-cta">
                <Link href="/register" className="lp-btn-primary">{tr('landing.mh.cta', 'ابدأ واختار طريقتك')}</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-band">
        <div className="cta-inner">
          <h2>{tr('landing.cta.title', 'جاهز تبدأ مشروعك بثقة؟')}</h2>
          <p>{tr('landing.cta.desc', 'سجّل دلوقتي وابدأ أول مشروع محمي بالكامل تحت إشراف محايد.')}</p>
          <Link href="/register" className="btn-light">{tr('landing.cta.btn', 'أنشئ حسابك مجانًا')}</Link>
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
              {tr('landing.footer.about', 'منصة محايدة لحماية الحقوق، تعمل تحت إشراف الحكومة المصرية لضمان تنفيذ المشاريع بعدالة وشفافية.')}
            </p>
          </div>
          <div className="footer-cols">
            <div>
              <h4>{tr('landing.footer.col1.h', 'المنصة')}</h4>
              <a href="#how">{tr('landing.nav.how', 'كيف تعمل')}</a>
              <a href="#services">{tr('landing.nav.services', 'المجالات')}</a>
              <a href="#roles">{tr('landing.nav.roles', 'لكل الأطراف')}</a>
            </div>
            <div>
              <h4>{tr('landing.footer.col2.h', 'ابدأ')}</h4>
              <Link href="/register">{tr('landing.footer.createAccount', 'إنشاء حساب')}</Link>
              <Link href="/login">{tr('common.login', 'تسجيل الدخول')}</Link>
            </div>
            <div>
              <h4>{tr('landing.footer.col3.h', 'عن محايد')}</h4>
              <a href="#gov">{tr('landing.nav.gov', 'الإشراف الحكومي')}</a>
              <a href="#roles">{tr('landing.footer.rights', 'حماية الحقوق')}</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">{tr('landing.footer.copyright', '© 2026 محايد — جميع الحقوق محفوظة.')}</div>
      </footer>
    </>
  );
}
