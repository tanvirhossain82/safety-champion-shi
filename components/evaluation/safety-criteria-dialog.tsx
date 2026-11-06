'use client';

import { useEffect, useState } from 'react';
import { Loader as Loader2, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { logAudit } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface SafetyCriterion { id: string; key: string; label: string; max: number; }

interface SafetyCriteriaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  positive: SafetyCriterion[];
  negative: SafetyCriterion[];
  userEmail?: string | null;
  onSaved: () => Promise<void>;
}

type Draft = Record<string, { label: string; max: string }>;

function toDraft(criteria: SafetyCriterion[]): Draft {
  return Object.fromEntries(criteria.map((item) => [item.id, { label: item.label, max: String(item.max) }]));
}

export function SafetyCriteriaDialog({ open, onOpenChange, positive, negative, userEmail, onSaved }: SafetyCriteriaDialogProps) {
  const [draft, setDraft] = useState<Draft>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(toDraft([...positive, ...negative]));
      setError(null);
    }
  }, [open, positive, negative]);

  const updateDraft = (id: string, field: 'label' | 'max', value: string) => {
    setDraft((current) => ({ ...current, [id]: { ...current[id], [field]: value } }));
  };

  const handleSave = async () => {
    const changed: { original: SafetyCriterion; label: string; max: number }[] = [];
    for (const item of [...positive, ...negative]) {
      const values = draft[item.id];
      const label = values.label.trim();
      const max = Number(values.max);
      if (!label) { setError('Every category needs a name.'); return; }
      if (!Number.isFinite(max) || max < 0) { setError(`Max for "${label}" must be 0 or more.`); return; }
      if (label !== item.label || max !== item.max) changed.push({ original: item, label, max });
    }
    if (changed.length === 0) { onOpenChange(false); return; }

    setSaving(true);
    setError(null);
    try {
      for (const change of changed) {
        const { error: updateError } = await supabase
          .from('safety_criteria')
          .update({ label: change.label, max: change.max })
          .eq('id', change.original.id);
        if (updateError) throw updateError;
      }
      await logAudit('UPDATE', 'safety_criteria', null, `Updated safety score settings (${changed.length} categories)`, userEmail);
      await onSaved();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message ?? 'Could not save the score settings.');
    } finally {
      setSaving(false);
    }
  };

  const renderGroup = (title: string, criteria: SafetyCriterion[]) => (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="space-y-2">
        {criteria.map((item) => (
          <div key={item.id} className="grid grid-cols-[1fr_96px] gap-2">
            <Input aria-label={`${title} category name`} value={draft[item.id]?.label ?? ''} onChange={(event) => updateDraft(item.id, 'label', event.target.value)} />
            <Input aria-label={`${title} max points`} type="number" min={0} step="0.5" value={draft[item.id]?.max ?? ''} onChange={(event) => updateDraft(item.id, 'max', event.target.value)} className="text-center" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Safety Score Settings</DialogTitle>
          <DialogDescription>Change category names and maximum points. Existing evaluations keep their saved scores.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          {renderGroup('Positive', positive)}
          {renderGroup('Negative (Deduction)', negative)}
          {error && <Alert className="border-destructive/30 bg-destructive/5"><AlertDescription className="text-destructive">{error}</AlertDescription></Alert>}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="mr-2 h-4 w-4" />Save Settings</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
