'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

type Opt = {
  id: string;
  groupKey: string;
  value: string;
  label: string;
  isActive: boolean;
  orderIndex: number;
};

const GROUPS = [
  { key: 'COMPLAINT_TYPE', labelKey: 'aop.group.COMPLAINT_TYPE' },
  { key: 'DECISION_TYPE', labelKey: 'aop.group.DECISION_TYPE' },
  { key: 'PROJECT_FIELD', labelKey: 'aop.group.PROJECT_FIELD' },
];

const OPT_CSS = `
.op-hint{background:var(--mint);border:1px solid var(--green-light);color:var(--green-dark);border-radius:12px;padding:12px 15px;font-size:13.5px;line-height:1.8;margin-bottom:18px;}
.op-add{display:flex;gap:10px;margin-bottom:18px;flex-wrap:wrap;}
.op-add input{flex:1;min-width:220px;border:1px solid var(--line);border-radius:10px;padding:10px 13px;font-family:inherit;font-size:14px;background:#fff;}
.op-empty{padding:30px;text-align:center;color:var(--muted);background:#fff;border:1px solid var(--line);border-radius:14px;}
`;

export default function AdminOptionsPage() {
  const { tr } = useI18n();
  const [group, setGroup] = useState(GROUPS[0].key);
  const [items, setItems] = useState<Opt[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  function load(g: string) {
    setLoading(true);
    api<Opt[]>(`/options/admin/list/${g}`)
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(group);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group]);

  async function add() {
    if (!newLabel.trim()) return;
    setBusy('add');
    setError('');
    try {
      await api('/options', {
        method: 'POST',
        body: { groupKey: group, label: newLabel.trim() },
      });
      setNewLabel('');
      load(group);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  }

  async function toggle(o: Opt) {
    setBusy(o.id);
    setError('');
    try {
      await api(`/options/${o.id}`, {
        method: 'PATCH',
        body: { isActive: !o.isActive },
      });
      setItems((prev) =>
        prev.map((x) => (x.id === o.id ? { ...x, isActive: !o.isActive } : x)),
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  }

  async function rename(o: Opt) {
    const next = window.prompt(tr('aop.renamePrompt', 'اكتب الاسم الجديد للخيار:'), o.label);
    if (next == null || !next.trim() || next.trim() === o.label) return;
    setBusy(o.id);
    setError('');
    try {
      await api(`/options/${o.id}`, { method: 'PATCH', body: { label: next.trim() } });
      setItems((prev) =>
        prev.map((x) => (x.id === o.id ? { ...x, label: next.trim() } : x)),
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  }

  async function remove(o: Opt) {
    if (!window.confirm(`${tr('aop.confirmDelete.pre', 'متأكد إنك عايز تحذف «')}${o.label}${tr('aop.confirmDelete.post', '»؟')}`)) return;
    setBusy(o.id);
    setError('');
    try {
      await api(`/options/${o.id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((x) => x.id !== o.id));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  }

  return (
    <AdminShell active="options" title={tr('ash.nav.options', 'قوائم الخيارات')}>
      <style>{OPT_CSS}</style>

      <div className="op-hint">
        {tr('aop.hint', 'من هنا بتتحكم في الخيارات اللي بتظهر في نماذج المنصة (زي أنواع النزاع). أي خيار تضيفه هنا هيظهر تلقائيًا في الفورم. الخيار الموقوف مش بيظهر للمستخدمين بس بيفضل محفوظ.')}
      </div>

      <div className="ad-toolbar">
        <div className="ad-tabs">
          {GROUPS.map((g) => (
            <button
              key={g.key}
              className={group === g.key ? 'active' : ''}
              onClick={() => setGroup(g.key)}
            >
              {tr(g.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="op-add">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder={tr('aop.addPh', 'اكتب اسم خيار جديد وأضِفه…')}
          onKeyDown={(e) => {
            if (e.key === 'Enter') add();
          }}
        />
        <button
          className="ad-btn"
          onClick={add}
          disabled={busy === 'add' || !newLabel.trim()}
        >
          {busy === 'add' ? tr('aop.adding', 'جاري الإضافة…') : tr('aop.addBtn', 'إضافة خيار')}
        </button>
      </div>

      {error && <div className="ad-error">{error}</div>}

      {loading ? (
        <div className="ad-loading">{tr('cls.loading', 'جاري التحميل...')}</div>
      ) : items.length === 0 ? (
        <div className="op-empty">{tr('aop.empty', 'مفيش خيارات في المجموعة دي لسه. ضيف أول خيار من فوق.')}</div>
      ) : (
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>{tr('adu.th.name', 'الاسم')}</th>
                <th>{tr('acx.th.code', 'الكود')}</th>
                <th>{tr('co.th.status', 'الحالة')}</th>
                <th>{tr('apl.th.actions', 'إجراءات')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr key={o.id}>
                  <td>{o.label}</td>
                  <td className="ad-mono">{o.value}</td>
                  <td>
                    <span className={`ad-badge ${o.isActive ? 'ok' : 'muted'}`}>
                      {o.isActive ? tr('aop.active', 'مفعّل') : tr('aop.stopped', 'موقوف')}
                    </span>
                  </td>
                  <td>
                    <div className="ad-row-actions">
                      <button
                        className="ad-btn-mini"
                        onClick={() => rename(o)}
                        disabled={busy === o.id}
                      >
                        {tr('apl.edit', 'تعديل')}
                      </button>
                      <button
                        className="ad-btn-mini"
                        onClick={() => toggle(o)}
                        disabled={busy === o.id}
                      >
                        {o.isActive ? tr('aop.disable', 'إيقاف') : tr('aop.enable', 'تفعيل')}
                      </button>
                      <button
                        className="ad-btn-mini danger"
                        onClick={() => remove(o)}
                        disabled={busy === o.id}
                      >
                        {tr('apl.delete', 'حذف')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
