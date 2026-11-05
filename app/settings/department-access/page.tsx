'use client';

import { AppShell } from '@/components/app-shell';
import { RouteGuard } from '@/components/route-guard';
import { DepartmentAccessClient } from '@/components/settings/department-access-client';

export default function DepartmentAccessPage() {
  return (
    <RouteGuard roles={['admin']}>
      <AppShell>
        <DepartmentAccessClient />
      </AppShell>
    </RouteGuard>
  );
}
