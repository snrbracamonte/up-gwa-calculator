'use client'

import { CalendarPlus, Sparkles, X } from 'lucide-react'
import {
  classifyHonors,
  formatGwa,
  getYearGwa,
  SEMESTER_ORDER,
  type Course,
  type ManualGwaEntry,
  type Year,
} from '@/lib/gwa'
import { SemesterSection } from '@/components/semester-section'
import { ManualGwaEntryField } from '@/components/manual-gwa-entry'
import { HonorBadge } from '@/components/honor-badge'

interface YearSectionProps {
  year: Year
  /** Whether to show the "Year" card wrapper/heading/GWA controls at all. */
  chromeVisible: boolean
  /** Whether to show an editable "Year N" number, vs. the bare "Year" label. */
  numbered: boolean
  canRemove: boolean
  onLabelChange: (label: string) => void
  /** Fired when the label input loses focus — years get re-sorted by number here. */
  onLabelBlur: () => void
  onRemove: () => void
  onAddSemester: () => void
  onSemesterRemove: (semesterId: string) => void
  onCourseAdd: (semesterId: string) => void
  onCourseChange: (semesterId: string, courseId: string, patch: Partial<Course>) => void
  onCourseRemove: (semesterId: string, courseId: string) => void
  onSemesterManualGwaAdd: (semesterId: string) => void
  onSemesterManualGwaChange: (semesterId: string, patch: Partial<ManualGwaEntry>) => void
  onSemesterManualGwaRemove: (semesterId: string) => void
  onYearManualGwaAdd: () => void
  onYearManualGwaChange: (patch: Partial<ManualGwaEntry>) => void
  onYearManualGwaRemove: () => void
}

export function YearSection({
  year,
  chromeVisible,
  numbered,
  canRemove,
  onLabelChange,
  onLabelBlur,
  onRemove,
  onAddSemester,
  onSemesterRemove,
  onCourseAdd,
  onCourseChange,
  onCourseRemove,
  onSemesterManualGwaAdd,
  onSemesterManualGwaChange,
  onSemesterManualGwaRemove,
  onYearManualGwaAdd,
  onYearManualGwaChange,
  onYearManualGwaRemove,
}: YearSectionProps) {
  const isManual = year.manualGwa !== null
  const gwa = getYearGwa(year)
  const honor = classifyHonors(gwa)
  const nextKind = SEMESTER_ORDER.find((kind) => !year.semesters.some((s) => s.kind === kind))
  const canAddSemester = !isManual && nextKind !== undefined
  const semestersEmpty = year.semesters.every((s) => s.courses.length === 0 && s.manualGwa === null)
  const canAddYearGwa = chromeVisible && !isManual && semestersEmpty
  const showOrdinalSemesters = year.semesters.length > 1

  const semesterList = (
    <div className="space-y-3">
      {year.semesters.map((semester) => (
        <SemesterSection
          key={semester.id}
          semester={semester}
          showOrdinal={showOrdinalSemesters}
          canRemove={year.semesters.length > 1}
          onRemove={() => onSemesterRemove(semester.id)}
          onCourseAdd={() => onCourseAdd(semester.id)}
          onCourseChange={(courseId, patch) => onCourseChange(semester.id, courseId, patch)}
          onCourseRemove={(courseId) => onCourseRemove(semester.id, courseId)}
          onManualGwaAdd={() => onSemesterManualGwaAdd(semester.id)}
          onManualGwaChange={(patch) => onSemesterManualGwaChange(semester.id, patch)}
          onManualGwaRemove={() => onSemesterManualGwaRemove(semester.id)}
        />
      ))}
    </div>
  )

  if (!chromeVisible) {
    return (
      <div className="space-y-3">
        {semesterList}
        {canAddSemester && (
          <button
            type="button"
            onClick={onAddSemester}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-background px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-secondary"
          >
            <CalendarPlus className="size-4" aria-hidden="true" />
            Add semester
          </button>
        )}
      </div>
    )
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <h3 className="font-serif text-lg font-semibold text-foreground">Year</h3>
          {numbered && (
            <input
              type="text"
              value={year.label}
              onChange={(e) => onLabelChange(e.target.value)}
              onBlur={onLabelBlur}
              aria-label="Year number"
              className="w-14 rounded-md border border-input bg-background px-2 py-1 text-center font-serif text-lg font-semibold text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            />
          )}
          {!isManual && (
            <span className="text-sm text-muted-foreground">
              Year GWA{' '}
              <span className="font-semibold tabular-nums text-foreground">{formatGwa(gwa)}</span>
            </span>
          )}
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove year"
            className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {gwa !== null && (
        <div className="mt-3">
          <HonorBadge title={honor.title} range={honor.range} note={honor.note} tone={honor.tone} compact />
        </div>
      )}

      {/* Year GWA is always its own section at the top. */}
      <div className="mt-4">
        {isManual && year.manualGwa ? (
          <ManualGwaEntryField
            idPrefix={year.id}
            label="Year GWA"
            value={year.manualGwa}
            onChange={onYearManualGwaChange}
            onRemove={onYearManualGwaRemove}
          />
        ) : (
          canAddYearGwa && (
            <button
              type="button"
              onClick={onYearManualGwaAdd}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-background px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-secondary"
            >
              <Sparkles className="size-4" aria-hidden="true" />
              Add GWA
            </button>
          )
        )}
      </div>

      {/* Semesters live below the Year GWA section. */}
      {!isManual && (
        <div className="mt-3 space-y-3">
          {semesterList}
          {canAddSemester && (
            <button
              type="button"
              onClick={onAddSemester}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-background px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-secondary"
            >
              <CalendarPlus className="size-4" aria-hidden="true" />
              Add semester
            </button>
          )}
        </div>
      )}
    </section>
  )
}
