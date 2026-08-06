'use client'

import { Plus, Trash2 } from 'lucide-react'
import {
  classifySemesterHonor,
  computeGwa,
  formatGwa,
  getSemesterGwa,
  SEMESTER_LABELS,
  type Course,
  type ManualGwaEntry,
  type Semester,
} from '@/lib/gwa'
import { CourseRow } from '@/components/course-row'
import { ManualGwaEntryField } from '@/components/manual-gwa-entry'
import { HonorBadge } from '@/components/honor-badge'
import { ACTION_BUTTON_CLASS } from '@/components/action-button-class'
import { IskolarImportButton } from '@/components/iskolar-import-button'
import type { IskolarCourse } from '@/lib/iskolar-import'

interface SemesterSectionProps {
  semester: Semester
  canRemove: boolean
  onCourseChange: (courseId: string, patch: Partial<Course>) => void
  onCourseRemove: (courseId: string) => void
  onCourseAdd: () => void
  onManualGwaAdd: () => void
  onManualGwaChange: (patch: Partial<ManualGwaEntry>) => void
  onManualGwaRemove: () => void
  onImportIskolar: (courses: IskolarCourse[]) => void
  onRemove: () => void
}

export function SemesterSection({
  semester,
  canRemove,
  onCourseChange,
  onCourseRemove,
  onCourseAdd,
  onManualGwaAdd,
  onManualGwaChange,
  onManualGwaRemove,
  onImportIskolar,
  onRemove,
}: SemesterSectionProps) {
  const label = SEMESTER_LABELS[semester.kind]
  const isManual = semester.manualGwa !== null
  const hasCourses = semester.courses.length > 0
  const gwa = getSemesterGwa(semester)
  const scholar = classifySemesterHonor(gwa)
  const stats = computeGwa(semester.courses)

  function handleRemoveClick() {
    const hasContent = semester.courses.length > 0 || semester.manualGwa !== null
    if (hasContent && !window.confirm(`Delete ${label} and all its courses? This can't be undone.`)) {
      return
    }
    onRemove()
  }

  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-serif text-base font-semibold text-foreground">{label}</h4>
        {canRemove && (
          <button
            type="button"
            onClick={handleRemoveClick}
            aria-label={`Remove ${label}`}
            className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {gwa !== null && scholar.tone !== 'none' && (
        <div className="mt-2">
          <HonorBadge title={scholar.title} range={scholar.range} note={scholar.note} tone={scholar.tone} compact />
        </div>
      )}

      {isManual && semester.manualGwa ? (
        <div className="mt-3">
          <ManualGwaEntryField
            idPrefix={semester.id}
            label="Semestral GWA"
            value={semester.manualGwa}
            onChange={onManualGwaChange}
            onRemove={onManualGwaRemove}
          />
        </div>
      ) : (
        <>
          {hasCourses && (
            <div className="mt-3 space-y-2">
              {semester.courses.map((course, index) => (
                <CourseRow
                  key={course.id}
                  course={course}
                  index={index}
                  canRemove
                  onChange={(_, patch) => onCourseChange(course.id, patch)}
                  onRemove={() => onCourseRemove(course.id)}
                />
              ))}
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={onCourseAdd} className={ACTION_BUTTON_CLASS}>
              <Plus className="size-4" aria-hidden="true" />
              Add course
            </button>
            <IskolarImportButton onImport={onImportIskolar} />
            {!hasCourses && (
              <button type="button" onClick={onManualGwaAdd} className={ACTION_BUTTON_CLASS}>
                <Plus className="size-4" aria-hidden="true" />
                Add Semestral GWA
              </button>
            )}
          </div>

          {hasCourses && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>
                Units <span className="font-semibold tabular-nums text-foreground">{stats.countedUnits}</span>
              </span>
              <span>
                Semestral GWA{' '}
                <span className="font-semibold tabular-nums text-foreground">{formatGwa(gwa)}</span>
              </span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
