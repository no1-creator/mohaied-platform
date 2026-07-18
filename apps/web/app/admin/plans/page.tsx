'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { api } from '@/lib/api';
import Icon from '@/components/Icon';
import BackBar from '@/components/BackBar';

type Plan = {
  id: string;
  name: string;
  description?: string | null;
  price: string | number;
  billingCycle: 'MONTHLY' | 'YEARLY';
  commissionRate: string | number;
  features?: string | null;
  maxOffers?: number | null;
  isFeatured: boolean;
  isActive: boolean;
  orderIndex: number;
};

type Settings = {
  id: string;
  defaultCommissionRate: string | number;
  escrowEnabled: boolean;
  platformName: string;
  supportEmail?: string | null;
};

type PlanForm = {
  name: string;
  description: string;
  price: string;
  billingCycle: 'MONTHLY' | 'YEARLY';
  commissionRate: string;
  features: string;
  maxOffers: string;
  isFeatured: boolean;
  isActive: boolean;
  orderIndex: string;
};

const EMPTY_FORM: PlanForm = {
  name: '',
  description: '',
  price: '0',
  billingCycle: 'MONTHLY',
  commissionRate: '10',
  features: '',
  maxOffers: '',
  isFeatured: false,
  isActive: true,
  orderIndex: '0',
};

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [sForm, setSForm] = useState({
    defaultCommissionRate: '',
    escrowEnabled: true,
    platformName: '',
    supportEmail: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // null=مغلق, 'new'=جديد
  const [form, setForm] = useState<PlanForm>(EMPTY_FORM);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [s, p] = await Promise.all([
        api<Settings>('/settings'),
        api<Plan[]>('/subscriptions/plans/all'),
      ]);
      setSForm({
        defaultCommissionRate: String(s.defaultCommissionRate ?? ''),
        escrowEnabled: !!s.escrowEnabled,
        platformName: s.platformName ?? '',
        supportEmail: s.supportEmail ?? '',
      });
      setPlans(p);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    setBusy(true);
    setError('');
    setMsg('');
    try {
      const payload: any = {
        defaultCommissionRate: Number(sForm.defaultCommissionRate) || 0,
        escrowEnabled: sForm.escrowEnabled,
        platformName: sForm.platformName.trim(),
      };
      if (sForm.supportEmail.trim()) payload.supportEmail = sForm.supportEmail.trim();
      await api<Settings>('/settings', { method: 'PATCH', body: payload });
      setMsg('تم حفظ الإعدادات ✅');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function openNew() {
    setForm(EMPTY_FORM);
    setEditingId('new');
    setMsg('');
  }

  function openEdit(p: Plan) {
    setForm({
      name: p.name,
      description: p.description ?? '',
      price: String(Number(p.price)),
      billingCycle: p.billingCycle,
      commissionRate: String(Number(p.commissionRate)),
      features: p.features ?? '',
      maxOffers: p.maxOffers != null ? String(p.maxOffers) : '',
      isFeatured: p.isFeatured,
      isActive: p.isActive,
      orderIndex: String(p.orderIndex ?? 0),
    });
    setEditingId(p.id);
    setMsg('');
  }

  async function savePlan() {
    if (!form.name.trim()) {
      setError('اكتب اسم الباقة');
      return;
    }
    setBusy(true);
    setError('');
    setMsg('');
    try {
      const payload: any = {
        name: form.name.trim(),
        price: Number(form.price) || 0,
        billingCycle: form.billingCycle,
        commissionRate: Number(form.commissionRate) || 0,
        isFeatured: form.isFeatured,
        isActive: form.isActive,
        orderIndex: Number(form.orderIndex) || 0,
      };
      if (form.description.trim()) payload.description = form.description.trim();
      if (form.features.trim()) payload.features = form.features.trim();
      if (form.maxOffers.trim() !== '') payload.maxOffers = Number(form.maxOffers);

      if (editingId === 'new') {
        await api('/subscriptions/plans', { method: 'POST', body: payload });
        setMsg('تمت إضافة الباقة ✅');
      } else {
        await api(`/subscriptions/plans/${editingId}`, { method: 'PATCH', body: payload });
        setMsg('تم تحديث الباقة ✅');
      }
      setEditingId(null);
      await loadAll();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function deletePlan(p: Plan) {
    if (!confirm(`حذف باقة "${p.name}"؟`)) return;
    setBusy(true);
    setError('');
    try {
      await api(`/subscriptions/plans/${p.id}`, { method: 'DELETE' });
      await loadAll();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell active="plans" title="الباقات والعمولة">
      <style>{PLANS_CSS}</style>

      {loading ? (
        <div className="ad-loading">جاري التحميل...</div>
      ) : (
        <>
          {error && (
            <div className="ad-error" style={{ marginBottom: 16 }}>
              {error}
            </div>
          )}
          {msg && <div className="pl-msg">{msg}</div>}

          {/* إعدادات المنصة */}
          <div className="ad-panel" style={{ marginBottom: 22 }}>
            <div className="ad-panel-title">إعدادات المنصة</div>
            <div className="pl-set">
              <div className="pl-field">
                <label>العمولة الافتراضية لغير المشتركين (%)</label>
                <input
                  type="number"
                  min="0"
                  value={sForm.defaultCommissionRate}
                  onChange={(e) => setSForm({ ...sForm, defaultCommissionRate: e.target.value })}
                />
                <span className="pl-hint">
                  دي العمولة اللي بتتاخد لو مقدّم الخدمة مش مشترك في أي باقة.
                </span>
              </div>
              <div className="pl-field">
                <label>اسم المنصة</label>
                <input
                  value={sForm.platformName}
                  onChange={(e) => setSForm({ ...sForm, platformName: e.target.value })}
                />
              </div>
              <div className="pl-field">
                <label>إيميل الدعم</label>
                <input
                  value={sForm.supportEmail}
                  onChange={(e) => setSForm({ ...sForm, supportEmail: e.target.value })}
                />
              </div>
              <div className="pl-field">
                <label>نظام الضمان (Escrow)</label>
                <label className="pl-check" style={{ marginTop: 6 }}>
                  <input
                    type="checkbox"
                    checked={sForm.escrowEnabled}
                    onChange={(e) => setSForm({ ...sForm, escrowEnabled: e.target.checked })}
                  />
                  مُفعّل — حجز فلوس المراحل لحد الموافقة
                </label>
              </div>
            </div>
            <button className="ad-btn" onClick={saveSettings} disabled={busy}>
              {busy ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </button>
          </div>

          {/* شريط الأدوات */}
          <div className="ad-toolbar">
            <div className="ad-panel-title" style={{ margin: 0 }}>
              باقات الاشتراك
            </div>
            {editingId === null && (
              <button className="ad-btn" onClick={openNew}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="plus" size={16} /> إضافة باقة
                </span>
              </button>
            )}
          </div>

          {/* نموذج الإضافة / التعديل */}
          {editingId !== null && (
            <div className="ad-panel" style={{ marginBottom: 18 }}>
              <div className="ad-panel-title">
                {editingId === 'new' ? 'باقة جديدة' : 'تعديل الباقة'}
              </div>
              <div className="pl-form">
                <div className="pl-field">
                  <label>اسم الباقة</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="pl-field">
                  <label>السعر (ج.م)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
                <div className="pl-field">
                  <label>دورة الاشتراك</label>
                  <select
                    value={form.billingCycle}
                    onChange={(e) =>
                      setForm({ ...form, billingCycle: e.target.value as 'MONTHLY' | 'YEARLY' })
                    }
                  >
                    <option value="MONTHLY">شهري</option>
                    <option value="YEARLY">سنوي</option>
                  </select>
                </div>
                <div className="pl-field">
                  <label>نسبة العمولة (%)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.commissionRate}
                    onChange={(e) => setForm({ ...form, commissionRate: e.target.value })}
                  />
                </div>
                <div className="pl-field">
                  <label>أقصى عدد عروض (اختياري)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.maxOffers}
                    onChange={(e) => setForm({ ...form, maxOffers: e.target.value })}
                  />
                  <span className="pl-hint">سيبها فاضية = غير محدود.</span>
                </div>
                <div className="pl-field">
                  <label>ترتيب العرض</label>
                  <input
                    type="number"
                    min="0"
                    value={form.orderIndex}
                    onChange={(e) => setForm({ ...form, orderIndex: e.target.value })}
                  />
                </div>
                <div className="pl-field pl-full">
                  <label>الوصف</label>
                  <input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div className="pl-field pl-full">
                  <label>المميزات (كل ميزة في سطر)</label>
                  <textarea
                    value={form.features}
                    onChange={(e) => setForm({ ...form, features: e.target.value })}
                  />
                </div>
                <label className="pl-check">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                  />
                  باقة مميّزة (تظهر بشكل بارز)
                </label>
                <label className="pl-check">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  مُفعّلة (تظهر لمقدّمي الخدمة)
                </label>
              </div>
              <div className="pl-form-actions">
                <button className="ad-btn" onClick={savePlan} disabled={busy}>
                  {busy ? 'جاري الحفظ...' : editingId === 'new' ? 'إضافة الباقة' : 'حفظ التعديلات'}
                </button>
                <button className="ad-btn-mini" onClick={() => setEditingId(null)} disabled={busy}>
                  إلغاء
                </button>
              </div>
            </div>
          )}

          {/* جدول الباقات */}
          {plans.length === 0 ? (
            <div className="ad-empty">مفيش باقات لسه. اضغط "إضافة باقة" لإنشاء أول باقة.</div>
          ) : (
            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>الباقة</th>
                    <th>السعر</th>
                    <th>الدورة</th>
                    <th>العمولة</th>
                    <th>الحالة</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <b>{p.name}</b>
                        {p.isFeatured && (
                          <span className="ad-badge amber" style={{ marginInlineStart: 8 }}>
                            مميّزة
                          </span>
                        )}
                      </td>
                      <td>{Number(p.price).toLocaleString('en-US')} ج.م</td>
                      <td>{p.billingCycle === 'YEARLY' ? 'سنوي' : 'شهري'}</td>
                      <td>{Number(p.commissionRate)}%</td>
                      <td>
                        {p.isActive ? (
                          <span className="ad-badge ok">مُفعّلة</span>
                        ) : (
                          <span className="ad-badge muted">متوقفة</span>
                        )}
                      </td>
                      <td>
                        <div className="ad-row-actions">
                          <button className="ad-btn-mini" onClick={() => openEdit(p)} disabled={busy}>
                            تعديل
                          </button>
                          <button
                            className="ad-btn-mini danger"
                            onClick={() => deletePlan(p)}
                            disabled={busy}
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </AdminShell>
  );
}

const PLANS_CSS = `
.pl-msg{background:#e3f4ec;color:#1c7a4f;border:1px solid #bfe6d2;border-radius:10px;padding:10px 14px;font-size:14px;margin-bottom:16px;}
.pl-set{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:16px;}
.pl-form{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-bottom:16px;}
.pl-form .pl-full{grid-column:1 / -1;}
.pl-field{display:flex;flex-direction:column;gap:6px;}
.pl-field label{font-size:13px;font-weight:700;color:var(--ink);}
.pl-field input,.pl-field select,.pl-field textarea{border:1px solid var(--line);border-radius:10px;padding:9px 12px;font-family:inherit;font-size:14px;background:#fff;color:var(--text);}
.pl-field textarea{min-height:90px;resize:vertical;line-height:1.7;}
.pl-hint{font-size:12.5px;color:var(--muted);}
.pl-check{display:flex;align-items:center;gap:8px;font-size:14px;color:var(--text);font-weight:600;}
.pl-check input{width:18px;height:18px;accent-color:var(--green);}
.pl-form-actions{display:flex;gap:10px;}
@media(max-width:700px){.pl-set,.pl-form{grid-template-columns:1fr;}}
`;
