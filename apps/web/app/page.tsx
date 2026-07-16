import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <header className="site-header">
        <div className="nav-inner">
          <Link href="/" className="brand">
            <div className="logo-mark">◇</div>
            <span className="brand-name">محايد</span>
          </Link>

          <nav className="main-nav">
            <a href="#how">كيف تعمل</a>
            <a href="#services">المجالات</a>
            <a href="#roles">للطرفين</a>
          </nav>

          <div className="nav-actions">
            <Link href="/login" className="nav-login">
              تسجيل الدخول
            </Link>
            <Link href="/register" className="nav-cta">
              ابدأ الآن
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="hero">
          <div className="hero-inner">
            <div className="hero-text">
              <span className="hero-badge">منصة محايدة لحماية الحقوق</span>
              <h1>نفّذ مشروعك بثقة، وحقوقك محفوظة من الأول للآخر</h1>
              <p>
                محايد منصة تربط بين العميل ومقدم الخدمة داخل بيئة موثقة، مع اتفاق
                واضح، ومتابعة للمراحل، وإمكانية إضافة مشرف متخصص لضمان جودة
                التنفيذ وحل النزاعات.
              </p>
              <div className="hero-buttons">
                <Link href="/register" className="lp-btn-primary">
                  ابدأ مشروعك
                </Link>
                <a href="#how" className="lp-btn-ghost">
                  اعرف كيف تعمل
                </a>
              </div>
              <div className="hero-stats">
                <div>
                  <b>موثّق</b>
                  <span>كل اتفاق ومرحلة</span>
                </div>
                <div>
                  <b>محايد</b>
                  <span>حماية الطرفين</span>
                </div>
                <div>
                  <b>مشرف خبير</b>
                  <span>مراجعة اختيارية</span>
                </div>
              </div>
            </div>

            <div className="hero-visual">
              <div className="visual-card">
                <span className="mini-chip">قيد التنفيذ</span>
                <h3>موقع تعريفي لشركة</h3>
                <div className="visual-bar">
                  <span style={{ width: '33%' }} />
                </div>
                <p>المرحلة 1 من 3 — التحليل والتصميم</p>
                <div className="visual-row">
                  <span>العميل</span>
                  <span>مقدم الخدمة</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* كيف تعمل */}
        <section className="section" id="how">
          <div className="section-inner">
            <h2 className="section-title">إزاي محايد بيحمي حقك؟</h2>
            <p className="section-sub">
              أربع خطوات واضحة من بداية المشروع لحد التسليم.
            </p>
            <div className="steps-grid">
              <div className="step-card">
                <div className="step-num">1</div>
                <h3>اتفاق موثق</h3>
                <p>تحدد نطاق العمل والمراحل والقيمة والمدة قبل البدء.</p>
              </div>
              <div className="step-card">
                <div className="step-num">2</div>
                <h3>تنفيذ على مراحل</h3>
                <p>كل مرحلة لها تسليم ومراجعة واعتماد مستقل.</p>
              </div>
              <div className="step-card">
                <div className="step-num">3</div>
                <h3>إشراف اختياري</h3>
                <p>تقدر تضيف مشرف خبير يراجع التسليمات فنيًا.</p>
              </div>
              <div className="step-card">
                <div className="step-num">4</div>
                <h3>حل النزاعات</h3>
                <p>لو حصلت مشكلة، نظام شكاوى موثق يحفظ حق الطرفين.</p>
              </div>
            </div>
          </div>
        </section>

        {/* المجالات */}
        <section className="section alt" id="services">
          <div className="section-inner">
            <h2 className="section-title">المجالات المتاحة الآن</h2>
            <p className="section-sub">
              نبدأ بمجالات العمل عن بُعد، وبعدها نتوسع تدريجيًا.
            </p>
            <div className="services-grid">
              <div className="service-card">
                <div className="service-icon">💻</div>
                <h3>البرمجة والسوفتوير</h3>
                <p>مواقع، تطبيقات، أنظمة، ولوحات تحكم.</p>
              </div>
              <div className="service-card">
                <div className="service-icon">📐</div>
                <h3>الهندسة والرسومات</h3>
                <p>تصميمات ورسومات هندسية عن بُعد.</p>
              </div>
              <div className="service-card">
                <div className="service-icon">🎨</div>
                <h3>التصميم والواجهات</h3>
                <p>UI/UX وهوية بصرية للمشاريع.</p>
              </div>
            </div>
            <p className="soon-note">قريبًا: مجالات جديدة بنفس نظام الحماية.</p>
          </div>
        </section>

        {/* للطرفين */}
        <section className="section" id="roles">
          <div className="section-inner">
            <h2 className="section-title">للطرفين — العميل ومقدم الخدمة</h2>
            <div className="roles-grid">
              <div className="role-card">
                <h3>لو أنت عميل</h3>
                <ul>
                  <li>تتابع مشروعك بوضوح خطوة بخطوة</li>
                  <li>تعتمد كل مرحلة قبل ما تكمل</li>
                  <li>تقدر تضيف مشرف يراجع لك التنفيذ</li>
                  <li>حقك محفوظ لو حصلت أي مشكلة</li>
                </ul>
                <Link href="/register" className="lp-btn-primary small">
                  ابدأ كعميل
                </Link>
              </div>
              <div className="role-card">
                <h3>لو أنت شركة أو فريلانسر</h3>
                <ul>
                  <li>تستقبل طلبات وتقدم عروض واضحة</li>
                  <li>تتفق على نطاق ومراحل موثقة</li>
                  <li>تسلّم شغلك وتاخد حقك بأمان</li>
                  <li>سمعتك بتكبر مع كل مشروع ناجح</li>
                </ul>
                <Link href="/register" className="lp-btn-primary small">
                  ابدأ كمقدم خدمة
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta-band">
          <div className="cta-inner">
            <h2>جاهز تبدأ مشروعك على محايد؟</h2>
            <p>سجّل دلوقتي وابدأ أول مشروع موثق بحقوق محفوظة للطرفين.</p>
            <Link href="/register" className="btn-light">
              إنشاء حساب مجاني
            </Link>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="logo-mark small">◇</div>
            <span>محايد</span>
          </div>
          <div className="footer-cols">
            <div>
              <h4>المنصة</h4>
              <a href="#how">كيف تعمل</a>
              <a href="#services">المجالات</a>
              <a href="#roles">للطرفين</a>
            </div>
            <div>
              <h4>الدعم</h4>
              <a href="#">مركز المساعدة</a>
              <a href="#">تواصل معنا</a>
              <a href="#">الأسئلة الشائعة</a>
            </div>
            <div>
              <h4>قانوني</h4>
              <a href="#">الشروط والأحكام</a>
              <a href="#">سياسة الخصوصية</a>
              <a href="#">سياسة النزاعات</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">© 2026 محايد — جميع الحقوق محفوظة</div>
      </footer>
    </>
  );
}
