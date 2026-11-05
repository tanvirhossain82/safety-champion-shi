'use client';

import Link from 'next/link';
import { ArrowLeft, Check, LockKeyhole, ShieldCheck } from 'lucide-react';
import { ROLE_LABELS, ROLE_PERMISSIONS, UserRole } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const PERMISSION_LABELS: Record<keyof typeof ROLE_PERMISSIONS[UserRole], string> = {
  canManageEmployees: 'Manage employees',
  canManageNegativeReasons: 'Manage negative reasons',
  canManageUsers: 'Manage users and settings',
  canEvaluateDept: 'Department evaluation',
  canEvaluateHR: 'HR evaluation',
  canEvaluateSafety: 'Safety evaluation',
  canDeleteEvaluations: 'Delete evaluations',
  canViewAuditLog: 'View audit log',
  canViewReports: 'View reports',
};

const ROLE_ORDER: UserRole[] = ['admin', 'hr', 'safety', 'dept_head'];

export function AccessControlClient() {
  const permissionKeys = Object.keys(PERMISSION_LABELS) as Array<keyof typeof ROLE_PERMISSIONS[UserRole]>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><Button variant="ghost" size="sm" asChild className="mb-3 -ml-3"><Link href="/settings"><ArrowLeft className="mr-2 h-4 w-4" /> Settings</Link></Button><div className="flex items-center gap-2 text-sm font-medium text-primary"><LockKeyhole className="h-4 w-4" /> Settings / Access Control</div><h1 className="mt-1 text-2xl font-bold tracking-tight">Access Control</h1><p className="text-sm text-muted-foreground">Review the permissions assigned to each system role.</p></div>
        <Badge variant="outline" className="w-fit gap-2 border-primary/20 bg-primary/5 px-3 py-1.5 text-primary"><ShieldCheck className="h-4 w-4" /> Administrator view</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle>Role permissions</CardTitle><CardDescription>Permissions are applied when a user signs in with the selected role.</CardDescription></CardHeader>
        <CardContent><div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[720px] text-sm"><thead className="bg-muted/50"><tr className="border-b"><th className="px-4 py-3 text-left font-semibold">Permission</th>{ROLE_ORDER.map((role) => <th key={role} className="px-4 py-3 text-center font-semibold">{ROLE_LABELS[role]}</th>)}</tr></thead><tbody>{permissionKeys.map((permission) => <tr key={permission} className="border-b last:border-0"><td className="px-4 py-3 font-medium">{PERMISSION_LABELS[permission]}</td>{ROLE_ORDER.map((role) => <td key={role} className="px-4 py-3 text-center">{ROLE_PERMISSIONS[role][permission] ? <Check className="mx-auto h-4 w-4 text-emerald-600" /> : <span className="text-muted-foreground">—</span>}</td>)}</tr>)}</tbody></table></div></CardContent>
      </Card>
    </div>
  );
}
