'use client';

import { useEffect, useRef, useState } from 'react';
import ProviderShell from '@/components/ProviderShell';
import Icon from '@/components/Icon';
import { api } from '@/lib/api';

type ProviderProfile = {
  type?: 'FREELANCER' | 'COMPANY';
  companyName?: string | null;
  field?: string | null;
  bio?: string | null;
  yearsExp?: number | null;
  teamSize?: number | null;
  city?: string | null;
  phone?: string | null;
  website?: string | null;
  portfolioUrl?: string | null;
  skills?: string | null;
  commercialRegNo?: string | null;
  taxId?: string | null;
  nationalId?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  portfolioImages?: string | null;
  linkedinUrl?: string | null;
  whatsapp?: string | null;
};
type Me = { fullName?: string; providerProfile?: ProviderProfile | null };

const MAX_GALLERY = 6;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('فشل قراءة الملف'));
    r.readAsDataURL(file);
  });
}

function parseGallery(s?: string | null): string[] {
  if (!s) return [];
  try {
    const a = JSON.parse(s);
    return Array.isArray(a) ? a.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export default function ProviderProfileEditPage() {
  const logoRef = useRef<HTMLInputElement | null>(null);
  const coverRef = useRef<HTMLInputElement | null>(null);
  const galleryRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const [type, setType] = useState<'FREELANCER' | 'COMPANY'>('FREELANCER');
  const [companyName, setCompanyName] = useState('');
  const [field, setField] = useState('');
  const [bio, setBio] = useState('');
  const [yearsExp, setYearsExp] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [skills, setSkills] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [website, setWebsite] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [commercialRegNo, setCommercialRegNo] = useState('');
  const [taxId, setTaxId] = useState('');
  const [nationalId, setNationalId] = useState('');

  const [logoUrl, setLogoUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [gallery, setGallery] = useState<string[]>([]);

  function populate(pp?: ProviderProfile | null) {
    if (!pp) return;
    setType(pp.type === 'COMPANY' ? 'COMPANY' : 'FREELANCER');
    setCompanyName(pp.companyName || '');
    setField(pp.field || '');
    setBio(pp.bio || '');
    setYearsExp(pp.yearsExp != null ? String(pp.yearsExp) : '');
    setTeamSize(pp.teamSize != null ? String(pp.teamSize) : '');
    setSkills(pp.skills || '');
    setCity(pp.city || '');
    setPhone(pp.phone || '');
    setWhatsapp(pp.whatsapp || '');
    setWebsite(pp.website || '');
    setPortfolioUrl(pp.portfolioUrl || '');
    setLinkedinUrl(pp.linkedinUrl || '');
    setCommercialRegNo(pp.commercialRegNo || '');
    setTaxId(pp.taxId || '');
    setNationalId(pp.nationalId || '');
    setLogoUrl(pp.logoUrl || '');
    setCoverUrl(pp.coverUrl || '');
    setGallery(parseGallery(pp.portfolioImages));
  }

  useEffect(() => {
    api<Me>('/users/me')
      .then((d) => populate(d.providerProfile))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function pickLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (e.target) e.target.value = '';
    if (!f) return;
    if (!f.type.startsWith('image/')) return setError('الملف لازم يكون صورة');
    if (f.size > 2 * 1024 * 1024) return setError('الشعار لازم يكون أقل من 2 ميجا');
    setError('');
    setLogoUrl(await fileToDataUrl(f));
  }

  async function pickCover(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (e.target) e.target.value = '';
    if (!f) return;
    if (!f.type.startsWith('image/')) return setError('الملف لازم يكون صورة');
    if (f.size > 3 * 1024 * 1024) return setError('صورة الغلاف لازم تكون أقل من 3 ميجا');
    setError('');
    setCoverUrl(await fileToDataUrl(f));
  }

  async function pickGallery(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (e.target) e.target.value = '';
    if (!files.length) return;
    const room = MAX_GALLERY - gallery.length;
    if (room <= 0) return setError(`الحد الأقصى ${MAX_GALLERY} صور في المعرض`);
    const next: string[] = [];
    for (const f of files.slice(0, room)) {
      if (!f.type.startsWith('image/')) continue;
      if (f.size > 1024 * 1024) {
        setError('كل صورة في المعرض لازم تكون أقل من 1 ميجا');
        continue;
      }
      next.push(await fileToDataUrl(f));
    }
    if (next.length) {
      setError('');
      setGallery((g) => [...g, ...next]);
    }
  }

  function removeGalleryImage(i: number) {
    setGallery((g) => g.filter((_, idx) => idx !== i));
  }

  async function save() {
    if (!field.trim()) {
      setError('المجال / التخصص مطلوب');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSaving(true);
    setError('');
    setMsg('');
    try {
      const body: Record<string, unknown> = {
        type,
        field: field.trim(),
        companyName: companyName.trim(),
        bio: bio.trim(),
        skills: skills.trim(),
        city: city.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim(),
        website: website.trim(),
        portfolioUrl: portfolioUrl.trim(),
        linkedinUrl: linkedinUrl.trim(),
        commercialRegNo: commercialRegNo.trim(),
        taxId: taxId.trim(),
        nationalId: nationalId.trim(),
        logoUrl,
        coverUrl,
        portfolioImages: JSON.stringify(gallery),
      };
      if (yearsExp.trim()) body.yearsExp = parseInt(yearsExp, 10);
      if (teamSize.trim()) body.teamSize = parseInt(teamSize, 10);

      const updated = await api<Me>('/users/provider-profile', {
        method: 'PATCH',
        body,
      });
      populate(updated.providerProfile);
      setMsg('تم حفظ ملفك بنجاح ✅');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setMsg(''), 3500);
    } catch (e: any) {
      setError(e?.message || 'حصل خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProviderShell active="profile" title="ملفي الاحترافي">
      <style>{PF_CSS}</style>
      <div className="pf-wrap">
        {loading ? (
          <div className="pf-loading">جاري التحميل...</div>
        ) : (
          <>
            {msg && <div className="pf-msg">{msg}</div>}
            {error && <div className="pf-err">{error}</div>}

            {/* ===== الهوية البصرية ===== */}
            <div className="pf-card">
              <div className="pf-cover">
                {coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverUrl} alt="" className="pf-cover-img" />
                ) : (
                  <div className="pf-cover-empty">
                    <Icon name="palette" size={22} /> أضف صورة غلاف تعبّر عن شغلك
                  </div>
                )}
                <button
                  type="button"
                  className="pf-cover-btn"
                  onClick={() => coverRef.current?.click()}
                >
                  {coverUrl ? 'تغيير الغلاف' : 'رفع غلاف'}
                </button>
                <input
                  ref={coverRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={pickCover}
                />
                <div className="pf-logo-wrap">
                  <div className="pf-logo">
                    {logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoUrl} alt="" />
                    ) : (
                      <Icon name={type === 'COMPANY' ? 'building' : 'user'} size={26} />
                    )}
                  </div>
                  <button
                    type="button"
                    className="pf-logo-btn"
                    onClick={() => logoRef.current?.click()}
                  >
                    {logoUrl ? 'تغيير الشعار' : 'رفع شعار'}
                  </button>
                  {logoUrl && (
                    <button
                      type="button"
                      className="pf-logo-rm"
                      onClick={() => setLogoUrl('')}
                    >
                      إزالة
                    </button>
                  )}
                  <input
                    ref={logoRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={pickLogo}
                  />
                </div>
              </div>
              <p className="pf-hint pf-cover-hint">
                الغلاف حتى 3 ميجا، الشعار حتى 2 ميجا. الصور بتظهر في ملفك العام على المنصة.
              </p>
            </div>

            {/* ===== نوع الحساب ===== */}
            <div className="pf-card">
              <h3 className="pf-sec">نوع الحساب</h3>
              <div className="pf-types">
                <button
                  type="button"
                  className={`pf-type ${type === 'FREELANCER' ? 'active' : ''}`}
                  onClick={() => setType('FREELANCER')}
                >
                  <Icon name="user" size={22} />
                  <span>فريلانسر</span>
                </button>
                <button
                  type="button"
                  className={`pf-type ${type === 'COMPANY' ? 'active' : ''}`}
                  onClick={() => setType('COMPANY')}
                >
                  <Icon name="building" size={22} />
                  <span>شركة</span>
                </button>
              </div>
            </div>

            {/* ===== المعلومات المهنية ===== */}
            <div className="pf-card">
              <h3 className="pf-sec">المعلومات المهنية</h3>
              {type === 'COMPANY' && (
                <div className="pf-grid2">
                  <label className="pf-field">
                    <span>اسم الشركة</span>
                    <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="اسم الشركة أو الكيان" />
                  </label>
                  <label className="pf-field">
                    <span>حجم الفريق</span>
                    <input type="number" min={1} value={teamSize} onChange={(e) => setTeamSize(e.target.value)} placeholder="عدد الأعضاء" />
                  </label>
                </div>
              )}
              <div className="pf-grid2">
                <label className="pf-field">
                  <span>المجال / التخصص <b className="pf-req">*</b></span>
                  <input value={field} onChange={(e) => setField(e.target.value)} placeholder="مثال: تطوير الويب، تصميم UI/UX" />
                </label>
                <label className="pf-field">
                  <span>سنين الخبرة</span>
                  <input type="number" min={0} value={yearsExp} onChange={(e) => setYearsExp(e.target.value)} placeholder="0" />
                </label>
              </div>
              <label className="pf-field">
                <span>المهارات والخدمات</span>
                <input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, Node.js, تطبيقات موبايل" />
                <small className="pf-hint">افصل بين المهارات بفاصلة.</small>
              </label>
              <label className="pf-field">
                <span>نبذة تعريفية</span>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="اكتب نبذة احترافية عن خبرتك وأسلوب شغلك وأهم مشاريعك" />
              </label>
            </div>

            {/* ===== معرض الأعمال ===== */}
            <div className="pf-card">
              <h3 className="pf-sec">معرض الأعمال (Portfolio)</h3>
              <p className="pf-hint">ارفع صور لأهم أعمالك (حتى {MAX_GALLERY} صور، كل صورة أقل من 1 ميجا).</p>
              <div className="pf-gallery">
                {gallery.map((img, i) => (
                  <div className="pf-gitem" key={i}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" />
                    <button type="button" className="pf-grm" onClick={() => removeGalleryImage(i)}>×</button>
                  </div>
                ))}
                {gallery.length < MAX_GALLERY && (
                  <button type="button" className="pf-gadd" onClick={() => galleryRef.current?.click()}>
                    <Icon name="plus" size={22} />
                    <span>إضافة صورة</span>
                  </button>
                )}
              </div>
              <input
                ref={galleryRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={pickGallery}
              />
            </div>

            {/* ===== التواصل والروابط ===== */}
            <div className="pf-card">
              <h3 className="pf-sec">التواصل والروابط</h3>
              <div className="pf-grid2">
                <label className="pf-field">
                  <span>المحافظة / المدينة</span>
                  <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="مثال: القاهرة" />
                </label>
                <label className="pf-field">
                  <span>رقم الموبايل</span>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01xxxxxxxxx" />
                </label>
              </div>
              <div className="pf-grid2">
                <label className="pf-field">
                  <span>واتساب</span>
                  <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="01xxxxxxxxx" />
                </label>
                <label className="pf-field">
                  <span>لينكدإن</span>
                  <input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/..." />
                </label>
              </div>
              <div className="pf-grid2">
                <label className="pf-field">
                  <span>الموقع الإلكتروني</span>
                  <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
                </label>
                <label className="pf-field">
                  <span>رابط أعمال سابقة</span>
                  <input value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="https://..." />
                </label>
              </div>
            </div>

            {/* ===== بيانات التوثيق ===== */}
            <div className="pf-card">
              <h3 className="pf-sec">بيانات التوثيق</h3>
              {type === 'COMPANY' ? (
                <div className="pf-grid2">
                  <label className="pf-field">
                    <span>رقم السجل التجاري</span>
                    <input value={commercialRegNo} onChange={(e) => setCommercialRegNo(e.target.value)} placeholder="رقم السجل التجاري" />
                  </label>
                  <label className="pf-field">
                    <span>البطاقة الضريبية</span>
                    <input value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="رقم التسجيل الضريبي" />
                  </label>
                </div>
              ) : (
                <label className="pf-field">
                  <span>الرقم القومي</span>
                  <input value={nationalId} onChange={(e) => setNationalId(e.target.value)} placeholder="الرقم القومي (14 رقم)" />
                  <small className="pf-hint">بياناتك سرّية وبتُستخدم للتوثيق فقط.</small>
                </label>
              )}
            </div>

            <div className="pf-actions">
              <button className="pf-save" onClick={save} disabled={saving}>
                {saving ? 'جاري الحفظ...' : 'حفظ الملف'}
              </button>
            </div>
          </>
        )}
      </div>
    </ProviderShell>
  );
}

const PF_CSS = `
.pf-wrap{max-width:860px;margin:0 auto;display:flex;flex-direction:column;gap:16px;}
.pf-loading{padding:60px;text-align:center;color:var(--muted);}
.pf-msg{background:#e3f4ec;color:#1c7a4f;border:1px solid #bfe6d2;border-radius:10px;padding:11px 14px;font-size:14px;font-weight:700;}
.pf-err{background:#fdecec;color:#b42318;border:1px solid #f5c6c2;border-radius:10px;padding:11px 14px;font-size:14px;font-weight:700;}
.pf-card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:20px 22px;}
.pf-sec{font-size:16px;font-weight:900;color:var(--ink);margin:0 0 16px;}
.pf-cover{position:relative;border-radius:14px;overflow:visible;background:var(--mint);height:180px;border:1px dashed var(--green-light);}
.pf-cover-img{width:100%;height:180px;object-fit:cover;border-radius:14px;display:block;}
.pf-cover-empty{height:180px;display:flex;align-items:center;justify-content:center;gap:8px;color:var(--green-dark);font-weight:700;font-size:14px;}
.pf-cover-btn{position:absolute;top:12px;inset-inline-end:12px;background:rgba(255,255,255,.92);border:1px solid var(--line);color:var(--ink);font-weight:700;font-size:13px;padding:7px 14px;border-radius:9px;cursor:pointer;font-family:inherit;}
.pf-logo-wrap{position:absolute;bottom:-26px;inset-inline-start:22px;display:flex;align-items:flex-end;gap:10px;}
.pf-logo{width:84px;height:84px;border-radius:18px;background:linear-gradient(140deg,var(--green-light),var(--green-dark));color:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden;border:3px solid #fff;box-shadow:0 8px 20px rgba(0,0,0,.12);}
.pf-logo img{width:100%;height:100%;object-fit:cover;}
.pf-logo-btn{background:var(--mint);color:var(--green-dark);border:1px solid var(--green-light);font-weight:700;font-size:12.5px;padding:7px 12px;border-radius:9px;cursor:pointer;font-family:inherit;margin-bottom:4px;}
.pf-logo-rm{background:#fff;color:#b42318;border:1px solid #f5c6c2;font-weight:700;font-size:12.5px;padding:7px 12px;border-radius:9px;cursor:pointer;font-family:inherit;margin-bottom:4px;}
.pf-cover-hint{margin-top:36px;}
.pf-hint{font-size:12px;color:var(--muted);line-height:1.6;margin:6px 0 0;}
.pf-types{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.pf-type{display:flex;flex-direction:column;align-items:center;gap:8px;padding:18px;border:1.5px solid var(--line);border-radius:14px;background:#fff;cursor:pointer;font-family:inherit;font-weight:800;color:var(--ink);font-size:15px;transition:all .15s;}
.pf-type svg{color:var(--green);}
.pf-type:hover{border-color:var(--green-light);}
.pf-type.active{border-color:var(--green);background:var(--mint);color:var(--green-dark);}
.pf-grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.pf-field{display:flex;flex-direction:column;gap:6px;margin-bottom:14px;}
.pf-field > span{font-size:13px;font-weight:700;color:var(--ink);}
.pf-req{color:#dc2626;}
.pf-field input,.pf-field textarea{border:1px solid var(--line);border-radius:11px;padding:11px 13px;font-size:14.5px;font-family:inherit;background:var(--background);color:var(--ink);box-sizing:border-box;width:100%;}
.pf-field textarea{min-height:110px;resize:vertical;}
.pf-field input:focus,.pf-field textarea:focus{outline:none;border-color:var(--green-light);background:#fff;box-shadow:0 0 0 3px rgba(79,162,148,.15);}
.pf-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:12px;margin-top:6px;}
.pf-gitem{position:relative;aspect-ratio:1;border-radius:12px;overflow:hidden;border:1px solid var(--line);}
.pf-gitem img{width:100%;height:100%;object-fit:cover;}
.pf-grm{position:absolute;top:6px;inset-inline-end:6px;width:26px;height:26px;border-radius:50%;background:rgba(0,0,0,.6);color:#fff;border:none;font-size:18px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;}
.pf-gadd{aspect-ratio:1;border:1.5px dashed var(--green-light);border-radius:12px;background:var(--mint);color:var(--green-dark);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;cursor:pointer;font-family:inherit;font-weight:700;font-size:13px;}
.pf-actions{display:flex;justify-content:flex-end;padding-bottom:10px;}
.pf-save{background:var(--green);color:#fff;border:none;font-weight:800;font-size:15px;padding:13px 40px;border-radius:12px;cursor:pointer;font-family:inherit;}
.pf-save:disabled{opacity:.6;cursor:default;}
@media(max-width:640px){
  .pf-grid2,.pf-types{grid-template-columns:1fr;}
  .pf-field input,.pf-field textarea{font-size:16px;}
  .pf-save{width:100%;}
}
`;
