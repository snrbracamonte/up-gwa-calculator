'use client'

import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import type { ManualGwaEntry } from '@/lib/gwa'

interface ManualGwaEntryFieldProps {
  idPrefix: string
  /** Used as the GWA field's placeholder — e.g. "Semestral GWA" or "Yearly GWA". */
  label: string
  value: ManualGwaEntry
  onChange: (patch: Partial<ManualGwaEntry>) => void
  onRemove: () => void
}

const MAX_UNITS = 99

// Mirrors the course row's layout: units (with a stepper) first, then the
// GWA value (typing only), both equal width, with the remove button nested
// alongside the GWA field the same way the course row nests its trash icon
// next to the grade select.
export function ManualGwaEntryField({ idPrefix, label, value, onChange, onRemove }: ManualGwaEntryFieldProps) {
  function setUnits(digits: string) {
    onChange({ units: digits })
  }

  function stepUnits(delta: number) {
    const current = Number.parseInt(value.units, 10)
    const base = Number.isFinite(current) ? current : 0
    const next = Math.min(MAX_UNITS, Math.max(0, base + delta))
    setUnits(String(next))
  }

  return (
    <div className="grid grid-cols-12 items-center gap-2 rounded-lg border border-border bg-card p-2 sm:gap-3 sm:p-3">
      <div className="col-span-6">
        <label className="sr-only" htmlFor={`${idPrefix}-units`}>
          Units
        </label>
        <div className="relative">
          <input
            id={`${idPrefix}-units`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={2}
            value={value.units}
            onChange={(e) => setUnits(e.target.value.replace(/\D/g, '').slice(0, 2))}
            placeholder="Units"
            className="w-full rounded-md border border-input bg-background py-2 pl-2 pr-6 text-center text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          />
          <div className="absolute inset-y-0.5 right-0.5 flex w-5 flex-col overflow-hidden rounded-r-[5px]">
            <button
              type="button"
              onClick={() => stepUnits(1)}
              aria-label="Increase units"
              className="flex flex-1 items-center justify-center text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ChevronUp className="size-3" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => stepUnits(-1)}
              aria-label="Decrease units"
              className="flex flex-1 items-center justify-center border-t border-input text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ChevronDown className="size-3" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div className="col-span-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <label className="sr-only" htmlFor={`${idPrefix}-gwa`}>
            {label}
          </label>
          <input
            id={`${idPrefix}-gwa`}
            type="text"
            inputMode="decimal"
            value={value.gwa}
            onChange={(e) => onChange({ gwa: e.target.value })}
            placeholder={label}
            className="w-full min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-center text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          />
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${label}`}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}
