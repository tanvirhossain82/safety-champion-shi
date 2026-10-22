'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileBarChart,
  FileDown,
  HardHat,
  Loader2,
  Pencil,
  Plus,
  Printer,
  Shield,
  ShieldAlert,
  Siren,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { fetchRankedEvaluations, RankedRow } from '@/lib/data';
import { DEPARTMENTS, IncidentReport, MONTH_NAMES } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';

type ReportId =
  | 'dashboard'
  | 'incident'
  | 'near-miss'
  | 'unsafe-act'
  | 'unsafe-condition'
  | 'inspection'
  | 'risk'
  | 'capa'
  | 'ppe'
  | 'analytics';

type ReportItem = {
  id: ReportId;
  label: string;
  description: string;
  icon: typeof Activity;
};

const REPORT_ITEMS: ReportItem[] = [
  { id: 'dashboard', label: 'Safety Dashboard', description: 'Monthly performance overview', icon: Activity },
  { id: 'incident', label: 'Incident & Accident', description: 'Incident and accident summary', icon: Siren },
  { id: 'near-miss', label: 'Near Miss', description: 'Near-miss reporting summary', icon: Eye },
  { id: 'unsafe-act', label: 'Unsafe Act', description: 'Unsafe act observations', icon: AlertTriangle },
  { id: 'unsafe-condition', label: 'Unsafe Condition', description: 'Unsafe condition observations', icon: ShieldAlert },
  { id: 'inspection', label: 'Safety Inspection', description: 'Inspection and compliance view', icon: ClipboardCheck },
  { id: 'risk', label: 'Risk Assessment', description: 'Risk assessment report', icon: Shield },
  { id: 'capa', label: 'CAPA / Corrective Action', description: 'Corrective action tracking', icon: CheckCircle2 },
  { id: 'ppe', label: 'PPE Compliance', description: 'PPE compliance summary', icon: HardHat },
  { id: 'analytics', label: 'Safety Analytics & Ranking', description: 'Ranking and trend analysis', icon: TrendingUp },
];

export function ReportsClient() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [selectedReport, setSelectedReport] = useState<ReportId>('dashboard');
  const [ranked, setRanked] = useState<RankedRow[]>([]);
  const [allEvaluations, setAllEvaluations] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rankData, evalRes, incidentRes] = await Promise.all([
        fetchRankedEvaluations(month, year),
        supabase
          .from('evaluations')
          .select('*, employees!inner(employee_id, name, department, photo)')
          .eq('month', month)
          .eq('year', year)
          .order('total_marks', { ascending: false }),
        supabase.from('incident_reports').select('*').order('occurred_at', { ascending: false }),
      ]);
      if (incidentRes.error) throw incidentRes.error;
      setRanked(rankData);
      setAllEvaluations(evalRes.data ?? []);
      setIncidents((incidentRes.data ?? []) as IncidentReport[]);
    } catch (error) {
      toast({ title: 'Report data could not be loaded', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const departmentSummary = useMemo(() => DEPARTMENTS.map((department) => {
    const rows = ranked.filter((row) => row.department === department);
    const average = rows.length ? rows.reduce((sum, row) => sum + Number(row.total_marks), 0) / rows.length : 0;
    return {
      department,
      evaluated: rows.length,
      average: Math.round(average * 10) / 10,
      highest: rows.length ? Math.max(...rows.map((row) => Number(row.total_marks))) : 0,
    };
  }), [ranked]);

  const activeItem = REPORT_ITEMS.find((item) => item.id === selectedReport) ?? REPORT_ITEMS[0];
  const ActiveIcon = activeItem.icon;

  const exportCsv = () => {
    const header = ['Rank', 'Employee ID', 'Name', 'Department', 'Department Marks', 'HR Marks', 'Safety Marks', 'Negative Marks', 'Total Marks'];
    const rows = ranked.map((row) => [
      row.rank,
      row.employee_code,
      row.name,
      row.department,
      row.department_marks,
      row.hr_marks,
      row.safety_marks,
      row.negative_marks,
      row.total_marks,
    ]);
    const csv = [header, ...rows].map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `safety-report-${year}-${month}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Report downloaded' });
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="print-hidden flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
            <FileBarChart className="h-4 w-4" /> Report Center
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Safety Reports</h1>
          <p className="text-sm text-muted-foreground">Choose a report format, review the results, and print or download it.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(month)} onValueChange={(value) => setMonth(Number(value))}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>{MONTH_NAMES.map((name, index) => <SelectItem key={name} value={String(index + 1)}>{name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(value) => setYear(Number(value))}>
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>{Array.from({ length: 5 }, (_, index) => now.getFullYear() - index).map((value) => <SelectItem key={value} value={String(value)}>{value}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="print-hidden rounded-2xl border bg-card p-3 shadow-sm sm:p-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {REPORT_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.id === selectedReport;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedReport(item.id)}
                className={`group flex min-h-[84px] items-center gap-3 rounded-xl px-3 py-3 text-left transition-all sm:min-h-[96px] ${active ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${active ? 'text-primary-foreground' : 'text-primary'}`} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{item.label}</span>
                  <span className={`mt-1 block text-[11px] leading-4 ${active ? 'text-primary-foreground/75' : 'text-muted-foreground'}`}>{item.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <section className="print-report rounded-2xl border bg-card shadow-sm">
        <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><ActiveIcon className="h-6 w-6" /></div>
            <div>
              <h2 className="text-xl font-bold">{activeItem.label}</h2>
              <p className="text-sm text-muted-foreground">{MONTH_NAMES[month - 1]} {year} · {activeItem.description}</p>
            </div>
          </div>
          <div className="print-hidden flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportCsv}><FileDown className="mr-2 h-4 w-4" /> Download CSV</Button>
            <Button onClick={printReport}><Printer className="mr-2 h-4 w-4" /> Print Report</Button>
          </div>
        </div>

        {loading ? (
          <div className="flex h-60 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <ReportContent reportId={selectedReport} ranked={ranked} evaluations={allEvaluations} departments={departmentSummary} incidents={incidents} onIncidentsChanged={load} />
        )}
      </section>
    </div>
  );
}

function ReportContent({ reportId, ranked, evaluations, departments, incidents, onIncidentsChanged }: { reportId: ReportId; ranked: RankedRow[]; evaluations: any[]; departments: { department: string; evaluated: number; average: number; highest: number }[]; incidents: IncidentReport[]; onIncidentsChanged: () => Promise<void> }) {
  if (reportId === 'incident') {
    return <IncidentReportPanel incidents={incidents} onChanged={onIncidentsChanged} />;
  }
  if (reportId === 'dashboard' || reportId === 'analytics') {
    return <RankingReport ranked={ranked} analytics={reportId === 'analytics'} />;
  }
  if (reportId === 'inspection' || reportId === 'risk' || reportId === 'capa' || reportId === 'ppe') {
    return <DepartmentReport departments={departments} title={REPORT_ITEMS.find((item) => item.id === reportId)?.label ?? 'Safety Report'} />;
  }
  return <ObservationReport reportId={reportId} ranked={ranked} evaluations={evaluations} />;
}

type IncidentFormValues = {
  incident_id: string;
  occurred_at: string;
  department: string;
  classification: string;
  severity: string;
  person_name: string;
  location: string;
  description: string;
  root_cause: string;
  lost_work_days: string;
  cost_impact: string;
  investigator_signature: string;
  status: IncidentReport['status'];
  corrective_action: string;
};

const INCIDENT_CLASSIFICATIONS = ['First Aid Case (FAC)', 'Medical Treatment Case (MTC)', 'Lost Time Injury (LTI)', 'Near Miss', 'Property Damage', 'Environmental Incident'];
const INCIDENT_SEVERITIES = ['Low (First Aid / Minor)', 'Medium (Medical Treatment)', 'High (Lost Time / Serious)', 'Critical (Fatality / Major)'];

function emptyIncidentForm(): IncidentFormValues {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  return {
    incident_id: `INC-${now.getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`,
    occurred_at: localDate,
    department: DEPARTMENTS[0],
    classification: INCIDENT_CLASSIFICATIONS[0],
    severity: INCIDENT_SEVERITIES[0],
    person_name: '',
    location: '',
    description: '',
    root_cause: '',
    lost_work_days: '0',
    cost_impact: '0',
    investigator_signature: '',
    status: 'Open',
    corrective_action: '',
  };
}

function IncidentReportPanel({ incidents, onChanged }: { incidents: IncidentReport[]; onChanged: () => Promise<void> }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<IncidentReport | null>(null);
  const [form, setForm] = useState<IncidentFormValues>(emptyIncidentForm);
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setEditing(null);
    setForm(emptyIncidentForm());
    setDialogOpen(true);
  };

  const openEdit = (incident: IncidentReport) => {
    setEditing(incident);
    setForm({
      incident_id: incident.incident_id,
      occurred_at: incident.occurred_at.slice(0, 16),
      department: incident.department,
      classification: incident.classification,
      severity: incident.severity,
      person_name: incident.person_name ?? '',
      location: incident.location ?? '',
      description: incident.description,
      root_cause: incident.root_cause,
      lost_work_days: String(incident.lost_work_days),
      cost_impact: String(incident.cost_impact),
      investigator_signature: incident.investigator_signature ?? '',
      status: incident.status,
      corrective_action: incident.corrective_action ?? '',
    });
    setDialogOpen(true);
  };

  const updateField = (field: keyof IncidentFormValues, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const saveIncident = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.description.trim() || !form.root_cause.trim()) {
      toast({ title: 'Description and root cause are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        incident_id: form.incident_id.trim(),
        occurred_at: new Date(form.occurred_at).toISOString(),
        department: form.department,
        classification: form.classification,
        severity: form.severity,
        person_name: form.person_name.trim() || null,
        location: form.location.trim() || null,
        description: form.description.trim(),
        root_cause: form.root_cause.trim(),
        lost_work_days: Number(form.lost_work_days) || 0,
        cost_impact: Number(form.cost_impact) || 0,
        investigator_signature: form.investigator_signature.trim() || null,
        status: form.status,
        corrective_action: form.corrective_action.trim() || null,
        updated_at: new Date().toISOString(),
      };
      const result = editing
        ? await supabase.from('incident_reports').update(payload).eq('id', editing.id)
        : await supabase.from('incident_reports').insert(payload);
      if (result.error) throw result.error;
      toast({ title: editing ? 'Incident report updated' : 'Incident report saved' });
      setDialogOpen(false);
      await onChanged();
    } catch (error) {
      toast({ title: 'Incident report could not be saved', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const deleteIncident = async (incident: IncidentReport) => {
    if (!window.confirm(`Delete ${incident.incident_id}?`)) return;
    const { error } = await supabase.from('incident_reports').delete().eq('id', incident.id);
    if (error) {
      toast({ title: 'Incident report could not be deleted', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Incident report deleted' });
    await onChanged();
  };

  return (
    <div className="p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div><h3 className="text-lg font-bold">Incident &amp; Accident Log &amp; Investigation Register</h3><p className="text-sm text-muted-foreground">Detailed root cause investigation, lost workdays impact, and corrective resolutions.</p></div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Report Incident (Format)</Button>
      </div>
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader><TableRow><TableHead>Incident ID</TableHead><TableHead>Date &amp; Time</TableHead><TableHead>Department</TableHead><TableHead>Classification</TableHead><TableHead>Severity</TableHead><TableHead>Brief Description</TableHead><TableHead>Root Cause</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Lost Days</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>{incidents.length ? incidents.map((incident) => <TableRow key={incident.id} className="align-top"><TableCell className="font-semibold">{incident.incident_id}</TableCell><TableCell className="whitespace-nowrap text-sm">{new Date(incident.occurred_at).toLocaleDateString()}<div className="text-xs text-muted-foreground">{new Date(incident.occurred_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div></TableCell><TableCell>{incident.department}</TableCell><TableCell className="min-w-[150px]">{incident.classification}</TableCell><TableCell><Badge variant="outline">{incident.severity.split(' ')[0]}</Badge></TableCell><TableCell className="max-w-[220px] text-sm">{incident.description}</TableCell><TableCell className="max-w-[220px] text-sm">{incident.root_cause}</TableCell><TableCell><Badge className={incident.status === 'Closed' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-amber-100 text-amber-700 hover:bg-amber-100'}>{incident.status}</Badge></TableCell><TableCell className="text-right font-semibold">{incident.lost_work_days}</TableCell><TableCell className="whitespace-nowrap text-right"><Button variant="ghost" size="icon" onClick={() => openEdit(incident)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteIncident(incident)}><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>) : <TableRow><TableCell colSpan={10} className="h-48 text-center"><Siren className="mx-auto mb-2 h-10 w-10 text-muted-foreground/40" /><p className="text-sm text-muted-foreground">No incident records yet. Use Report Incident (Format) to create the first register entry.</p></TableCell></TableRow>}</TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="print-form max-h-[92vh] max-w-5xl overflow-y-auto">
          <DialogHeader><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="font-mono text-emerald-700">EHS-FRM-001 (Rev.04)</Badge><span className="text-xs font-semibold tracking-wide text-muted-foreground">ISO 45001 / OSHA 1910 EHS STANDARD</span></div><DialogTitle className="text-2xl">Incident &amp; Accident Report Format</DialogTitle><DialogDescription>Complete the investigation details, then save or print this controlled safety document.</DialogDescription></DialogHeader>
          <form onSubmit={saveIncident} className="space-y-5">
            <div className="rounded-xl border-2 border-foreground/80 p-4"><div className="text-lg font-bold">ENTERPRISE SAFETY &amp; ENVIRONMENT MANAGEMENT SYSTEM</div><div className="text-sm text-muted-foreground">Standard Operating Governance Document · Industrial Plant EHS Division</div><div className="mt-4 border-t pt-3 text-center text-sm font-bold tracking-wide">INCIDENT &amp; ACCIDENT REPORT FORMAT</div></div>
            <div className="grid gap-4 md:grid-cols-3"><Field label="Incident Report ID *"><Input value={form.incident_id} onChange={(event) => updateField('incident_id', event.target.value)} required /></Field><Field label="Date & Time of Occurrence *"><Input type="datetime-local" value={form.occurred_at} onChange={(event) => updateField('occurred_at', event.target.value)} required /></Field><Field label="Department *"><NativeSelect value={form.department} options={DEPARTMENTS} onChange={(value) => updateField('department', value)} /></Field><Field label="Incident Classification *"><NativeSelect value={form.classification} options={INCIDENT_CLASSIFICATIONS} onChange={(value) => updateField('classification', value)} /></Field><Field label="Severity Rating *"><NativeSelect value={form.severity} options={INCIDENT_SEVERITIES} onChange={(value) => updateField('severity', value)} /></Field><Field label="Specific Plant Location / Bay"><Input placeholder="e.g. Production Unit B" value={form.location} onChange={(event) => updateField('location', event.target.value)} /></Field><Field label="Involved Person / Victim Name (if any)" className="md:col-span-2"><Input placeholder="e.g. Md. Tanvir Hossain" value={form.person_name} onChange={(event) => updateField('person_name', event.target.value)} /></Field></div>
            <Field label="Brief Description of Event & Sequence *"><Textarea className="min-h-28" placeholder="Describe exactly what happened, equipment involved, and immediate aftermath..." value={form.description} onChange={(event) => updateField('description', event.target.value)} required /></Field>
            <Field label="Root Cause Analysis (5-Why / Technical RCA) *"><Textarea className="min-h-28" placeholder="Identify the underlying root cause (e.g. missing guard, standard bypassed, lack of training, failed valve)..." value={form.root_cause} onChange={(event) => updateField('root_cause', event.target.value)} required /></Field>
            <div className="grid gap-4 md:grid-cols-3"><Field label="Lost Work Days"><Input type="number" min="0" step="1" value={form.lost_work_days} onChange={(event) => updateField('lost_work_days', event.target.value)} /></Field><Field label="Financial / Medical Cost Impact"><Input type="number" min="0" step="0.01" value={form.cost_impact} onChange={(event) => updateField('cost_impact', event.target.value)} /></Field><Field label="Lead Investigator Signature"><Input placeholder="Name and designation" value={form.investigator_signature} onChange={(event) => updateField('investigator_signature', event.target.value)} /></Field></div>
            <div className="grid gap-4 md:grid-cols-2"><Field label="Status"><NativeSelect value={form.status} options={['Open', 'Under Investigation', 'Closed']} onChange={(value) => updateField('status', value)} /></Field><Field label="Corrective Action / Resolution"><Input placeholder="Required corrective action" value={form.corrective_action} onChange={(event) => updateField('corrective_action', event.target.value)} /></Field></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => { document.body.classList.add('print-incident-form'); window.print(); window.setTimeout(() => document.body.classList.remove('print-incident-form'), 500); }}><Printer className="mr-2 h-4 w-4" /> Print / PDF</Button><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="mr-2 h-4 w-4" /> {editing ? 'Update Incident Report' : 'Submit & Log Incident Report'}</>}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return <div className={`space-y-2 ${className}`}><Label>{label}</Label>{children}</div>;
}

function NativeSelect({ value, options, onChange }: { value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>;
}

function RankingReport({ ranked, analytics }: { ranked: RankedRow[]; analytics: boolean }) {
  const rows = analytics ? ranked : ranked.slice(0, 10);
  return (
    <div className="p-5 sm:p-6">
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Summary label="Evaluated" value={ranked.length} />
        <Summary label="Average Score" value={ranked.length ? (ranked.reduce((sum, row) => sum + Number(row.total_marks), 0) / ranked.length).toFixed(1) : '0'} />
        <Summary label="Highest Score" value={ranked.length ? Math.max(...ranked.map((row) => Number(row.total_marks))) : 0} />
        <Summary label="Negative Marks" value={ranked.reduce((sum, row) => sum + Number(row.negative_marks), 0)} danger />
      </div>
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader><TableRow><TableHead>Rank</TableHead><TableHead>Employee</TableHead><TableHead>Department</TableHead><TableHead className="text-right">Dept</TableHead><TableHead className="text-right">HR</TableHead><TableHead className="text-right">Safety</TableHead><TableHead className="text-right">Negative</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
          <TableBody>{rows.length ? rows.map((row) => <TableRow key={row.evaluation_id}><TableCell><Badge variant={row.rank <= 3 ? 'default' : 'outline'}>{row.rank}</Badge></TableCell><TableCell><div className="font-medium">{row.name}</div><div className="text-xs text-muted-foreground">{row.employee_code}</div></TableCell><TableCell>{row.department}</TableCell><TableCell className="text-right">{Number(row.department_marks)}</TableCell><TableCell className="text-right">{Number(row.hr_marks)}</TableCell><TableCell className="text-right">{Number(row.safety_marks)}</TableCell><TableCell className="text-right text-destructive">-{Number(row.negative_marks)}</TableCell><TableCell className="text-right font-bold">{Number(row.total_marks)}</TableCell></TableRow>) : <EmptyRow />}</TableBody>
        </Table>
      </div>
    </div>
  );
}

function DepartmentReport({ departments, title }: { departments: { department: string; evaluated: number; average: number; highest: number }[]; title: string }) {
  return (
    <div className="p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-2 text-sm text-muted-foreground"><Users className="h-4 w-4" /> {title} by department</div>
      <div className="overflow-x-auto rounded-xl border"><Table><TableHeader><TableRow><TableHead>Department</TableHead><TableHead className="text-right">Evaluated</TableHead><TableHead className="text-right">Average Score</TableHead><TableHead className="text-right">Highest Score</TableHead></TableRow></TableHeader><TableBody>{departments.map((item) => <TableRow key={item.department}><TableCell className="font-medium">{item.department}</TableCell><TableCell className="text-right">{item.evaluated}</TableCell><TableCell className="text-right">{item.average}</TableCell><TableCell className="text-right font-semibold">{item.highest}</TableCell></TableRow>)}</TableBody></Table></div>
    </div>
  );
}

function ObservationReport({ reportId, ranked, evaluations }: { reportId: ReportId; ranked: RankedRow[]; evaluations: any[] }) {
  const label = REPORT_ITEMS.find((item) => item.id === reportId)?.label ?? 'Safety Report';
  return (
    <div className="p-5 sm:p-6">
      <div className="mb-5 rounded-xl border border-primary/20 bg-primary/5 p-4"><p className="text-sm font-medium">{label} format</p><p className="mt-1 text-sm text-muted-foreground">This report uses the selected month&apos;s evaluation records and is ready to print or download for review.</p></div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3"><Summary label="Records" value={evaluations.length} /><Summary label="Employees" value={ranked.length} /><Summary label="Average Score" value={ranked.length ? (ranked.reduce((sum, row) => sum + Number(row.total_marks), 0) / ranked.length).toFixed(1) : '0'} /></div>
      <div className="mt-5 overflow-x-auto rounded-xl border"><Table><TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Department</TableHead><TableHead className="text-right">Safety Score</TableHead><TableHead className="text-right">Negative</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader><TableBody>{ranked.length ? ranked.map((row) => <TableRow key={row.evaluation_id}><TableCell><div className="font-medium">{row.name}</div><div className="text-xs text-muted-foreground">{row.employee_code}</div></TableCell><TableCell>{row.department}</TableCell><TableCell className="text-right">{Number(row.safety_marks)}</TableCell><TableCell className="text-right text-destructive">-{Number(row.negative_marks)}</TableCell><TableCell className="text-right font-bold">{Number(row.total_marks)}</TableCell></TableRow>) : <EmptyRow />}</TableBody></Table></div>
    </div>
  );
}

function Summary({ label, value, danger = false }: { label: string; value: string | number; danger?: boolean }) {
  return <div className="rounded-xl border bg-muted/30 p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-xl font-bold ${danger ? 'text-destructive' : ''}`}>{value}</p></div>;
}

function EmptyRow() {
  return <TableRow><TableCell colSpan={8} className="h-32 text-center text-sm text-muted-foreground">No report data is available for this period.</TableCell></TableRow>;
}
