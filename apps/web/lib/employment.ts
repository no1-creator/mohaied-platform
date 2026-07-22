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
