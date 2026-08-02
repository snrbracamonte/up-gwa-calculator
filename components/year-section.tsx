'use client'

import { CalendarPlus, Sparkles } from 'lucide-react'
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

// No more "Year" card wrapper — a year's contents (its GWA section and
// semesters) render flat. Switching/renaming/removing years now happens
// entirely through the year tabs above, so this component doesn't need
// that chrome duplicated inside it.
export function YearSection({
  year,
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
  const canAddYearGwa = !isManual && semestersEmpty
  const showOrdinalSemesters = year.semesters.length > 1

  return (
    <div className="space-y-3">
      {!isManual && gwa !== null && (
        <p className="text-sm text-muted-foreground">
          Year GWA <span className="font-semibold tabular-nums text-foreground">{formatGwa(gwa)}</span>
        </p>
      )}

      {gwa !== null && (
        <HonorBadge title={honor.title} range={honor.range} note={honor.note} tone={honor.tone} compact />
      )}

      {(isManual || canAddYearGwa) && (
        <div className="rounded-xl border border-border bg-secondary/40 p-3 sm:p-4">
          <h4 className="font-serif text-base font-semibold text-foreground">Year GWA</h4>
          <div className="mt-3">
            {isManual && year.manualGwa ? (
              <ManualGwaEntryField
                idPrefix={year.id}
                label="Year GWA"
                value={year.manualGwa}
                onChange={onYearManualGwaChange}
                onRemove={onYearManualGwaRemove}
              />
            ) : (
              <button
                type="button"
                onClick={onYearManualGwaAdd}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-background px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-secondary"
              >
                <Sparkles className="size-4" aria-hidden="true" />
                Add GWA
              </button>
            )}
          </div>
        </div>
      )}

      {!isManual && (
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
    </div>
  )
}
