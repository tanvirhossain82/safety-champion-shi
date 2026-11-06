'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CircleAlert as AlertCircle, CircleCheck as CheckCircle2, Loader as Loader2, Pencil, Save, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { logAudit } from '@/lib/data';
import { Employee, Evaluation, DEPARTMENTS, MONTH_NAMES, SafetyCriteriaBreakdown } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/lib/auth-context';
import { ROLE_PERMISSIONS, UserRole } from '@/lib/types';
import { SafetyCriteriaDialog, SafetyCriterion } from '@/components/evaluation/safety-criteria-dialog';

function emptyCriteria(positive: SafetyCriterion[], negative: SafetyCriterion[]): SafetyCriteriaBreakdown {
  return {
    positive: Object.fromEntries(positive.map((item) => [item.key, 0])),
    negative: Object.fromEntries(negative.map((item) => [item.key, 0])),
  };
}

function totalCriteria(criteria: Record<string, number>): number {
  return Object.values(criteria).reduce((total, value) => total + (Number(value) || 0), 0);
}

export function SafetyEvaluationSheet({ canEvaluate }: { canEvaluate: boolean }) {
  const { profile } = useAuth();
  const now = new Date();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [existing, setExisting] = useState<Evaluation[]>([]);
  const [employeeId, setEmployeeId] = useState('');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [positiveCriteria, setPositiveCriteria] = useState<SafetyCriterion[]>([]);
  const [negativeCriteria, setNegativeCriteria] = useState<SafetyCriterion[]>([]);
  const [criteriaDialogOpen, setCriteriaDialogOpen] = useState(false);
  const [criteria, setCriteria] = useState<SafetyCriteriaBreakdown>({ positive: {}, negative: {} });
  const [remarks, setRemarks] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadEmployees = useCallback(async () => {
    const { data } = await supabase.from('employees').select('*').eq('status', 'Active').order('name');
    if (data) setEmployees(data as Employee[]);
  }, []);

  const loadCriteria = useCallback(async () => {
    const { data, error } = await supabase.from('safety_criteria').select('id, section, key, label, max').order('sort_order');
    if (error) { console.error(error); return; }
    const rows = (data ?? []) as { id: string; section: 'positive' | 'negative'; key: string; label: string; max: number }[];
    const toCriterion = (row: (typeof rows)[number]): SafetyCriterion => ({ id: row.id, key: row.key, label: row.label, max: Number(row.max) });
    setPositiveCriteria(rows.filter((row) => row.section === 'positive').map(toCriterion));
    setNegativeCriteria(rows.filter((row) => row.section === 'negative').map(toCriterion));
  }, []);

  const loadExisting = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('evaluations')
      .select('*, employees!inner(employee_id, name, department, photo)')
      .eq('month', month)
      .eq('year', year)
      .order('total_marks', { ascending: false });
    if (error) console.error(error);
    else setExisting((data ?? []) as unknown as Evaluation[]);
    setLoading(false);
  }, [month, year]);

  useEffect(() => { loadEmployees(); }, [loadEmployees]);
  useEffect(() => { loadCriteria(); }, [loadCriteria]);
  useEffect(() => { loadExisting(); }, [loadExisting]);

  const filteredEmployees = useMemo(() => {
    const query = search.toLowerCase();
    return employees.filter((employee) => {
      const matchesSearch = !query || employee.name.toLowerCase().includes(query) || employee.employee_id.toLowerCase().includes(query);
      return matchesSearch && (deptFilter === 'all' || employee.department === deptFilter);
    });
  }, [employees, search, deptFilter]);

  const filteredExisting = useMemo(() => existing.filter((evaluation: any) => deptFilter === 'all' || evaluation.employees?.department === deptFilter), [existing, deptFilter]);
  const positiveMax = positiveCriteria.reduce((total, item) => total + item.max, 0);
  const negativeMax = negativeCriteria.reduce((total, item) => total + item.max, 0);
  const positiveTotal = totalCriteria(criteria.positive);
  const negativeTotal = totalCriteria(criteria.negative);
  const selectedEmployee = employees.find((employee) => employee.id === employeeId);
  const duplicate = existing.some((evaluation) => evaluation.employee_id === employeeId && evaluation.id !== editingId);
  const canDelete = profile ? ROLE_PERMISSIONS[profile.role as UserRole].canDeleteEvaluations : false;
  const isAdmin = profile?.role === 'admin';

  const updateCriterion = (group: 'positive' | 'negative', key: string, value: string, max: number) => {
    const score = Math.min(max, Math.max(0, Number(value) || 0));
    setCriteria((current) => ({ ...current, [group]: { ...current[group], [key]: score } }));
  };

  const startEdit = (evaluation: Evaluation) => {
    setEditingId(evaluation.id);
    setEmployeeId(evaluation.employee_id);
    setMonth(evaluation.month);
    setYear(evaluation.year);
    setRemarks(evaluation.remarks ?? '');
    setCriteria({
      positive: { ...emptyCriteria(positiveCriteria, negativeCriteria).positive, ...(evaluation.safety_criteria?.positive ?? {}) },
      negative: { ...emptyCriteria(positiveCriteria, negativeCriteria).negative, ...(evaluation.safety_criteria?.negative ?? {}) },
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const reset = () => {
    setEditingId(null);
    setEmployeeId('');
    setMonth(now.getMonth() + 1);
    setYear(now.getFullYear());
    setCriteria(emptyCriteria(positiveCriteria, negativeCriteria));
    setRemarks('');
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!employeeId) { alert('Select an employee'); return; }
    if (duplicate) { alert('This employee already has an evaluation for this month. Edit the existing record instead.'); return; }

    setSaving(true);
    const payload = {
      safety_marks: positiveTotal,
      negative_marks: negativeTotal,
      safety_criteria: criteria,
      remarks: remarks.trim() || null,
    };
    try {
      if (editingId) {
        const { error } = await supabase.from('evaluations').update(payload).eq('id', editingId);
        if (error) throw error;
        await logAudit('UPDATE', 'evaluation', editingId, `Updated Safety sheet for ${selectedEmployee?.name}`, profile?.email);
      } else {
        const { data: existingRow, error: lookupError } = await supabase.from('evaluations').select('id').eq('employee_id', employeeId).eq('month', month).eq('year', year).maybeSingle();
        if (lookupError) throw lookupError;
        if (existingRow) {
          const { error } = await supabase.from('evaluations').update(payload).eq('id', existingRow.id);
          if (error) throw error;
          await logAudit('UPDATE', 'evaluation', existingRow.id, `Updated Safety sheet for ${selectedEmployee?.name}`, profile?.email);
        } else {
          const { error } = await supabase.from('evaluations').insert({ employee_id: employeeId, month, year, department_marks: 0, hr_marks: 0, ...payload, created_by: profile?.id });
          if (error) throw error;
          await logAudit('CREATE', 'evaluation', null, `Created Safety sheet for ${selectedEmployee?.name} (${month}/${year})`, profile?.email);
        }
      }
      reset();
      await loadExisting();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (evaluation: Evaluation) => {
    const { error } = await supabase.from('evaluations').delete().eq('id', evaluation.id);
    if (error) { alert(error.message); return; }
    await loadExisting();
  };

  if (!canEvaluate && profile?.role !== 'admin') {
    return <Card><CardContent className="flex flex-col items-center justify-center py-12 text-center"><ShieldCheck className="mb-3 h-10 w-10 text-muted-foreground/40" /><p className="text-sm text-muted-foreground">You do not have permission to enter Safety marks.</p></CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <ShieldCheck className="h-7 w-7 text-accent" />
          Safety Evaluation
        </h1>
        <p className="text-sm text-muted-foreground">Enter monthly safety &amp; compliance marks (max {positiveMax} positive marks)</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><ShieldCheck className="h-5 w-5 text-accent" />{editingId ? 'Edit Safety Performance Sheet' : 'Safety Performance Sheet'}</CardTitle>
          <CardDescription>Safety &amp; Compliance — Positive maximum {positiveMax} marks</CardDescription>
          {isAdmin && <Button type="button" variant="outline" size="sm" className="mt-3 w-fit" onClick={() => setCriteriaDialogOpen(true)}><Pencil className="mr-2 h-3.5 w-3.5" />Edit Scores</Button>}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Month</Label><Select value={String(month)} onValueChange={(value) => setMonth(Number(value))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{MONTH_NAMES.map((name, index) => <SelectItem key={name} value={String(index + 1)}>{name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Year</Label><Select value={String(year)} onValueChange={(value) => setYear(Number(value))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Array.from({ length: 5 }, (_, index) => now.getFullYear() - index).map((value) => <SelectItem key={value} value={String(value)}>{value}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label>Filter by Department</Label><Select value={deptFilter} onValueChange={setDeptFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Departments</SelectItem>{DEPARTMENTS.map((department) => <SelectItem key={department} value={department}>{department}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Employee</Label><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search employees..." className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} /></div><Select value={employeeId} onValueChange={setEmployeeId}><SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent className="max-h-60">{filteredEmployees.map((employee) => <SelectItem key={employee.id} value={employee.id}>{employee.employee_id} — {employee.name} ({employee.department})</SelectItem>)}</SelectContent></Select></div>
            {duplicate && <Alert className="border-destructive/30 bg-destructive/5"><AlertCircle className="h-4 w-4 text-destructive" /><AlertDescription className="text-destructive">This employee already has an evaluation for this month. Edit it from the list below.</AlertDescription></Alert>}

            <CriteriaTable title="Positive" criteria={positiveCriteria} values={criteria.positive} total={positiveTotal} maxTotal={positiveMax} color="text-chart-3" onChange={(key, value, max) => updateCriterion('positive', key, value, max)} />
            <CriteriaTable title="Negative (Deduction)" criteria={negativeCriteria} values={criteria.negative} total={negativeTotal} maxTotal={negativeMax} color="text-destructive" onChange={(key, value, max) => updateCriterion('negative', key, value, max)} negative />

            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3"><span className="text-sm font-medium">Safety Total</span><Badge className="bg-accent text-white">{positiveTotal} - {negativeTotal} = {positiveTotal - negativeTotal}</Badge></div>
            <div className="space-y-2"><Label htmlFor="safety-remarks">Remarks</Label><Textarea id="safety-remarks" placeholder="Optional notes about this evaluation..." value={remarks} onChange={(event) => setRemarks(event.target.value)} rows={2} /></div>
            <div className="flex gap-2"><Button type="submit" disabled={saving || duplicate} className="flex-1">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="mr-2 h-4 w-4" />{editingId ? 'Update' : 'Save'} Evaluation</>}</Button>{editingId && <Button type="button" variant="outline" onClick={reset}>Cancel Edit</Button>}</div>
          </form>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2"><CardHeader><CardTitle className="text-lg">Existing Safety Evaluations</CardTitle><CardDescription>{MONTH_NAMES[month - 1]} {year} — {filteredExisting.length} total</CardDescription></CardHeader><CardContent>{loading ? <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : filteredExisting.length === 0 ? <div className="flex flex-col items-center justify-center py-8 text-center"><CheckCircle2 className="mb-2 h-8 w-8 text-muted-foreground/40" /><p className="text-sm text-muted-foreground">No evaluations for this month yet</p></div> : <div className="space-y-2">{filteredExisting.map((evaluation: any) => <div key={evaluation.id} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/30"><div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{evaluation.employees?.name ?? 'Unknown'}</div><div className="text-xs text-muted-foreground">{evaluation.employees?.employee_id} · {evaluation.employees?.department}</div></div><div className="text-right"><Badge variant="secondary" className="font-bold text-accent">{Number(evaluation.safety_marks)}</Badge><div className="text-[10px] text-destructive">-{Number(evaluation.negative_marks)}</div></div><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(evaluation)}><Pencil className="h-3.5 w-3.5" /></Button>{canDelete && <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(evaluation)}><Trash2 className="h-3.5 w-3.5" /></Button>}</div></div>)}</div>}</CardContent></Card>
    </div>
    <SafetyCriteriaDialog open={criteriaDialogOpen} onOpenChange={setCriteriaDialogOpen} positive={positiveCriteria} negative={negativeCriteria} userEmail={profile?.email} onSaved={loadCriteria} />
    </div>
  );
}

function CriteriaTable({ title, criteria, values, total, maxTotal, color, onChange, negative = false }: { title: string; criteria: SafetyCriterion[]; values: Record<string, number>; total: number; maxTotal: number; color: string; onChange: (key: string, value: string, max: number) => void; negative?: boolean }) {
  return <div className="space-y-2"><div className="flex items-center justify-between"><Label className={`text-sm font-semibold ${color}`}>{title} Marks</Label><Badge variant="secondary" className={`font-bold ${color}`}>{negative ? '-' : ''}{total} / {negative ? '-' : ''}{maxTotal}</Badge></div><div className="overflow-x-auto rounded-lg border"><Table><TableHeader><TableRow><TableHead>Category</TableHead><TableHead className="text-center">Max</TableHead><TableHead className="text-center">{negative ? 'Deduct' : 'Score'}</TableHead></TableRow></TableHeader><TableBody>{criteria.map((item) => <TableRow key={`${title}-${item.key}`}><TableCell className="text-sm font-medium">{item.label}</TableCell><TableCell className="text-center text-sm text-muted-foreground">{negative ? '-' : ''}{item.max}</TableCell><TableCell className="text-center"><Input type="number" min={0} max={item.max} step="0.5" value={values[item.key] ?? 0} onChange={(event) => onChange(item.key, event.target.value, item.max)} className={`mx-auto h-8 w-20 text-center ${negative ? 'border-destructive/40 text-destructive focus-visible:ring-destructive/40' : ''}`} /></TableCell></TableRow>)}<TableRow className="border-t-2 font-semibold"><TableCell>Total</TableCell><TableCell className="text-center text-muted-foreground">{negative ? '-' : ''}{maxTotal}</TableCell><TableCell className={`text-center ${color}`}>{negative ? '-' : ''}{total}</TableCell></TableRow></TableBody></Table></div></div>;
}
