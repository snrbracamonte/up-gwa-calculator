'use client'

import { CalendarPlus, Sparkles } from 'lucide-react'
import {
  classifyHonors,
  formatGwa,
  formatYearLabel,
  getYearGwa,
  SEMESTER_ORDER,
  type Course,
  type ManualGwaEntry,
  type Year,
} from '@/lib/gwa'
import { SemesterSection } from '@/components/semester-section'
import { ManualGwaEntryField } from '@/components/manual-gwa-entry'
import { HonorBadge } from '@/components/honor-badge'
import { ACTION_BUTTON_CLASS } from '@/components/action-button-class'

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

// Switching/renaming/removing years happens through the year tabs above, so
// this component only needs the year's own contents: its GWA card (always
// present, formatted the same way as a semester card) and its semesters.
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
  const hasSemesters = year.semesters.length > 0
  const semestersEmpty = year.semesters.every((s) => s.courses.length === 0 && s.manualGwa === null)
  const canAddYearGwa = !isManual && semestersEmpty
  const label = formatYearLabel(year.label)

  return (
    <div className="space-y-3">
      {/* Year GWA card — always present, same format as a semester card. */}
      <div className="rounded-xl border border-border bg-secondary/40 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-serif text-base font-semibold text-foreground">{label}</h4>
          {!isManual && (
            <span className="text-xs text-muted-foreground">
              Year GWA <span className="font-semibold tabular-nums text-foreground">{formatGwa(gwa)}</span>
            </span>
          )}
        </div>

        {gwa !== null && (
          <div className="mt-2">
            <HonorBadge title={honor.title} range={honor.range} note={honor.note} tone={honor.tone} compact />
          </div>
        )}

        {isManual && year.manualGwa ? (
          <div className="mt-3">
            <ManualGwaEntryField
              idPrefix={year.id}
              label="Year GWA"
              value={year.manualGwa}
              onChange={onYearManualGwaChange}
              onRemove={onYearManualGwaRemove}
            />
          </div>
        ) : (
          !hasSemesters && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={onAddSemester} className={ACTION_BUTTON_CLASS}>
                <CalendarPlus className="size-4" aria-hidden="true" />
                Add semester
              </button>
              {canAddYearGwa && (
                <button type="button" onClick={onYearManualGwaAdd} className={ACTION_BUTTON_CLASS}>
                  <Sparkles className="size-4" aria-hidden="true" />
                  Add GWA
                </button>
              )}
            </div>
          )
        )}
      </div>

      {!isManual && hasSemesters && (
        <div className="space-y-3">
          {year.semesters.map((semester) => (
            <SemesterSection
              key={semester.id}
              semester={semester}
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
            <button type="button" onClick={onAddSemester} className={ACTION_BUTTON_CLASS}>
              <CalendarPlus className="size-4" aria-hidden="true" />
              Add semester
            </button>
          )}
        </div>
      )}
    </div>
  )
}
