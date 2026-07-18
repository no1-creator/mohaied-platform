'use client';

import { useParams } from 'next/navigation';
import AdminShell from '@/components/AdminShell';
import DisputeCase from '@/components/DisputeCase';

export default function AdminComplaintDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  return (
    <AdminShell active="complaints" title="ملف النزاع">
      <DisputeCase id={id} />
    </AdminShell>
  );
}
