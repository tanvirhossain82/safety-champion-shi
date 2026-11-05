'use client';

import { AppShell } from '@/components/app-shell';
import { RouteGuard } from '@/components/route-guard';
import { AccessControlClient } from '@/components/settings/access-control-client';

export default function AccessControlPage() {
  return (
    <RouteGuard roles={['admin']}>
      <AppShell>
        <AccessControlClient />
      </AppShell>
    </RouteGuard>
  );
}
