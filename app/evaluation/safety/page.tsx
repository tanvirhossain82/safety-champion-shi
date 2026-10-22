'use client';

import { AppShell } from '@/components/app-shell';
import { RouteGuard } from '@/components/route-guard';
import { SafetyEvaluationSheet } from '@/components/evaluation/safety-evaluation-sheet';
import { useAuth } from '@/lib/auth-context';

export default function SafetyEvaluationPage() {
  const { can } = useAuth();
  return (
    <RouteGuard>
      <AppShell>
        <SafetyEvaluationSheet canEvaluate={can('canEvaluateSafety')} />
      </AppShell>
    </RouteGuard>
  );
}
