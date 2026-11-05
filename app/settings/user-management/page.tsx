'use client';

import { AppShell } from '@/components/app-shell';
import { RouteGuard } from '@/components/route-guard';
import { UserManagementClient } from '@/components/settings/user-management-client';

export default function UserManagementPage() {
  return (
    <RouteGuard roles={['admin']}>
      <AppShell>
        <UserManagementClient />
      </AppShell>
    </RouteGuard>
  );
}
