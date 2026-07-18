'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';
import BackBar from '@/components/BackBar';
import DisputeCase from '@/components/DisputeCase';

export default function ComplaintCasePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  useEffect(() => {
    if (!getToken()) router.push('/login');
  }, [router]);

  return (
    <>
      <TopBar />
      <BackBar />
      <div style={{ padding: '22px 20px 60px' }}>
        <DisputeCase id={id} />
      </div>
    </>
  );
}
