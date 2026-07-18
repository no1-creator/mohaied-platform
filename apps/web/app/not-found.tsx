import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '40px 20px',
        gap: '14px',
      }}
    >
      <div style={{ fontSize: '64px', fontWeight: 800, color: 'var(--green)' }}>404</div>
      <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
        الصفحة مش موجودة
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.7, maxWidth: '360px', margin: 0 }}>
        يمكن الرابط اتغيّر أو الصفحة اتشالت. ارجع للوحة التحكم وكمّل شغلك.
      </p>
      <Link
        href="/dashboard"
        style={{
          marginTop: '6px',
          padding: '11px 24px',
          borderRadius: '12px',
          background: 'var(--green)',
          color: '#fff',
          fontWeight: 800,
          fontSize: '14px',
          textDecoration: 'none',
        }}
      >
        الرجوع للوحة التحكم
      </Link>
    </div>
  );
}
