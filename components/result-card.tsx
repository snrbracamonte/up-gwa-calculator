'use client'

import { GraduationCap } from 'lucide-react'
import { classifyHonors, COURSE_TYPE_MAP, formatGwa, type Contribution, type CourseType, type GwaResult } from '@/lib/gwa'
import { HonorBadge } from '@/components/honor-badge'

interface ResultCardProps {
  cumulative: Contribution & { gwa: number | null }
  courseStats: GwaResult
  manualEntryCount: number
}

export function ResultCard({ cumulative, courseStats, manualEntryCount }: ResultCardProps) {
  const honor = classifyHonors(cumulative.gwa)

  const excludedParts: string[] = []
  for (const [type, count] of Object.entries(courseStats.excludedByType) as [CourseType, number][]) {
    const label = COURSE_TYPE_MAP[type]?.short ?? type
    excludedParts.push(`${count} ${label}`)
  }
  if (courseStats.excludedByGrade > 0) {
    excludedParts.push(`${courseStats.excludedByGrade} INC/DRP`)
  }
  const excludedBreakdown = excludedParts.join(', ')

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-col items-center gap-1 bg-primary px-5 py-7 text-center text-primary-foreground">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-primary-foreground/80">
          <GraduationCap className="size-4" aria-hidden="true" />
          <span>General Weighted Average</span>
        </div>
        <p className="font-serif text-5xl font-semibold tabular-nums leading-none">
          {formatGwa(cumulative.gwa)}
        </p>
        <p className="mt-1 text-sm text-primary-foreground/80">
          {cumulative.units > 0 ? `Across ${cumulative.units} units` : 'Waiting for grades'}
        </p>
      </div>

      <div className="space-y-4 p-5">
        <HonorBadge title={honor.title} range={honor.range} note={honor.note} tone={honor.tone} />

        <dl className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-lg bg-secondary p-3">
            <dt className="text-xs text-muted-foreground">Units</dt>
            <dd className="mt-1 font-serif text-xl font-semibold tabular-nums text-foreground">
              {cumulative.units}
            </dd>
          </div>
          <div className="rounded-lg bg-secondary p-3">
            <dt className="text-xs text-muted-foreground">Courses</dt>
            <dd className="mt-1 font-serif text-xl font-semibold tabular-nums text-foreground">
              {courseStats.countedCourses}
            </dd>
          </div>
        </dl>

        {excludedBreakdown && (
          <p className="text-pretty text-xs leading-relaxed text-muted-foreground">
            {`Excluded from GWA: ${excludedBreakdown}.`}
          </p>
        )}

        {manualEntryCount > 0 && (
          <p className="text-pretty text-xs leading-relaxed text-muted-foreground">
            {`Includes ${manualEntryCount} manually entered GWA${manualEntryCount === 1 ? '' : 's'}.`}
          </p>
        )}

        <p className="text-pretty text-xs leading-relaxed text-muted-foreground">
          GWA is the sum of (grade × units) divided by total units. Grades of INC and DRP are
          excluded from the computation. Latin honors also require meeting residency and unit
          requirements set by your college.
        </p>
      </div>
    </div>
  )
}
