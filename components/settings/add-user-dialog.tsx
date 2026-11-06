'use client';

import { useEffect, useState } from 'react';
import { CircleCheck as CheckCircle2, Circle, Loader as Loader2, UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { logAudit } from '@/lib/data';
import { DEPARTMENTS, ROLE_LABELS, ROLE_PERMISSIONS, UserRole } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ROLE_ORDER: UserRole[] = ['admin', 'hr', 'safety', 'dept_head'];

type Permission = keyof (typeof ROLE_PERMISSIONS)[UserRole];

const MODULE_LABELS: Record<Permission, string> = {
  canManageEmployees: 'Employees',
  canManageNegativeReasons: 'Negative Reasons',
  canManageUsers: 'User Management',
  canEvaluateDept: 'Department Evaluation',
  canEvaluateHR: 'HR Evaluation',
  canEvaluateSafety: 'Safety Evaluation',
  canDeleteEvaluations: 'Delete Evaluations',
  canViewAuditLog: 'Audit Log',
  canViewReports: 'Reports',
};

const EMPTY_FORM = { full_name: '', email: '', password: '', role: 'dept_head' as UserRole, department: '' };

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function AddUserDialog({ open, onOpenChange, onCreated }: AddUserDialogProps) {
  const { profile: me } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setError(null);
    }
  }, [open]);

  const permissions = ROLE_PERMISSIONS[form.role];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('admin-create-user', {
        body: {
          full_name: form.full_name,
          email: form.email,
          password: form.password,
          role: form.role,
          department: form.department || null,
        },
      });
      if (invokeError) {
        const detail = await (invokeError as { context?: Response }).context?.json().catch(() => null);
        throw new Error(detail?.error ?? 'Could not add the user.');
      }
      if (!data?.id || !data?.email) throw new Error('Unexpected response while adding the user.');

      await logAudit('CREATE', 'profile', data.id, `Added user ${data.email} (role: ${form.role}, dept: ${form.department || 'none'})`, me?.email);
      onCreated();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-primary" /> Add New User</DialogTitle>
          <DialogDescription>Create a sign-in account. The role decides which modules the user can open.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="new-user-name">Full Name</Label><Input id="new-user-name" required value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} placeholder="Full name" /></div>
          <div className="space-y-2"><Label htmlFor="new-user-email">Email</Label><Input id="new-user-email" type="email" required autoComplete="off" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="name@company.com" /></div>
          <div className="space-y-2"><Label htmlFor="new-user-password">Password</Label><Input id="new-user-password" type="password" required minLength={8} autoComplete="new-password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="At least 8 characters" /></div>
          <div className="space-y-2"><Label>Role</Label><Select value={form.role} onValueChange={(v: UserRole) => setForm((f) => ({ ...f, role: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ROLE_ORDER.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Department</Label><Select value={form.department || '__none__'} onValueChange={(v) => setForm((f) => ({ ...f, department: v === '__none__' ? '' : v }))}><SelectTrigger><SelectValue placeholder="No department" /></SelectTrigger><SelectContent><SelectItem value="__none__">No department</SelectItem>{DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>

          <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
            <Label className="text-sm font-semibold">Module access for this role</Label>
            <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {(Object.keys(MODULE_LABELS) as Permission[]).map((key) => {
                const allowed = permissions[key];
                return (
                  <li key={key} className={`flex items-center gap-2 text-sm ${allowed ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {allowed ? <CheckCircle2 className="h-4 w-4 text-chart-3" /> : <Circle className="h-4 w-4 text-muted-foreground/50" />}
                    {MODULE_LABELS[key]}
                  </li>
                );
              })}
            </ul>
          </div>

          {error && <Alert className="border-destructive/30 bg-destructive/5"><AlertDescription className="text-destructive">{error}</AlertDescription></Alert>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create User'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
