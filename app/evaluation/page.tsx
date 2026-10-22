'use client';

import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { RouteGuard } from '@/components/route-guard';
import { HeartHandshake, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function EvaluationPage() {
  const { can, profile } = useAuth();

  const modules = [
    {
      href: '/evaluation/hr',
      title: 'Human Resource',
      description: 'Enter HR performance marks — attendance, punctuality, discipline, and more (max 25 positive marks).',
      icon: HeartHandshake,
      color: 'text-chart-3',
      bg: 'bg-chart-3/10',
      border: 'border-chart-3/20',
      canAccess: can('canEvaluateHR') || profile?.role === 'admin',
    },
    {
      href: '/evaluation/safety',
      title: 'Safety',
      description: 'Enter safety & compliance marks — PPE, SOP, housekeeping, near miss reporting, and more (max 30 positive marks).',
      icon: ShieldCheck,
      color: 'text-accent',
      bg: 'bg-accent/10',
      border: 'border-accent/20',
      canAccess: can('canEvaluateSafety') || profile?.role === 'admin',
    },
  ];

  return (
    <RouteGuard>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Evaluation</h1>
            <p className="text-sm text-muted-foreground">Choose an evaluation module to enter monthly marks</p>
          </div>

          {profile && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
              <span className="font-medium">Your role: {profile.role === 'dept_head' ? 'Department Head' : profile.role.toUpperCase()}</span>
              {' — '}
              {profile.role === 'admin' && 'You can enter all score types (Department, HR, Safety).'}
              {profile.role === 'hr' && 'You can enter HR marks only.'}
              {profile.role === 'safety' && 'You can enter Safety marks only.'}
              {profile.role === 'dept_head' && 'Department marks are entered from your department page.'}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {modules.map((mod) => {
              const Icon = mod.icon;
              if (!mod.canAccess) {
                return (
                  <Card key={mod.href} className="opacity-50">
                    <CardContent className="flex items-center gap-4 p-6">
                      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${mod.bg}`}>
                        <Icon className={`h-7 w-7 ${mod.color}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold">{mod.title}</h3>
                        <p className="text-sm text-muted-foreground">{mod.description}</p>
                        <p className="mt-2 text-xs text-muted-foreground">You don&apos;t have permission to access this module.</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              }
              return (
                <Link key={mod.href} href={mod.href}>
                  <Card className={`group cursor-pointer transition-all hover:shadow-md hover:border-primary/30 ${mod.border}`}>
                    <CardContent className="flex items-center gap-4 p-6">
                      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${mod.bg}`}>
                        <Icon className={`h-7 w-7 ${mod.color}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold">{mod.title}</h3>
                        <p className="text-sm text-muted-foreground">{mod.description}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </AppShell>
    </RouteGuard>
  );
}
