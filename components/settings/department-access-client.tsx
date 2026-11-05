'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2, Loader2, Save, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { logAudit } from '@/lib/data';
import { DEPARTMENTS, Department, DepartmentRecord, ROLE_LABELS } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { useProfiles } from './use-profiles';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

function initials(name: string) {
  return name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase() || '?';
}

export function DepartmentAccessClient() {
  const { profile: me } = useAuth();
  const { profiles, loading: profilesLoading } = useProfiles();
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [deptLoading, setDeptLoading] = useState(true);
  const [assignments, setAssignments] = useState<Record<string, string | ''>>({});
  const [savingDept, setSavingDept] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setDeptLoading(true);
      const { data } = await supabase.from('departments').select('*').order('created_at', { ascending: true });
      setDepartments((data ?? []) as DepartmentRecord[]);
      setDeptLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (profiles.length === 0) return;
    const heads = profiles.filter((p) => p.role === 'dept_head' && p.department);
    const map: Record<string, string | ''> = {};
    heads.forEach((p) => { if (p.department) map[p.department] = p.id; });
    setAssignments(map);
  }, [profiles]);

  const deptHeads = profiles.filter((p) => p.role === 'dept_head');

  const saveAssignment = async (deptCode: string) => {
    const userId = assignments[deptCode];
    setSavingDept(deptCode);
    try {
      const dept = departments.find((d) => d.code === deptCode);
      const previousHead = deptHeads.find((h) => h.department === deptCode);

      if (previousHead && previousHead.id !== userId) {
        await supabase.from('profiles').update({ department: null }).eq('id', previousHead.id);
      }

      if (userId) {
        const { error } = await supabase.from('profiles').update({ department: deptCode as Department }).eq('id', userId);
        if (error) throw error;
        const head = profiles.find((p) => p.id === userId);
        await logAudit('UPDATE', 'profile', userId, `Assigned ${head?.email} as department head for ${dept?.name ?? deptCode}`, me?.email);
        toast({ title: 'Department head assigned', description: `${head?.email} → ${dept?.name ?? deptCode}` });
      } else {
        await logAudit('UPDATE', 'department', null, `Removed department head for ${dept?.name ?? deptCode}`, me?.email);
        toast({ title: 'Department head removed', description: dept?.name ?? deptCode });
      }
    } catch (e: any) {
      toast({ title: 'Update failed', description: e.message, variant: 'destructive' });
    } finally {
      setSavingDept(null);
    }
  };

  const unassigned = DEPARTMENTS.filter((d) => !departments.some((dept) => dept.code === d));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-3 -ml-3"><Link href="/settings"><ArrowLeft className="mr-2 h-4 w-4" /> Settings</Link></Button>
          <div className="flex items-center gap-2 text-sm font-medium text-primary"><Building2 className="h-4 w-4" /> Settings / Department Access</div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Department Access</h1>
          <p className="text-sm text-muted-foreground">Assign a department head to each department so they can run department evaluations.</p>
        </div>
        <Badge variant="outline" className="w-fit gap-2 border-primary/20 bg-primary/5 px-3 py-1.5 text-primary"><ShieldCheck className="h-4 w-4" /> Administrator</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle>Department heads</CardTitle><CardDescription>{deptHeads.length} department head{deptHeads.length === 1 ? '' : 's'} available. Select one per department.</CardDescription></CardHeader>
        <CardContent>
          {profilesLoading || deptLoading ? (
            <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : deptHeads.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center text-center"><Building2 className="mb-2 h-10 w-10 text-muted-foreground/40" /><p className="text-sm text-muted-foreground">No department heads found. Assign the dept_head role to a user first.</p><Button asChild variant="outline" className="mt-3"><Link href="/settings/role-assignment">Go to Role Assignment</Link></Button></div>
          ) : (
            <div className="space-y-3">
              {departments.map((dept) => {
                const selected = assignments[dept.code] ?? '';
                const head = profiles.find((p) => p.id === selected);
                return (
                  <div key={dept.id} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Building2 className="h-5 w-5" /></div>
                      <div>
                        <div className="font-medium">{dept.name}</div>
                        <div className="text-xs text-muted-foreground">{dept.code} · {dept.status}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {head && (
                        <div className="hidden items-center gap-2 sm:flex">
                          <Avatar className="h-7 w-7"><AvatarFallback className="bg-primary/10 text-[10px] text-primary">{initials(head.full_name || head.email)}</AvatarFallback></Avatar>
                          <span className="text-sm text-muted-foreground">{head.full_name || head.email}</span>
                        </div>
                      )}
                      <Select value={selected} onValueChange={(v) => setAssignments((prev) => ({ ...prev, [dept.code]: v === '__none__' ? '' : v }))}>
                        <SelectTrigger className="w-[220px]"><SelectValue placeholder="No head assigned" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">No head assigned</SelectItem>
                          {deptHeads.map((h) => <SelectItem key={h.id} value={h.id}>{h.full_name || h.email}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button size="sm" disabled={savingDept === dept.code} onClick={() => saveAssignment(dept.code)}>
                        {savingDept === dept.code ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="mr-1.5 h-4 w-4" /> Save</>}
                      </Button>
                    </div>
                  </div>
                );
              })}
              {unassigned.length > 0 && (
                <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  Departments without a department record: {unassigned.join(', ')}. Add them in the Departments page to assign heads.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
