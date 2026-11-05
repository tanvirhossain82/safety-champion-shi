'use client';

import { AppShell } from '@/components/app-shell';
import { RouteGuard } from '@/components/route-guard';
import { SettingsClient } from '@/components/settings/settings-client';

export default function SettingsPage() {
  return (
    <RouteGuard roles={['admin']}>
      <AppShell>
        <SettingsClient />
      </AppShell>
    </RouteGuard>
  );
}
