'use client'

import { Trash2 } from 'lucide-react'
import type { ManualGwaEntry } from '@/lib/gwa'

interface ManualGwaEntryFieldProps {
  idPrefix: string
  label: string
  value: ManualGwaEntry
  onChange: (patch: Partial<ManualGwaEntry>) => void
  onRemove: () => void
}

export function ManualGwaEntryField({
  idPrefix,
  label,
  value,
  onChange,
  onRemove,
}: ManualGwaEntryFieldProps) {
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-lg border border-accent/40 bg-accent/5 p-3">
      <div className="min-w-[110px] flex-1">
        <label className="text-xs font-medium text-muted-foreground" htmlFor={`${idPrefix}-gwa`}>
          {label}
        </label>
        <input
          id={`${idPrefix}-gwa`}
          type="number"
          inputMode="decimal"
          min="1"
          max="5"
          step="0.01"
          value={value.gwa}
          onChange={(e) => onChange({ gwa: e.target.value })}
          placeholder="e.g. 1.75"
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        />
      </div>
      <div className="min-w-[90px] flex-1">
        <label className="text-xs font-medium text-muted-foreground" htmlFor={`${idPrefix}-units`}>
          Units
        </label>
        <input
          id={`${idPrefix}-units`}
          type="number"
          inputMode="decimal"
          min="0"
          step="0.5"
          value={value.units}
          onChange={(e) => onChange({ units: e.target.value })}
          placeholder="e.g. 21"
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
