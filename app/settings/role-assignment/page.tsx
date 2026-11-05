'use client';

import { AppShell } from '@/components/app-shell';
import { RouteGuard } from '@/components/route-guard';
import { RoleAssignmentClient } from '@/components/settings/role-assignment-client';

export default function RoleAssignmentPage() {
  return (
    <RouteGuard roles={['admin']}>
      <AppShell>
        <RoleAssignmentClient />
      </AppShell>
    </RouteGuard>
  );
}
