'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2, KeyRound, Loader2, Pencil, Save, Search, ShieldCheck, Users, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { logAudit } from '@/lib/data';
import { DEPARTMENTS, Department, Profile, ROLE_LABELS, UserRole } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { useProfiles } from './use-profiles';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export function UserManagementClient() {
  const { profile: me } = useAuth();
  const { profiles, loading, reload } = useProfiles();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Profile | null>(null);
  const [form, setForm] = useState({ full_name: '', role: 'dept_head' as UserRole, department: '' as Department | '' });
  const [saving, setSaving] = useState(false);

  const filtered = profiles.filter((p) => {
    const s = search.toLowerCase();
    return !s || (p.email ?? '').toLowerCase().includes(s) || (p.full_name ?? '').toLowerCase().includes(s);
  });

  const openEdit = (p: Profile) => {
    setEditing(p);
    setForm({ full_name: p.full_name ?? '', role: p.role, department: (p.department ?? '') as Department | '' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const payload: { full_name: string | null; role: UserRole; department: Department | null } = {
        full_name: form.full_name.trim() || null,
        role: form.role,
        department: form.department ? (form.department as Department) : null,
      };
      const { error } = await supabase.from('profiles').update(payload).eq('id', editing.id);
      if (error) throw error;
      await logAudit('UPDATE', 'profile', editing.id, `Updated user ${editing.email} (role: ${form.role}, dept: ${form.department || 'none'})`, me?.email);
      toast({ title: 'User updated' });
      setEditing(null);
      reload();
    } catch (e: any) {
      toast({ title: 'Update failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-3 -ml-3"><Link href="/settings"><ArrowLeft className="mr-2 h-4 w-4" /> Settings</Link></Button>
          <div className="flex items-center gap-2 text-sm font-medium text-primary"><Users className="h-4 w-4" /> Settings / User Management</div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-sm text-muted-foreground">View all system users and update their name, role, and department.</p>
        </div>
        <Badge variant="outline" className="w-fit gap-2 border-primary/20 bg-primary/5 px-3 py-1.5 text-primary"><ShieldCheck className="h-4 w-4" /> Administrator</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total Users</div><div className="mt-1 text-2xl font-bold">{profiles.length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Admins</div><div className="mt-1 text-2xl font-bold text-primary">{profiles.filter((p) => p.role === 'admin').length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">HR</div><div className="mt-1 text-2xl font-bold text-chart-3">{profiles.filter((p) => p.role === 'hr').length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Dept Heads</div><div className="mt-1 text-2xl font-bold text-muted-foreground">{profiles.filter((p) => p.role === 'dept_head').length}</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by name or email..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Users className="h-5 w-5 text-primary" /> {filtered.length} {filtered.length === 1 ? 'User' : 'Users'}</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center text-center"><Users className="mb-2 h-10 w-10 text-muted-foreground/40" /><p className="text-sm text-muted-foreground">No users found</p></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead className="w-12">User</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Department</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9"><AvatarFallback className="bg-primary/10 text-[10px] text-primary">{initials(p.full_name || p.email)}</AvatarFallback></Avatar>
                          <span className="font-medium">{p.full_name || 'Unnamed'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{p.email}</TableCell>
                      <TableCell><Badge variant="outline" className={roleBadgeColor[p.role]}>{ROLE_LABELS[p.role]}</Badge></TableCell>
                      <TableCell>{p.department ? <Badge variant="secondary">{p.department}</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="text-right"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit User</DialogTitle><DialogDescription>Update name, role, and department for {editing?.email}</DialogDescription></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="full_name">Full Name</Label><Input id="full_name" value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} placeholder="Full name" /></div>
            <div className="space-y-2"><Label>Role</Label><Select value={form.role} onValueChange={(v: UserRole) => setForm((f) => ({ ...f, role: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ROLE_ORDER.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Department</Label><Select value={form.department || '__none__'} onValueChange={(v) => setForm((f) => ({ ...f, department: v === '__none__' ? '' : v as Department }))}><SelectTrigger><SelectValue placeholder="No department" /></SelectTrigger><SelectContent><SelectItem value="__none__">No department</SelectItem>{DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditing(null)}><X className="mr-2 h-4 w-4" /> Cancel</Button><Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="mr-2 h-4 w-4" /> Save</>}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
