'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Trophy, Loader as Loader2, ArrowUp, ArrowDown, ArrowUpDown, Search, Calendar, Crown, Medal, Award, Users, Star, TrendingUp, Eye, Minus, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { fetchRankedEvaluations, RankedRow } from '@/lib/data';
import { DEPARTMENTS, MONTH_NAMES, HrCriteriaBreakdown, SafetyCriteriaBreakdown } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

type SortKey = 'rank' | 'name' | 'employee_code' | 'department' | 'department_marks' | 'hr_marks' | 'safety_marks' | 'negative_marks' | 'total_marks';
type SortDir = 'asc' | 'desc';

const HR_POSITIVE_CRITERIA: { key: string; label: string; max: number }[] = [
  { key: 'attendance', label: 'Attendance', max: 5 },
  { key: 'punctuality', label: 'Punctuality', max: 5 },
  { key: 'lunch_punch', label: 'Lunch Punch', max: 5 },
  { key: 'uniform', label: 'Uniform', max: 2 },
  { key: 'rules_regulation', label: 'Rules & Regulation', max: 5 },
  { key: 'leave_discipline', label: 'Leave Discipline', max: 3 },
];

const HR_NEGATIVE_CRITERIA: { key: string; label: string; max: number }[] = [
  { key: 'unauthorized_leave', label: 'Unauthorized Leave', max: 5 },
  { key: 'lunch_punch_miss', label: 'Lunch Punch Miss', max: 1 },
  { key: 'late_attendance', label: 'Late Attendance', max: 3 },
  { key: 'leave_indiscipline', label: 'Leave Indiscipline', max: 2 },
  { key: 'uniform_miss', label: 'Uniform', max: 2 },
  { key: 'warning_letter', label: 'Warning Letter', max: 5 },
  { key: 'show_cause', label: 'Show Cause', max: 3 },
  { key: 'misconduct', label: 'Misconduct', max: 10 },
];

const SAFETY_POSITIVE_CRITERIA: { key: string; label: string; max: number }[] = [
  { key: 'ppe', label: 'PPE', max: 5 },
  { key: 'safe_work_sop', label: 'Safe Work (SOP)', max: 5 },
  { key: 'housekeeping_5s', label: '5S & Housekeeping', max: 10 },
  { key: 'near_miss_reporting', label: 'Near Miss Reporting', max: 5 },
  { key: 'safety_meeting', label: 'Safety Meeting', max: 5 },
];

const SAFETY_NEGATIVE_CRITERIA: { key: string; label: string; max: number }[] = [
  { key: 'ppe', label: 'PPE', max: 3 },
  { key: 'unsafe_work_practice', label: 'Unsafe Work Practice', max: 3 },
  { key: 'housekeeping', label: 'Housekeeping', max: 2 },
  { key: 'safety_instruction', label: 'Safety Instruction', max: 5 },
  { key: 'chemical_spill', label: 'Chemical Spill', max: 5 },
  { key: 'fire_safety_rule', label: 'Fire Safety Rule', max: 5 },
  { key: 'accident_negligence', label: 'Accident (Negligence)', max: 10 },
  { key: 'machine_guard', label: 'Machine Guard', max: 2 },
];

const MAX_TOTAL = 100;

function getGrade(pct: number): { label: string; color: string } {
  if (pct >= 90) return { label: 'A+', color: 'text-green-600' };
  if (pct >= 80) return { label: 'A', color: 'text-green-600' };
  if (pct >= 70) return { label: 'B', color: 'text-chart-3' };
  if (pct >= 60) return { label: 'C', color: 'text-primary' };
  if (pct >= 50) return { label: 'D', color: 'text-orange-500' };
  return { label: 'F', color: 'text-destructive' };
}

function getInitials(name: string): string {
  return name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();
}

export function LeaderboardClient() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [rows, setRows] = useState<RankedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [evalTypeFilter, setEvalTypeFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(0);
  const [detailRow, setDetailRow] = useState<RankedRow | null>(null);
  const pageSize = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchRankedEvaluations(month, year);
      setRows(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let r = rows;
    const s = search.toLowerCase();
    if (s) r = r.filter((row) => row.name.toLowerCase().includes(s) || row.employee_code.toLowerCase().includes(s));
    if (deptFilter !== 'all') r = r.filter((row) => row.department === deptFilter);
    if (statusFilter !== 'all') r = r.filter((row) => row.status === statusFilter);
    if (gradeFilter !== 'all') r = r.filter((row) => {
      const pct = Math.round((Number(row.total_marks) / MAX_TOTAL) * 100);
      return getGrade(pct).label === gradeFilter;
    });
    if (evalTypeFilter !== 'all') {
      r = r.filter((row) => {
        if (evalTypeFilter === 'with_negative') return Number(row.negative_marks) > 0;
        if (evalTypeFilter === 'no_negative') return Number(row.negative_marks) === 0;
        if (evalTypeFilter === 'excellent') return Number(row.total_marks) >= 90;
        if (evalTypeFilter === 'needs_improvement') return Number(row.total_marks) < 60;
        return true;
      });
    }
    return r;
  }, [rows, search, deptFilter, gradeFilter, statusFilter, evalTypeFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortKey === 'employee_code') cmp = a.employee_code.localeCompare(b.employee_code);
      else if (sortKey === 'department') cmp = a.department.localeCompare(b.department);
      else if (sortKey === 'rank') cmp = a.rank - b.rank;
      else cmp = (a[sortKey] as number) - (b[sortKey] as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const activeFilterCount = [
    search.trim() !== '',
    deptFilter !== 'all',
    gradeFilter !== 'all',
    statusFilter !== 'all',
    evalTypeFilter !== 'all',
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSearch('');
    setDeptFilter('all');
    setGradeFilter('all');
    setStatusFilter('all');
    setEvalTypeFilter('all');
    setPage(0);
  };

  const pageCount = Math.ceil(sorted.length / pageSize) || 1;
  const currentData = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir(key === 'rank' || key === 'total_marks' ? 'asc' : 'asc'); }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowUpDown className="ml-1 inline h-3 w-3 opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp className="ml-1 inline h-3 w-3" /> : <ArrowDown className="ml-1 inline h-3 w-3" />;
  };

  const top3 = sorted.slice(0, 3);
  const totalEmployees = sorted.length;
  const averageScore = totalEmployees > 0
    ? (sorted.reduce((sum, r) => sum + Number(r.total_marks), 0) / totalEmployees).toFixed(2)
    : '0.00';

  const summaryCards = [
    { icon: Users, label: 'Total Employees', value: String(totalEmployees), color: 'text-primary', bg: 'bg-primary/10' },
    { icon: Crown, label: '1st Position', value: top3[0]?.name ?? '—', sub: top3[0] ? `${Number(top3[0].total_marks)} marks` : '', color: 'text-gold', bg: 'bg-gold/10' },
    { icon: Medal, label: '2nd Position', value: top3[1]?.name ?? '—', sub: top3[1] ? `${Number(top3[1].total_marks)} marks` : '', color: 'text-silver', bg: 'bg-silver/10' },
    { icon: Award, label: '3rd Position', value: top3[2]?.name ?? '—', sub: top3[2] ? `${Number(top3[2].total_marks)} marks` : '', color: 'text-bronze', bg: 'bg-bronze/10' },
    { icon: Star, label: 'Average Score', value: averageScore, sub: 'all employees', color: 'text-chart-3', bg: 'bg-chart-3/10' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
          <p className="text-sm text-muted-foreground">Monthly safety performance rankings</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={String(month)} onValueChange={(v) => { setMonth(Number(v)); setPage(0); }}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTH_NAMES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(v) => { setYear(Number(v)); setPage(0); }}>
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => now.getFullYear() - i).map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {summaryCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Card key={idx} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${card.bg}`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                    <p className="truncate text-sm font-bold">{card.value}</p>
                    {card.sub && <p className="truncate text-xs text-muted-foreground">{card.sub}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Top 3 Podium */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {top3.map((row) => {
            const config = {
              1: { label: 'Champion', icon: Crown, cls: 'border-gold/50 bg-gold/5', badge: 'bg-gold text-white', ring: 'ring-gold/30', scale: 'md:scale-[1.03]' },
              2: { label: 'Runner-up', icon: Medal, cls: 'border-silver/50 bg-silver/5', badge: 'bg-silver text-white', ring: 'ring-silver/30', scale: '' },
              3: { label: '3rd Position', icon: Award, cls: 'border-bronze/50 bg-bronze/5', badge: 'bg-bronze text-white', ring: 'ring-bronze/30', scale: '' },
            }[row.rank]!;
            const Icon = config.icon;
            const pct = Math.round((Number(row.total_marks) / MAX_TOTAL) * 100);
            const grade = getGrade(pct);
            return (
              <Card key={row.evaluation_id} className={`${config.cls} ${config.scale} ${config.ring} ring-2`}>
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full ${config.badge} shadow-sm`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-semibold">{config.label}</span>
                    </div>
                    <Badge variant="outline" className={`font-bold ${grade.color}`}>{grade.label}</Badge>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-20 w-20 border-4 border-border shadow-md">
                      <AvatarImage src={row.photo ?? undefined} />
                      <AvatarFallback className="bg-muted text-lg font-bold">{getInitials(row.name)}</AvatarFallback>
                    </Avatar>
                    <h3 className="mt-3 text-lg font-bold">{row.name}</h3>
                    <p className="text-xs text-muted-foreground">ID: {row.employee_code}</p>
                    <Badge variant="secondary" className="mt-1 text-xs">{row.department}</Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                    <div><p className="text-xs text-muted-foreground">Dept</p><p className="text-sm font-semibold">{Number(row.department_marks)}</p></div>
                    <div><p className="text-xs text-muted-foreground">HR</p><p className="text-sm font-semibold">{Number(row.hr_marks)}</p></div>
                    <div><p className="text-xs text-muted-foreground">Safety</p><p className="text-sm font-semibold">{Number(row.safety_marks)}</p></div>
                    <div><p className="text-xs text-muted-foreground">Neg</p><p className="text-sm font-semibold text-destructive">-{Number(row.negative_marks)}</p></div>
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-lg bg-background/60 px-4 py-2">
                    <span className="text-sm font-medium">Total</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{Number(row.total_marks)}</span>
                      <span className="text-sm text-muted-foreground">/ {MAX_TOTAL}</span>
                      <span className="text-sm font-semibold text-chart-3">{pct}%</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => setDetailRow(row)}>
                    <Eye className="mr-2 h-4 w-4" /> View Details
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <SlidersHorizontal className="h-4 w-4" /> Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-xs">{activeFilterCount} active</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by ID or Name..."
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Evaluation Period</Label>
              <div className="flex gap-2">
                <Select value={String(month)} onValueChange={(v) => { setMonth(Number(v)); setPage(0); }}>
                  <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTH_NAMES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={String(year)} onValueChange={(v) => { setYear(Number(v)); setPage(0); }}>
                  <SelectTrigger className="w-[90px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => now.getFullYear() - i).map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Department</Label>
              <Select value={deptFilter} onValueChange={(v) => { setDeptFilter(v); setPage(0); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Evaluation Type</Label>
              <Select value={evalTypeFilter} onValueChange={(v) => { setEvalTypeFilter(v); setPage(0); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="excellent">Excellent (90+)</SelectItem>
                  <SelectItem value="needs_improvement">Needs Improvement (&lt;60)</SelectItem>
                  <SelectItem value="with_negative">With Negative Marks</SelectItem>
                  <SelectItem value="no_negative">No Negative Marks</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Grade</Label>
              <Select value={gradeFilter} onValueChange={(v) => { setGradeFilter(v); setPage(0); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  <SelectItem value="A+">A+ (90+)</SelectItem>
                  <SelectItem value="A">A (80-89)</SelectItem>
                  <SelectItem value="B">B (70-79)</SelectItem>
                  <SelectItem value="C">C (60-69)</SelectItem>
                  <SelectItem value="D">D (50-59)</SelectItem>
                  <SelectItem value="F">F (&lt;50)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full" onClick={resetFilters} disabled={activeFilterCount === 0}>
                <RotateCcw className="mr-2 h-3.5 w-3.5" /> Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-primary" />
            {sorted.length} {sorted.length === 1 ? 'Entry' : 'Entries'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : currentData.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center text-center">
              <Trophy className="mb-2 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No evaluations for {MONTH_NAMES[month - 1]} {year}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer" onClick={() => toggleSort('rank')}><SortIcon column="rank" />Rank</TableHead>
                      <TableHead>Photo</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => toggleSort('employee_code')}><SortIcon column="employee_code" />Emp ID</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => toggleSort('name')}><SortIcon column="name" />Name</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => toggleSort('department')}><SortIcon column="department" />Department</TableHead>
                      <TableHead className="cursor-pointer text-right" onClick={() => toggleSort('department_marks')}><SortIcon column="department_marks" />Dept</TableHead>
                      <TableHead className="cursor-pointer text-right" onClick={() => toggleSort('hr_marks')}><SortIcon column="hr_marks" />HR</TableHead>
                      <TableHead className="cursor-pointer text-right" onClick={() => toggleSort('safety_marks')}><SortIcon column="safety_marks" />Safety</TableHead>
                      <TableHead className="cursor-pointer text-right" onClick={() => toggleSort('negative_marks')}><SortIcon column="negative_marks" />Negative</TableHead>
                      <TableHead className="cursor-pointer text-right" onClick={() => toggleSort('total_marks')}><SortIcon column="total_marks" />Total</TableHead>
                      <TableHead className="text-center">%</TableHead>
                      <TableHead className="text-center">Grade</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData.map((row) => {
                      const pct = Math.round((Number(row.total_marks) / MAX_TOTAL) * 100);
                      const grade = getGrade(pct);
                      return (
                        <TableRow key={row.evaluation_id} className="hover:bg-muted/50">
                          <TableCell><RankBadge rank={row.rank} /></TableCell>
                          <TableCell>
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={row.photo ?? undefined} />
                              <AvatarFallback className="bg-muted text-xs">{getInitials(row.name)}</AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell className="font-medium text-xs">{row.employee_code}</TableCell>
                          <TableCell className="font-medium">{row.name}</TableCell>
                          <TableCell><Badge variant="secondary" className="text-xs">{row.department}</Badge></TableCell>
                          <TableCell className="text-right">{Number(row.department_marks)}</TableCell>
                          <TableCell className="text-right">{Number(row.hr_marks)}</TableCell>
                          <TableCell className="text-right">{Number(row.safety_marks)}</TableCell>
                          <TableCell className="text-right text-destructive">{Number(row.negative_marks) > 0 ? `-${Number(row.negative_marks)}` : '0'}</TableCell>
                          <TableCell className="text-right font-bold">{Number(row.total_marks)}</TableCell>
                          <TableCell className="text-center text-sm font-medium">{pct}%</TableCell>
                          <TableCell className="text-center"><Badge variant="outline" className={`font-bold ${grade.color}`}>{grade.label}</Badge></TableCell>
                          <TableCell className="text-center"><Badge variant={row.status === 'Active' ? 'default' : 'secondary'} className="text-xs">{row.status}</Badge></TableCell>
                          <TableCell className="text-center">
                            <Button variant="ghost" size="sm" className="h-8" onClick={() => setDetailRow(row)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {pageCount > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">Page {page + 1} of {pageCount}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                    <Button variant="outline" size="sm" disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <DetailDialog row={detailRow} onClose={() => setDetailRow(null)} />
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gold text-xs font-bold text-white shadow-sm">{rank}</div>;
  if (rank === 2) return <div className="flex h-7 w-7 items-center justify-center rounded-full bg-silver text-xs font-bold text-white shadow-sm">{rank}</div>;
  if (rank === 3) return <div className="flex h-7 w-7 items-center justify-center rounded-full bg-bronze text-xs font-bold text-white shadow-sm">{rank}</div>;
  return <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">{rank}</div>;
}

function DetailDialog({ row, onClose }: { row: RankedRow | null; onClose: () => void }) {
  if (!row) return null;
  const pct = Math.round((Number(row.total_marks) / MAX_TOTAL) * 100);
  const grade = getGrade(pct);

  return (
    <Dialog open={!!row} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Evaluation Details
          </DialogTitle>
          <DialogDescription>
            {MONTH_NAMES[row.month - 1]} {row.year} · Rank #{row.rank}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Employee header */}
          <div className="flex items-center gap-4 rounded-lg border p-4">
            <Avatar className="h-16 w-16 border-2 border-border">
              <AvatarImage src={row.photo ?? undefined} />
              <AvatarFallback className="bg-muted text-lg font-bold">{getInitials(row.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-bold">{row.name}</h3>
              <p className="text-sm text-muted-foreground">ID: {row.employee_code} · {row.department}</p>
              {row.designation && <p className="text-xs text-muted-foreground">{row.designation}</p>}
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{Number(row.total_marks)}</div>
              <div className="text-xs text-muted-foreground">/ {MAX_TOTAL} ({pct}%)</div>
              <Badge variant="outline" className={`mt-1 font-bold ${grade.color}`}>{grade.label}</Badge>
            </div>
          </div>

          {/* Marks summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryBox label="Department" value={Number(row.department_marks)} max={45} color="text-primary" />
            <SummaryBox label="HR" value={Number(row.hr_marks)} max={25} color="text-chart-3" />
            <SummaryBox label="Safety" value={Number(row.safety_marks)} max={30} color="text-accent" />
            <SummaryBox label="Negative" value={-Number(row.negative_marks)} max={0} color="text-destructive" negative />
          </div>

          {/* HR Criteria Breakdown */}
          {row.hr_criteria && (
            <CriteriaBreakdown
              title="HR Criteria Breakdown"
              positiveCriteria={HR_POSITIVE_CRITERIA}
              negativeCriteria={HR_NEGATIVE_CRITERIA}
              data={row.hr_criteria}
            />
          )}

          {/* Safety Criteria Breakdown */}
          {row.safety_criteria && (
            <CriteriaBreakdown
              title="Safety Criteria Breakdown"
              positiveCriteria={SAFETY_POSITIVE_CRITERIA}
              negativeCriteria={SAFETY_NEGATIVE_CRITERIA}
              data={row.safety_criteria}
            />
          )}

          {/* Remarks */}
          {row.remarks && (
            <div className="rounded-lg border p-4">
              <p className="mb-1 text-sm font-semibold">Remarks</p>
              <p className="text-sm text-muted-foreground">{row.remarks}</p>
            </div>
          )}

          {!row.hr_criteria && !row.safety_criteria && (
            <div className="flex flex-col items-center justify-center rounded-lg border py-8 text-center">
              <Minus className="mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No individual criteria breakdown available for this evaluation.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SummaryBox({ label, value, max, color, negative = false }: { label: string; value: number; max: number; color: string; negative?: boolean }) {
  return (
    <div className="rounded-lg border p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {!negative && <p className="text-xs text-muted-foreground">/ {max}</p>}
    </div>
  );
}

function CriteriaBreakdown({
  title,
  positiveCriteria,
  negativeCriteria,
  data,
}: {
  title: string;
  positiveCriteria: { key: string; label: string; max: number }[];
  negativeCriteria: { key: string; label: string; max: number }[];
  data: HrCriteriaBreakdown | SafetyCriteriaBreakdown;
}) {
  const posTotal = data.positive ? Object.values(data.positive).reduce((s, v) => s + (Number(v) || 0), 0) : 0;
  const negTotal = data.negative ? Object.values(data.negative).reduce((s, v) => s + (Number(v) || 0), 0) : 0;
  const posMax = positiveCriteria.reduce((s, c) => s + c.max, 0);
  const negMax = negativeCriteria.reduce((s, c) => s + c.max, 0);

  return (
    <div className="rounded-lg border">
      <div className="border-b px-4 py-2">
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
        {/* Positive */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-chart-3">Positive</span>
            <Badge variant="secondary" className="text-xs text-chart-3">{posTotal} / {posMax}</Badge>
          </div>
          <div className="space-y-1">
            {positiveCriteria.map((c) => {
              const val = data.positive?.[c.key] ?? 0;
              return (
                <div key={c.key} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{c.label}</span>
                  <span className="font-medium">{Number(val)} / {c.max}</span>
                </div>
              );
            })}
          </div>
        </div>
        {/* Negative */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-destructive">Negative</span>
            <Badge variant="secondary" className="text-xs text-destructive">-{negTotal} / -{negMax}</Badge>
          </div>
          <div className="space-y-1">
            {negativeCriteria.map((c) => {
              const val = data.negative?.[c.key] ?? 0;
              return (
                <div key={c.key} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{c.label}</span>
                  <span className="font-medium text-destructive">-{Number(val)} / -{c.max}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
