'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/TopBar';
import BackBar from '@/components/BackBar';

const PS_CSS = `
.ps-wrap{max-width:960px;margin:0 auto;width:100%;padding:26px 20px 90px;}
.ps-head{text-align:center;max-width:680px;margin:0 auto 30px;}
.ps-kicker{display:inline-block;background:var(--mint);color:var(--green-dark);font-weight:800;font-size:12.5px;padding:6px 14px;border-radius:999px;margin-bottom:14px;}
.ps-title{font-size:28px;font-weight:800;color:var(--ink);margin:0 0 10px;line-height:1.35;}
.ps-sub{color:var(--muted);font-size:15px;line-height:1.85;margin:0;}
.ps-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.ps-card{position:relative;text-align:right;background:#fff;border:1px solid var(--line);border-radius:18px;padding:22px 22px 24px;cursor:pointer;transition:transform .15s,box-shadow .15s,border-color .15s;display:flex;flex-direction:column;gap:12px;font-family:inherit;}
.ps-card:hover{transform:translateY(-3px);box-shadow:0 16px 34px rgba(24,70,61,.08);border-color:var(--green-light);}
.ps-card.soon{cursor:default;}
.ps-card.soon:hover{transform:none;box-shadow:none;border-color:var(--line);}
.ps-ic{width:50px;height:50px;border-radius:14px;background:var(--mint);color:var(--green-dark);display:flex;align-items:center;justify-content:center;}
.ps-ct{font-size:17.5px;font-weight:800;color:var(--ink);margin:0;}
.ps-desc{font-size:13.5px;color:var(--muted);line-height:1.85;margin:0;flex:1;}
.ps-tag{align-self:flex-start;font-size:12px;font-weight:800;padding:5px 12px;border-radius:999px;}
.ps-tag.now{background:#e7f6f0;color:var(--green-dark);}
.ps-tag.soon{background:#f3f4f6;color:#6b7280;}
.ps-badge{position:absolute;top:16px;left:16px;background:#f3f4f6;color:#6b7280;font-size:11px;font-weight:800;padding:4px 10px;border-radius:999px;}
.ps-foot{margin-top:26px;background:var(--mint);border:1px solid #d6ebe3;border-radius:16px;padding:18px 20px;display:flex;gap:14px;align-items:flex-start;}
.ps-foot-ic{flex-shrink:0;color:var(--green-dark);}
.ps-foot-tx{font-size:13.5px;color:var(--ink);line-height:1.85;margin:0;}
@media(max-width:720px){.ps-grid{grid-template-columns:1fr;}.ps-title{font-size:23px;}}
`;

const ICON_MEGAPHONE = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11v2a1 1 0 0 0 1 1h1.5l4 4V6l-4 4H4a1 1 0 0 0-1 1Z"/><path d="M15 8a5 5 0 0 1 0 8"/><path d="M18 5a9 9 0 0 1 0 14"/></svg>
);
const ICON_GRID = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
);
const ICON_STAR = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.9l1-5.8L3.5 9.2l5.9-.9L12 3Z"/></svg>
);
const ICON_INVITE = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></svg>
);
const ICON_SHIELD = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z"/><path d="M9 12l2 2 4-4"/></svg>
);

export default function ProjectStartPage() {
  const router = useRouter();
  const [note, setNote] = useState('');

  function soon(label: string) {
    setNote(`مسار «${label}» جايه قريبًا بإذن الله. دلوقتي تقدر تعرض مشروعك وتستقبل عروض أسعار من مقدمي الخدمة المعتمدين.`);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <>
      <style>{PS_CSS}</style>
      <TopBar />
      <BackBar />
      <div className="ps-wrap">
        <div className="ps-head">
          <span className="ps-kicker">اختيار مقدم الخدمة</span>
          <h1 className="ps-title">إزاي عايز تلاقي مقدم الخدمة المناسب؟</h1>
          <p className="ps-sub">
            محايد منصة تقنية وقانونية بتحمي حقوقك في كل خطوة. اختار الطريقة اللي تناسبك —
            وكل الخيارات تحت إشراف خبرائنا التقنيين وفريقنا القانوني.
          </p>
        </div>

        {note && (
          <div
            style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#1d4ed8',
              padding: '11px 14px',
              borderRadius: 12,
              fontSize: 14,
              marginBottom: 16,
              textAlign: 'center',
              lineHeight: 1.8,
            }}
          >
            {note}
          </div>
        )}

        <div className="ps-grid">
          {/* الخيار المتاح الآن: عرض المشروع واستقبال عروض */}
          <button className="ps-card" onClick={() => router.push('/projects/new')}>
            <span className="ps-ic">{ICON_MEGAPHONE}</span>
            <h2 className="ps-ct">اعرض مشروعك واستقبل عروض أسعار</h2>
            <p className="ps-desc">
              انشر تفاصيل مشروعك وخلّي مقدمي الخدمة المعتمدين يقدّموا عروضهم، وقارن بينهم واختار الأنسب ليك.
            </p>
            <span className="ps-tag now">متاح الآن</span>
          </button>

{/* اختيار من المنصة */}
<button className="ps-card" onClick={() => router.push('/providers')}>
  <span className="ps-ic">{ICON_GRID}</span>
  <h2 className="ps-ct">اختار مقدم خدمة من المنصة</h2>
  <p className="ps-desc">
    اتصفّح مقدمي الخدمة المعتمدين على محايد، شوف تقييماتهم وأعمالهم، واختار اللي يناسبك بنفسك.
  </p>
  <span className="ps-tag now">متاح الآن</span>
</button>
       {/* رشّحلي الأفضل */}
<button className="ps-card" onClick={() => router.push('/projects/recommend')}>
  <span className="ps-ic">{ICON_STAR}</span>
  <h2 className="ps-ct">محايد ترشّحلك الأفضل</h2>
  <p className="ps-desc">
    قوللنا احتياجك، وخبراؤنا التقنيون يرشّحولك أنسب مقدم خدمة لطبيعة مشروعك وميزانيتك.
  </p>
  <span className="ps-tag now">متاح الآن</span>
</button>
          {/* دعوة طرف خارجي */}
         {/* دعوة طرف خارجي */}
<button className="ps-card" onClick={() => router.push('/projects/invite')}>
  <span className="ps-ic">{ICON_INVITE}</span>
  <h2 className="ps-ct">عندي مقدم خدمة من خارج المنصة</h2>
  <p className="ps-desc">
    معاك مهندس أو شركة بتتعامل معاهم؟ ادعوهم يشتغلوا معاك جوه محايد بعقد موثّق وحماية كاملة للحقوق.
  </p>
  <span className="ps-tag now">متاح الآن</span>
</button>
        </div>

        <div className="ps-foot">
          <span className="ps-foot-ic">{ICON_SHIELD}</span>
          <p className="ps-foot-tx">
            <strong>حماية تقنية وقانونية:</strong> كل تعامل على محايد بيمرّ بخبراء تقنيين لمراجعة الجودة
            والتسليمات، وفريق قانوني داخلي لصياغة وتوثيق العقود وحماية حقوق كل الأطراف.
          </p>
        </div>
      </div>
    </>
  );
}
