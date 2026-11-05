'use client';

import Link from 'next/link';
import { ArrowRight, Building2, KeyRound, LockKeyhole, Settings, ShieldCheck, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const MODULES = [
  { href: '/settings/user-management', icon: Users, title: 'User Management', description: 'View all system users and update their full name, role, and department.' },
  { href: '/settings/role-assignment', icon: KeyRound, title: 'Role Assignment', description: 'Assign or change the system role for each user.' },
  { href: '/settings/department-access', icon: Building2, title: 'Department Access', description: 'Assign department heads to the departments they will manage.' },
  { href: '/settings/access-control', icon: LockKeyhole, title: 'Access Control', description: 'Review the permissions assigned to each system role.' },
];

export function SettingsClient() {
  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary"><Settings className="h-4 w-4" /> System Settings</div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage system users, roles, and department access.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {MODULES.map((m) => (
          <Card key={m.href} className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><m.icon className="h-5 w-5" /></div>
                  <div><CardTitle>{m.title}</CardTitle><CardDescription>{m.description}</CardDescription></div>
                </div>
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent><Button asChild><Link href={m.href}>Open {m.title} <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
