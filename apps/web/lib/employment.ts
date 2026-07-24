// مصدر واحد موحّد لكل ثوابت ودوال التوظيف الخليجي

export const EMP_TYPE: Record<string, string> = { FULL_TIME: 'دوام كامل', PART_TIME: 'دوام جزئي', CONTRACT: 'عقد مؤقت' };
export const WORK_MODE: Record<string, string> = { ONSITE: 'من مكتب محايد', REMOTE: 'عن بُعد', HYBRID: 'مختلط' };

export const JOB_STATUS: Record<string, { label: string; tone: string }> = {
  OPEN: { label: 'مفتوحة', tone: 'ok' },
  PAUSED: { label: 'موقوفة', tone: 'amber' },
  CLOSED: { label: 'مغلقة', tone: 'muted' },
  FILLED: { label: 'مكتملة', tone: 'blue' },
};

export const APP_STATUS: Record<string, { label: string; tone: string }> = {
  SUBMITTED: { label: 'تم التقديم', tone: 'amber' },
  SHORTLISTED: { label: 'قائمة مختصرة', tone: 'blue' },
  INTERVIEW: { label: 'مقابلة', tone: 'blue' },
  OFFERED: { label: 'عرض عمل', tone: 'ok' },
  HIRED: { label: 'تم التعيين', tone: 'ok' },
  REJECTED: { label: 'مرفوض', tone: 'red' },
  WITHDRAWN: { label: 'مسحوب', tone: 'muted' },
};

export const EMPLOYMENT_STATUS: Record<string, { label: string; tone: string }> = {
  ACTIVE: { label: 'نشط', tone: 'ok' },
  PAUSED: { label: 'موقوف', tone: 'amber' },
  ENDED: { label: 'منتهي', tone: 'muted' },
};

export const LOG_STATUS: Record<string, { label: string; tone: string }> = {
  SUBMITTED: { label: 'بانتظار المراجعة', tone: 'amber' },
  APPROVED: { label: 'معتمد', tone: 'ok' },
  REJECTED: { label: 'مرفوض', tone: 'red' },
};

export const TYPES = [
  { value: 'FULL_TIME', label: 'دوام كامل' },
  { value: 'PART_TIME', label: 'دوام جزئي' },
  { value: 'CONTRACT', label: 'عقد مؤقت' },
];

export const MODES = [
  { value: 'REMOTE', label: 'عن بُعد' },
  { value: 'ONSITE', label: 'من مكتب محايد' },
  { value: 'HYBRID', label: 'مختلط' },
];

export const money = (v: any, c?: string | null) => `${Number(v || 0).toLocaleString('en')} ${c || 'USD'}`;
export const fdate = (s: string) => { try { return new Date(s).toLocaleDateString('en-GB'); } catch { return ''; } };

// ===== i18n helpers (إضافة) — تترجم المصطلحات بمفاتيح emp.* =====
export type TrFn = (key: string, fallback?: string) => string;

export const EMP_TYPE_KEY: Record<string, string> = { FULL_TIME: 'emp.type.FULL_TIME', PART_TIME: 'emp.type.PART_TIME', CONTRACT: 'emp.type.CONTRACT' };
export const WORK_MODE_KEY: Record<string, string> = { ONSITE: 'emp.mode.ONSITE', REMOTE: 'emp.mode.REMOTE', HYBRID: 'emp.mode.HYBRID' };
export const JOB_STATUS_KEY: Record<string, string> = { OPEN: 'emp.jobStatus.OPEN', PAUSED: 'emp.jobStatus.PAUSED', CLOSED: 'emp.jobStatus.CLOSED', FILLED: 'emp.jobStatus.FILLED' };
export const APP_STATUS_KEY: Record<string, string> = { SUBMITTED: 'emp.appStatus.SUBMITTED', SHORTLISTED: 'emp.appStatus.SHORTLISTED', INTERVIEW: 'emp.appStatus.INTERVIEW', OFFERED: 'emp.appStatus.OFFERED', HIRED: 'emp.appStatus.HIRED', REJECTED: 'emp.appStatus.REJECTED', WITHDRAWN: 'emp.appStatus.WITHDRAWN' };
export const EMPLOYMENT_STATUS_KEY: Record<string, string> = { ACTIVE: 'emp.emplStatus.ACTIVE', PAUSED: 'emp.emplStatus.PAUSED', ENDED: 'emp.emplStatus.ENDED' };
export const LOG_STATUS_KEY: Record<string, string> = { SUBMITTED: 'emp.logStatus.SUBMITTED', APPROVED: 'emp.logStatus.APPROVED', REJECTED: 'emp.logStatus.REJECTED' };

export const empTypeLabel = (tr: TrFn, v: string) => (EMP_TYPE_KEY[v] ? tr(EMP_TYPE_KEY[v], EMP_TYPE[v]) : (EMP_TYPE[v] || v));
export const workModeLabel = (tr: TrFn, v: string) => (WORK_MODE_KEY[v] ? tr(WORK_MODE_KEY[v], WORK_MODE[v]) : (WORK_MODE[v] || v));
export const jobStatusLabel = (tr: TrFn, s: string) => (JOB_STATUS_KEY[s] ? tr(JOB_STATUS_KEY[s], JOB_STATUS[s]?.label) : (JOB_STATUS[s]?.label || s));
export const jobStatusTone = (s: string) => (JOB_STATUS[s]?.tone || 'muted');
export const appStatusLabel = (tr: TrFn, s: string) => (APP_STATUS_KEY[s] ? tr(APP_STATUS_KEY[s], APP_STATUS[s]?.label) : (APP_STATUS[s]?.label || s));
export const appStatusTone = (s: string) => (APP_STATUS[s]?.tone || 'muted');
export const emplStatusLabel = (tr: TrFn, s: string) => (EMPLOYMENT_STATUS_KEY[s] ? tr(EMPLOYMENT_STATUS_KEY[s], EMPLOYMENT_STATUS[s]?.label) : (EMPLOYMENT_STATUS[s]?.label || s));
export const emplStatusTone = (s: string) => (EMPLOYMENT_STATUS[s]?.tone || 'muted');
export const logStatusLabel = (tr: TrFn, s: string) => (LOG_STATUS_KEY[s] ? tr(LOG_STATUS_KEY[s], LOG_STATUS[s]?.label) : (LOG_STATUS[s]?.label || s));
export const logStatusTone = (s: string) => (LOG_STATUS[s]?.tone || 'muted');
