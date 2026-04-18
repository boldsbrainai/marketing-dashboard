'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ExternalLink } from 'lucide-react';
import { LeadDetailPanel } from '@/components/crm/lead-detail-panel';

type Role = 'admin' | 'editor' | 'viewer';

export default function CrmLeadRecordClient({ id }: { id: string }) {
  const router = useRouter();
  const [role, setRole] = useState<Role>('viewer');
  const [slaStaleDays, setSlaStaleDays] = useState(7);
  const [slaNewDays, setSlaNewDays] = useState(3);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((payload) => setRole(payload?.user?.role === 'admin' || payload?.user?.role === 'editor' ? payload.user.role : 'viewer'))
      .catch(() => setRole('viewer'));
  }, []);

  useEffect(() => {
    fetch('/api/settings/crm')
      .then(r => r.json())
      .then((data) => {
        if (typeof data?.sla_stale_days === 'number') setSlaStaleDays(data.sla_stale_days);
        if (typeof data?.sla_new_days === 'number') setSlaNewDays(data.sla_new_days);
      })
      .catch(() => {});
  }, []);

  const canEdit = useMemo(() => role === 'admin' || role === 'editor', [role]);
  const splitViewHref = useMemo(() => `/crm?lead=${encodeURIComponent(id)}`, [id]);

  return (
    <div className="space-y-4 animate-in">
      <div className="panel">
        <div className="panel-body !p-3 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Link href="/crm" className="btn btn-ghost btn-sm">
              <ChevronLeft size={14} />
              Back
            </Link>
            <div className="text-xs text-muted-foreground font-mono truncate max-w-[55vw]">
              {id}
            </div>
          </div>
          <Link href={splitViewHref} className="btn btn-ghost btn-sm" title="Open split view" aria-label="Open split view">
            <ExternalLink size={14} />
            Split view
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        <LeadDetailPanel
          id={id}
          variant="page"
          onClose={() => router.push('/crm')}
          onMutate={() => {}}
          canEdit={canEdit}
          nowMs={nowMs}
          slaStaleDays={slaStaleDays}
          slaNewDays={slaNewDays}
        />
      </div>
    </div>
  );
}
