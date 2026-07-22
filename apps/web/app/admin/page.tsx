'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { api } from '@/lib/api';
import Icon from '@/components/Icon';
import { useI18n } from '@/lib/i18n';

type Stats = {
  users: {
    total: number;
    clients: number;
    providers: number;
    supervisors: number;
    admins: number;
    verified: number;
    suspended: number;
  };
  projects: {
    total: number;
    open: number;
    inProgress: number;
    completed: number;
    disputed: number;
  };
  offers: { total: number; confirmedAgreements: number };
  complaints: { total: number; open: number; resolved: number };
  supervision: { activeAssignments: number };
};

function BarRow({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <li>
      <div className="ad-bar-head">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="ad-bar-track">
        <span className="ad-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </li>
  );
}

export default function AdminOverviewPage() {
  const { tr } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Stats>('/admin/stats')
      .then(setStats)
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const cards = stats
    ? [
        { icon: 'users', label: tr('adm.card.totalUsers', 'إجمالي المستخدمين'), value: stats.users.total, tone: 'green' },
        { icon: 'badgeCheck', label: tr('adm.card.verified', 'حسابات موثّقة'), value: stats.users.verified, tone: 'blue' },
        { icon: 'folder', label: tr('adm.card.totalProjects', 'إجمالي المشاريع'), value: stats.projects.total, tone: 'green' },
        { icon: 'clock', label: tr('adm.card.inProgress', 'مشاريع جارية'), value: stats.projects.inProgress, tone: 'amber' },
        { icon: 'fileText', label: tr('adm.card.totalOffers', 'إجمالي العروض'), value: stats.offers.total, tone: 'blue' },
        { icon: 'fileCheck', label: tr('adm.card.confirmedAgreements', 'اتفاقيات مؤكدة'), value: stats.offers.confirmedAgreements, tone: 'green' },
        { icon: 'scale', label: tr('adm.card.openComplaints', 'شكاوى مفتوحة'), value: stats.complaints.open, tone: 'red' },
        { icon: 'shield', label: tr('adm.card.activeSupervision', 'إشراف نشط'), value: stats.supervision.activeAssignments, tone: 'green' },
      ]
    : [];

  return (
    <AdminShell active="overview" title={tr('co.title', 'نظرة عامة')}>
      {loading && <div className="ad-loading">{tr('adm.loadingStats', 'جاري تحميل الإحصائيات...')}</div>}
      {error && <div className="ad-error">{error}</div>}

      {stats && (
        <>
          <div className="ad-stats">
            {cards.map((c) => (
              <div key={c.label} className={`ad-stat tone-${c.tone}`}>
                <div className="ad-stat-icon">
                  <Icon name={c.icon} size={22} />
                </div>
                <div>
                  <div className="ad-stat-value">{c.value}</div>
                  <div className="ad-stat-label">{c.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="ad-grid2">
            <div className="ad-panel">
              <div className="ad-panel-title">{tr('adm.dist.users', 'توزيع المستخدمين')}</div>
              <ul className="ad-bars">
                <BarRow label={tr('adm.bar.clients', 'عملاء')} value={stats.users.clients} total={stats.users.total} />
                <BarRow label={tr('adm.bar.providers', 'مقدمو خدمة')} value={stats.users.providers} total={stats.users.total} />
                <BarRow label={tr('adm.bar.supervisors', 'مشرفون')} value={stats.users.supervisors} total={stats.users.total} />
                <BarRow label={tr('adm.bar.admins', 'أدمن')} value={stats.users.admins} total={stats.users.total} />
              </ul>
            </div>

            <div className="ad-panel">
              <div className="ad-panel-title">{tr('adm.dist.projects', 'حالة المشاريع')}</div>
              <ul className="ad-bars">
                <BarRow label={tr('adm.bar.open', 'مفتوحة')} value={stats.projects.open} total={stats.projects.total} />
                <BarRow label={tr('adm.bar.running', 'جارية')} value={stats.projects.inProgress} total={stats.projects.total} />
                <BarRow label={tr('adm.bar.completed', 'مكتملة')} value={stats.projects.completed} total={stats.projects.total} />
                <BarRow label={tr('adm.bar.disputed', 'متنازع عليها')} value={stats.projects.disputed} total={stats.projects.total} />
              </ul>
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}
