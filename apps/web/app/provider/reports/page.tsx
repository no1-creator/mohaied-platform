'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import ProviderShell from '@/components/ProviderShell';

type Invoice = {
  id: string;
  status?: string;
  total?: number | string | null;
  currency?: string | null;
  paidAt?: string | null;
  issueDate?: string | null;
  createdAt?: string;
  client?: { id: string; name: string } | null;
};
type ExtProject = {
  id: string;
  status?: string;
  value?: number | string | null;
  currency?: string | null;
};

const num = (v?: number | string | null) => {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
};
const money = (v: number) => `${Math.round(v).toLocaleString('en-US')} ج.م`;

const INV_STATUSES = [
  { k: 'PAID', l: 'مدفوعة', cls: 'rp-b-green' },
  { k: 'SENT', l: 'مُرسلة', cls: 'rp-b-amber' },
  { k: 'DRAFT', l: 'مسودة', cls: 'rp-b-gray' },
  { k: 'CANCELLED', l: 'ملغية', cls: 'rp-b-red' },
];

export default function ProviderReportsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [ext, setExt] = useState<ExtProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api<Invoice[]>('/invoices').then((d) => setInvoices(Array.isArray(d) ? d : [])),
      api<ExtProject[]>('/external-projects').then((d) => setExt(Array.isArray(d) ? d : [])).catch(() => setExt([])),
    ])
      .catch((e: any) => setError(e?.message || 'حصل خطأ'))
      .finally(() => setLoading(false));
  }, []);

  const data = useMemo(() => {
    const up = (s?: string) => (s || '').toUpperCase();
    const paid = invoices.filter((i) => up(i.status) === 'PAID');
    const sent = invoices.filter((i) => up(i.status) === 'SENT');

    const collected = paid.reduce((s, i) => s + num(i.total), 0);
    const pending = sent.reduce((s, i) => s + num(i.total), 0);
    const allTotal = invoices.reduce((s, i) => s + num(i.total), 0);
    const avg = invoices.length ? allTotal / invoices.length : 0;
    const collectionRate = collected + pending > 0 ? Math.round((collected / (collected + pending)) * 100) : 0;
    const extValue = ext.reduce((s, p) => s + num(p.value), 0);

    // آخر ٦ شهور
    const now = new Date();
    const months = Array.from({ length: 6 }).map((_, idx) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
      return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('ar-EG', { month: 'short' }), total: 0 };
    });
    paid.forEach((i) => {
      const raw = i.paidAt || i.issueDate || i.createdAt;
      if (!raw) return;
      const dt = new Date(raw);
      const key = `${dt.getFullYear()}-${dt.getMonth()}`;
      const b = months.find((m) => m.key === key);
      if (b) b.total += num(i.total);
    });
    const maxMonth = Math.max(...months.map((m) => m.total), 1);

    // توزيع الحالات
    const statusRows = INV_STATUSES.map((s) => {
      const rows = invoices.filter((i) => up(i.status) === s.k);
      return { ...s, count: rows.length, amount: rows.reduce((a, i) => a + num(i.total), 0) };
    });
    const maxStatusAmount = Math.max(...statusRows.map((s) => s.amount), 1);

    // أفضل العملاء (بالإيراد المحصّل)
    const byClient = new Map<string, number>();
    paid.forEach((i) => {
      const name = i.client?.name || 'بدون عميل';
      byClient.set(name, (byClient.get(name) || 0) + num(i.total));
    });
    const topClients = Array.from(byClient.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
    const maxClient = Math.max(...topClients.map((c) => c.total), 1);

    return {
      collected, pending, avg, collectionRate, extValue, extCount: ext.length,
      invoiceCount: invoices.length, months, maxMonth, statusRows, maxStatusAmount, topClients, maxClient,
    };
  }, [invoices, ext]);

  const isEmpty = invoices.length === 0 && ext.length === 0;

  return (
    <ProviderShell active="reports" title="التقارير والأداء">
      <style>{RP_CSS}</style>
      <div className="rp-wrap">
        {loading ? (
          <div className="rp-state">جاري تجهيز التقارير...</div>
        ) : error ? (
          <div className="rp-state rp-err">{error}</div>
        ) : isEmpty ? (
          <div className="rp-empty">
            <div className="rp-empty-emoji">📊</div>
            <h3>لسه مفيش بيانات كفاية للتقارير</h3>
            <p>أول ما تبدأ تسجّل فواتير ومشاريع، هتلاقي هنا تحليل كامل لأرباحك وأدائك.</p>
          </div>
        ) : (
          <>
            {/* المؤشرات */}
            <div className="rp-kpis">
              <Kpi label="إجمالي المحصّل" value={money(data.collected)} accent="green" />
              <Kpi label="قيد التحصيل" value={money(data.pending)} accent="amber" />
              <Kpi label="نسبة التحصيل" value={`${data.collectionRate}%`} accent="green" />
              <Kpi label="عدد الفواتير" value={String(data.invoiceCount)} />
              <Kpi label="متوسط الفاتورة" value={money(data.avg)} />
              <Kpi label="المشاريع الخارجية" value={money(data.extValue)} sub={`${data.extCount} مشروع`} />
            </div>

            {/* الأرباح الشهرية */}
            <div className="rp-card">
              <div className="rp-card-h">الأرباح المحصّلة — آخر ٦ شهور</div>
              <div className="rp-bars">
                {data.months.map((m) => (
                  <div key={m.key} className="rp-bar-col">
                    <div className="rp-bar-val">{m.total > 0 ? Math.round(m.total).toLocaleString('en-US') : ''}</div>
                    <div className="rp-bar-track">
                      <div className="rp-bar-fill" style={{ height: `${Math.max((m.total / data.maxMonth) * 100, m.total > 0 ? 6 : 0)}%` }} />
                    </div>
                    <div className="rp-bar-label">{m.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rp-grid2">
              {/* توزيع الفواتير */}
              <div className="rp-card">
                <div className="rp-card-h">توزيع الفواتير بالحالة</div>
                <div className="rp-rows">
                  {data.statusRows.map((s) => (
                    <div key={s.k} className="rp-row">
                      <div className="rp-row-top">
                        <span className={`rp-badge ${s.cls}`}>{s.l}</span>
                        <span className="rp-row-count">{s.count} فاتورة · {money(s.amount)}</span>
                      </div>
                      <div className="rp-line-track">
                        <div className={`rp-line-fill ${s.cls}-fill`} style={{ width: `${(s.amount / data.maxStatusAmount) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* أفضل العملاء */}
              <div className="rp-card">
                <div className="rp-card-h">أفضل العملاء بالإيراد</div>
                {data.topClients.length === 0 ? (
                  <div className="rp-mini-empty">لسه مفيش إيراد محصّل من عملاء.</div>
                ) : (
                  <div className="rp-rows">
                    {data.topClients.map((c, idx) => (
                      <div key={c.name} className="rp-row">
                        <div className="rp-row-top">
                          <span className="rp-client"><b className="rp-rank">{idx + 1}</b> {c.name}</span>
                          <span className="rp-row-count">{money(c.total)}</span>
                        </div>
                        <div className="rp-line-track">
                          <div className="rp-line-fill rp-b-green-fill" style={{ width: `${(c.total / data.maxClient) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rp-note">التقارير بتتحدّث تلقائيًا مع كل فاتورة أو مشروع جديد. الأرباح المحصّلة محسوبة من الفواتير المعلّمة «مدفوعة».</div>
          </>
        )}
      </div>
    </ProviderShell>
  );
}

function Kpi({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: 'green' | 'amber' }) {
  return (
    <div className={`rp-kpi ${accent === 'green' ? 'rp-kpi-green' : accent === 'amber' ? 'rp-kpi-amber' : ''}`}>
      <div className="rp-kpi-v">{value}</div>
      <div className="rp-kpi-l">{label}</div>
      {sub && <div className="rp-kpi-s">{sub}</div>}
    </div>
  );
}

const RP_CSS = `
.rp-wrap{max-width:1040px;margin:0 auto;}
.rp-state{padding:50px;text-align:center;color:var(--muted);}
.rp-err{color:#b42318;}
.rp-empty{text-align:center;padding:60px 20px;color:var(--muted);}
.rp-empty-emoji{font-size:44px;margin-bottom:10px;}
.rp-empty h3{color:var(--ink);font-size:18px;font-weight:900;margin:0 0 6px;}
.rp-empty p{font-size:14px;margin:0;}
.rp-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px;}
.rp-kpi{background:#fff;border:1px solid var(--line);border-radius:14px;padding:16px;text-align:center;}
.rp-kpi-green{border-color:var(--green);box-shadow:0 8px 20px rgba(40,125,115,.1);}
.rp-kpi-amber{border-color:#f0d9a8;}
.rp-kpi-v{font-size:22px;font-weight:900;color:var(--green-dark);}
.rp-kpi-amber .rp-kpi-v{color:#a86a12;}
.rp-kpi-l{font-size:13px;color:var(--muted);margin-top:3px;}
.rp-kpi-s{font-size:12px;color:var(--green);font-weight:700;margin-top:2px;}
.rp-card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px 20px;margin-bottom:16px;}
.rp-card-h{font-weight:900;color:var(--ink);font-size:15.5px;margin-bottom:16px;}
.rp-bars{display:flex;align-items:flex-end;gap:10px;height:200px;}
.rp-bar-col{flex:1;display:flex;flex-direction:column;align-items:center;height:100%;}
.rp-bar-val{font-size:11px;font-weight:800;color:var(--green-dark);margin-bottom:4px;height:14px;white-space:nowrap;}
.rp-bar-track{flex:1;width:100%;display:flex;align-items:flex-end;background:var(--background);border-radius:8px;overflow:hidden;}
.rp-bar-fill{width:100%;background:linear-gradient(to top,var(--green),var(--green-light));border-radius:8px 8px 0 0;transition:height .4s ease;}
.rp-bar-label{font-size:12px;color:var(--muted);margin-top:8px;font-weight:700;}
.rp-grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.rp-grid2 .rp-card{margin-bottom:0;}
.rp-rows{display:flex;flex-direction:column;gap:14px;}
.rp-row-top{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px;}
.rp-badge{font-size:12px;font-weight:800;padding:3px 11px;border-radius:999px;}
.rp-b-green{background:#e3f4ec;color:#1c7a4f;}
.rp-b-amber{background:#fdf0d9;color:#a86a12;}
.rp-b-gray{background:#eef1f0;color:#67736f;}
.rp-b-red{background:#fdecec;color:#b42318;}
.rp-row-count{font-size:12.5px;color:var(--muted);font-weight:700;}
.rp-client{font-size:13.5px;color:var(--ink);font-weight:700;display:flex;align-items:center;gap:8px;}
.rp-rank{background:var(--mint);color:var(--green-dark);width:20px;height:20px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;}
.rp-line-track{height:8px;background:var(--background);border-radius:999px;overflow:hidden;}
.rp-line-fill{height:100%;border-radius:999px;transition:width .4s ease;min-width:2px;}
.rp-b-green-fill{background:var(--green);}
.rp-b-amber-fill{background:#e0a53a;}
.rp-b-gray-fill{background:#b9c2be;}
.rp-b-red-fill{background:#d9544d;}
.rp-mini-empty{color:var(--muted);font-size:13px;padding:14px 0;text-align:center;}
.rp-note{font-size:12px;color:var(--muted);margin-top:16px;line-height:1.7;text-align:center;}
@media(max-width:820px){.rp-kpis{grid-template-columns:repeat(2,1fr);}.rp-grid2{grid-template-columns:1fr;}}
@media(max-width:520px){.rp-kpis{grid-template-columns:1fr 1fr;}.rp-bars{height:160px;}}
`;
