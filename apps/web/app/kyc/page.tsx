'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';
import BackBar from '@/components/BackBar';

type Kyc = {
  id: string;
  idType: string;
  idNumber: string;
  fullNameOnId: string;
  status: string;
  reviewNote?: string | null;
  createdAt: string;
};

const ID_TYPES = [
  { value: 'NATIONAL_ID', label: 'بطاقة رقم قومي' },
  { value: 'PASSPORT', label: 'جواز سفر' },
  { value: 'COMMERCIAL_REGISTER', label: 'سجل تجاري (شركة)' },
];

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'قيد المراجعة',
  APPROVED: 'موثّق',
  REJECTED: 'مرفوض',
};

const MAX_MB = 10;

const KYC_CSS = `
.ky-wrap{max-width:640px;margin:0 auto;padding:28px 20px 60px;}
.ky-title{font-size:24px;font-weight:900;color:var(--ink);}
.ky-sub{color:var(--muted);font-size:14px;margin:8px 0 20px;line-height:1.7;}
.ky-muted{color:var(--muted);}
.ky-status{border-radius:16px;padding:16px 18px;margin-bottom:20px;border:1px solid var(--line);}
.ky-status-label{font-weight:800;font-size:15px;}
.ky-status-note{font-size:13.5px;margin-top:6px;line-height:1.7;}
.ky-pending{background:#fdf3dd;border-color:#f0e0b8;color:#8a6410;}
.ky-approved{background:#e3f4ec;border-color:#bfe6d2;color:#1c7a4f;}
.ky-rejected{background:#fdeceb;border-color:#f5cfcc;color:#b4322b;}
.ky-card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:22px;display:flex;flex-direction:column;gap:16px;}
.ky-field{display:flex;flex-direction:column;gap:6px;}
.ky-field span{font-size:13.5px;font-weight:700;color:var(--ink);}
.ky-field input,.ky-field select{border:1px solid var(--line);border-radius:11px;padding:11px 13px;font-size:14px;font-family:inherit;outline:none;background:#fff;}
.ky-field input:focus,.ky-field select:focus{border-color:var(--green);}
.ky-uploads{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
.ky-upload{display:flex;flex-direction:column;gap:7px;}
.ky-upload-label{font-size:12.5px;font-weight:700;color:var(--ink);}
.ky-drop{border:1.5px dashed var(--line);border-radius:12px;padding:22px 8px;text-align:center;color:var(--muted);font-size:13px;font-weight:700;cursor:pointer;display:block;}
.ky-drop:hover{border-color:var(--green);color:var(--green-dark);}
.ky-preview{position:relative;border-radius:12px;overflow:hidden;border:1px solid var(--line);}
.ky-preview img{width:100%;height:110px;object-fit:cover;display:block;}
.ky-clear{position:absolute;top:6px;inset-inline-end:6px;background:rgba(0,0,0,.6);color:#fff;border:none;border-radius:8px;padding:4px 10px;font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit;}
.ky-err{color:#c0392b;font-size:13.5px;font-weight:700;}
.ky-submit{background:var(--green);color:#fff;border:none;border-radius:12px;padding:13px;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;}
.ky-submit:disabled{opacity:.5;cursor:default;}
@media(max-width:560px){.ky-uploads{grid-template-columns:1fr;}}
`;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('فشل قراءة الملف'));
    reader.readAsDataURL(file);
  });
}

function UploadBox({
  label,
  value,
  onPick,
  onClear,
}: {
  label: string;
  value: string;
  onPick: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) {
  return (
    <div className="ky-upload">
      <span className="ky-upload-label">{label}</span>
      {value ? (
        <div className="ky-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt={label} />
          <button type="button" className="ky-clear" onClick={onClear}>
            حذف
          </button>
        </div>
      ) : (
        <label className="ky-drop">
          <span>＋ اختر صورة</span>
          <input type="file" accept="image/*" onChange={onPick} hidden />
        </label>
      )}
    </div>
  );
}

export default function KycPage() {
  const router = useRouter();
  const [existing, setExisting] = useState<Kyc | null>(null);
  const [loading, setLoading] = useState(true);
  const [idType, setIdType] = useState('NATIONAL_ID');
  const [idNumber, setIdNumber] = useState('');
  const [fullNameOnId, setFullNameOnId] = useState('');
  const [frontImage, setFrontImage] = useState('');
  const [backImage, setBackImage] = useState('');
  const [selfie, setSelfie] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  function load() {
    api<Kyc | null>('/kyc/mine')
      .then((d) => setExisting(d))
      .catch(() => setExisting(null))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function pickFile(
    e: React.ChangeEvent<HTMLInputElement>,
    set: (v: string) => void,
  ) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setErr('');
    if (file.size > MAX_MB * 1024 * 1024) {
      setErr(`حجم الصورة أكبر من ${MAX_MB} ميجا`);
      return;
    }
    try {
      const dataUrl = await readAsDataUrl(file);
      set(dataUrl);
    } catch {
      setErr('فشل قراءة الصورة');
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!idNumber.trim() || !fullNameOnId.trim() || !frontImage) {
      setErr('لازم تملأ رقم الهوية والاسم وترفع صورة وجه المستند');
      return;
    }
    setSubmitting(true);
    try {
      await api('/kyc', {
        method: 'POST',
        body: {
          idType,
          idNumber: idNumber.trim(),
          fullNameOnId: fullNameOnId.trim(),
          frontImage,
          backImage: backImage || undefined,
          selfie: selfie || undefined,
        },
      });
      load();
    } catch (e: any) {
      setErr(e?.message || 'فشل إرسال الطلب');
    } finally {
      setSubmitting(false);
    }
  }

  const showForm = !existing || existing.status === 'REJECTED';

  return (
    <main className="min-h-screen">
      <TopBar />
      <BackBar />
      <style>{KYC_CSS}</style>
      <div className="ky-wrap">
        <h1 className="ky-title">توثيق الهوية</h1>
        <p className="ky-sub">
          وثّق هويتك عشان تحصل على شارة «موثّق من محايد» وتزوّد ثقة العملاء فيك.
        </p>

        {loading ? (
          <p className="ky-muted">جاري التحميل…</p>
        ) : (
          <>
            {existing && (
              <div className={`ky-status ky-${existing.status.toLowerCase()}`}>
                <span className="ky-status-label">
                  حالة طلبك: {STATUS_LABELS[existing.status] || existing.status}
                </span>
                {existing.status === 'PENDING' && (
                  <p className="ky-status-note">
                    طلبك تحت المراجعة من فريق محايد، هنبلّغك أول ما يتم البت فيه.
                  </p>
                )}
                {existing.status === 'APPROVED' && (
                  <p className="ky-status-note">مبروك! حسابك موثّق ✅</p>
                )}
                {existing.status === 'REJECTED' && (
                  <p className="ky-status-note">
                    للأسف الطلب اترفض
                    {existing.reviewNote ? `: ${existing.reviewNote}` : ''}. تقدر
                    تعدّل بياناتك وتبعت تاني.
                  </p>
                )}
              </div>
            )}

            {showForm && (
              <form className="ky-card" onSubmit={submit}>
                <label className="ky-field">
                  <span>نوع الهوية</span>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                  >
                    {ID_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="ky-field">
                  <span>الاسم كما في المستند</span>
                  <input
                    value={fullNameOnId}
                    onChange={(e) => setFullNameOnId(e.target.value)}
                    placeholder="الاسم بالكامل"
                  />
                </label>

                <label className="ky-field">
                  <span>رقم الهوية / السجل</span>
                  <input
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder="مثال: الرقم القومي"
                  />
                </label>

                <div className="ky-uploads">
                  <UploadBox
                    label="صورة وجه المستند *"
                    value={frontImage}
                    onPick={(e) => pickFile(e, setFrontImage)}
                    onClear={() => setFrontImage('')}
                  />
                  <UploadBox
                    label="صورة ظهر المستند (اختياري)"
                    value={backImage}
                    onPick={(e) => pickFile(e, setBackImage)}
                    onClear={() => setBackImage('')}
                  />
                  <UploadBox
                    label="صورة شخصية بالمستند (اختياري)"
                    value={selfie}
                    onPick={(e) => pickFile(e, setSelfie)}
                    onClear={() => setSelfie('')}
                  />
                </div>

                {err && <p className="ky-err">{err}</p>}

                <button
                  className="ky-submit"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? 'جاري الإرسال…' : 'إرسال طلب التوثيق'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </main>
  );
}
