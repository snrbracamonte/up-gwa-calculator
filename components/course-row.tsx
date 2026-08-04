'use client'

import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { COURSE_TYPE_OPTIONS, GRADE_OPTIONS, type Course, type CourseType, type GradeValue } from '@/lib/gwa'

interface CourseRowProps {
  course: Course
  index: number
  canRemove: boolean
  onChange: (id: string, patch: Partial<Course>) => void
  onRemove: (id: string) => void
}

const MAX_UNITS = 99

export function CourseRow({ course, index, canRemove, onChange, onRemove }: CourseRowProps) {
  function setUnits(digits: string) {
    onChange(course.id, { units: digits })
  }

  function stepUnits(delta: number) {
    const current = Number.parseInt(course.units, 10)
    const base = Number.isFinite(current) ? current : 0
    const next = Math.min(MAX_UNITS, Math.max(0, base + delta))
    setUnits(String(next))
  }

  return (
    <div className="grid grid-cols-12 items-center gap-2 rounded-lg border border-border bg-card p-2 sm:gap-3 sm:p-3">
      <div className="col-span-12 sm:col-span-6">
        <label className="sr-only" htmlFor={`name-${course.id}`}>
          {`Course ${index + 1} name`}
        </label>
        <input
          id={`name-${course.id}`}
          type="text"
          value={course.name}
          onChange={(e) => onChange(course.id, { name: e.target.value })}
          placeholder={`Course ${index + 1}`}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        />
      </div>

      <div className="col-span-2 sm:col-span-1">
        <label className="sr-only" htmlFor={`units-${course.id}`}>
          {`Course ${index + 1} units`}
        </label>
        <div className="relative">
          <input
            id={`units-${course.id}`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={2}
            value={course.units}
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

      <div className="col-span-4 sm:col-span-2">
        <label className="sr-only" htmlFor={`type-${course.id}`}>
          {`Course ${index + 1} type`}
        </label>
        <div className="relative">
          <select
            id={`type-${course.id}`}
            value={course.type}
            onChange={(e) => onChange(course.id, { type: e.target.value as CourseType })}
            title="Course type (PE and NSTP are excluded from GWA)"
            className="w-full appearance-none rounded-md border border-input bg-background py-2 pl-2 pr-7 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <option value="" disabled>
              Course Type
            </option>
            {COURSE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.short}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="col-span-6 sm:col-span-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <label className="sr-only" htmlFor={`grade-${course.id}`}>
            {`Course ${index + 1} grade`}
          </label>
          <div className="relative min-w-0 flex-1">
            <select
              id={`grade-${course.id}`}
              value={course.grade}
              onChange={(e) => onChange(course.id, { grade: e.target.value as GradeValue | '' })}
              className="w-full appearance-none rounded-md border border-input bg-background py-2 pl-2 pr-7 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <option value="" disabled>
                Grade
              </option>
              {GRADE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {`${option.label} (${option.description})`}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
          </div>

          <button
            type="button"
            onClick={() => onRemove(course.id)}
            disabled={!canRemove}
            aria-label={`Remove course ${index + 1}`}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}
