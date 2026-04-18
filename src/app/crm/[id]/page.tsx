import { Suspense } from 'react';
import CrmLeadRecordClient from './record-client';

export default async function CrmLeadRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense>
      <CrmLeadRecordClient id={id} />
    </Suspense>
  );
}

