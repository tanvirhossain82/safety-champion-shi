'use client';

import { AppShell } from '@/components/app-shell';
import { RouteGuard } from '@/components/route-guard';
import { HrEvaluationSheet } from '@/components/evaluation/hr-evaluation-sheet';
import { useAuth } from '@/lib/auth-context';

export default function HrEvaluationPage() {
  const { can } = useAuth();
  return (
    <RouteGuard>
      <AppShell>
        <HrEvaluationSheet canEvaluate={can('canEvaluateHR')} />
      </AppShell>
    </RouteGuard>
  );
}
