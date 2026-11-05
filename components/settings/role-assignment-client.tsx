'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, KeyRound, Loader2, Save, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { logAudit } from '@/lib/data';
import { ROLE_LABELS, UserRole } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { useProfiles } from './use-profiles';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';

const ROLE_ORDER: UserRole[] = ['admin', 'hr', 'safety', 'dept_head'];

const roleBadgeColor: Record<UserRole, string> = {
  admin: 'bg-primary/10 text-primary border-primary/20',
  hr: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  safety: 'bg-accent/10 text-accent border-accent/20',
  dept_head: 'bg-muted text-muted-foreground border-border',
};

function initials(name: string) {
  return name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase() || '?';
}

export function RoleAssignmentClient() {
  const { profile: me } = useAuth();
  const { profiles, loading, reload } = useProfiles();
  const [pending, setPending] = useState<Record<string, UserRole>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const changes = useMemo(() => Object.keys(pending).filter((id) => pending[id] !== profiles.find((p) => p.id === id)?.role), [pending, profiles]);

  const setRole = (id: string, role: UserRole) => setPending((prev) => ({ ...prev, [id]: role }));

  const saveOne = async (id: string) => {
    const role = pending[id];
    if (!role) return;
    const target = profiles.find((p) => p.id === id);
    if (!target) return;
    setSavingId(id);
    try {
      const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
      if (error) throw error;
      await logAudit('UPDATE', 'profile', id, `Changed role for ${target.email} from ${target.role} to ${role}`, me?.email);
      toast({ title: 'Role updated', description: `${target.email} is now ${ROLE_LABELS[role]}` });
      setPending((prev) => { const next = { ...prev }; delete next[id]; return next; });
      reload();
    } catch (e: any) {
      toast({ title: 'Update failed', description: e.message, variant: 'destructive' });
    } finally {
      setSavingId(null);
    }
  };

  const counts: Record<UserRole, number> = { admin: 0, hr: 0, safety: 0, dept_head: 0 };
  profiles.forEach((p) => { counts[p.role] += 1; });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-3 -ml-3"><Link href="/settings"><ArrowLeft className="mr-2 h-4 w-4" /> Settings</Link></Button>
          <div className="flex items-center gap-2 text-sm font-medium text-primary"><KeyRound className="h-4 w-4" /> Settings / Role Assignment</div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Role Assignment</h1>
          <p className="text-sm text-muted-foreground">Assign a system role to each user. Changes apply on their next sign-in.</p>
        </div>
        <Badge variant="outline" className="w-fit gap-2 border-primary/20 bg-primary/5 px-3 py-1.5 text-primary"><ShieldCheck className="h-4 w-4" /> Administrator</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {ROLE_ORDER.map((r) => (
          <Card key={r}><CardContent className="p-4"><div className="text-xs text-muted-foreground">{ROLE_LABELS[r]}</div><div className="mt-1 text-2xl font-bold">{counts[r]}</div></CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Assign roles</CardTitle><CardDescription>{changes.length > 0 ? `${changes.length} unsaved change${changes.length === 1 ? '' : 's'}` : 'Select a role for each user and save.'}</CardDescription></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Email</TableHead><TableHead>Current Role</TableHead><TableHead>New Role</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                <TableBody>
                  {profiles.map((p) => {
                    const newRole = pending[p.id] ?? p.role;
                    const changed = newRole !== p.role;
                    return (
                      <TableRow key={p.id} className={changed ? 'bg-primary/5' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary/10 text-[10px] text-primary">{initials(p.full_name || p.email)}</AvatarFallback></Avatar>
                            <span className="font-medium">{p.full_name || 'Unnamed'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{p.email}</TableCell>
                        <TableCell><Badge variant="outline" className={roleBadgeColor[p.role]}>{ROLE_LABELS[p.role]}</Badge></TableCell>
                        <TableCell>
                          <Select value={newRole} onValueChange={(v: UserRole) => setRole(p.id, v)}>
                            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                            <SelectContent>{ROLE_ORDER.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}</SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" disabled={!changed || savingId === p.id} onClick={() => saveOne(p.id)}>
                            {savingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="mr-1.5 h-4 w-4" /> Save</>}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
