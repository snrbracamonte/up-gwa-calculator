// University of the Philippines grading scale and GWA helpers.

export type GradeValue =
  | '1.00'
  | '1.25'
  | '1.50'
  | '1.75'
  | '2.00'
  | '2.25'
  | '2.50'
  | '2.75'
  | '3.00'
  | '4.00'
  | '5.00'
  | 'INC'
  | 'DRP'

export interface GradeOption {
  value: GradeValue
  numeric: number | null
  label: string
  description: string
}

export const GRADE_OPTIONS: GradeOption[] = [
  { value: '1.00', numeric: 1.0, label: '1.00', description: 'Excellent' },
  { value: '1.25', numeric: 1.25, label: '1.25', description: 'Excellent' },
  { value: '1.50', numeric: 1.5, label: '1.50', description: 'Very Good' },
  { value: '1.75', numeric: 1.75, label: '1.75', description: 'Very Good' },
  { value: '2.00', numeric: 2.0, label: '2.00', description: 'Good' },
  { value: '2.25', numeric: 2.25, label: '2.25', description: 'Good' },
  { value: '2.50', numeric: 2.5, label: '2.50', description: 'Satisfactory' },
  { value: '2.75', numeric: 2.75, label: '2.75', description: 'Satisfactory' },
  { value: '3.00', numeric: 3.0, label: '3.00', description: 'Passing' },
  { value: '4.00', numeric: 4.0, label: '4.00', description: 'Conditional' },
  { value: '5.00', numeric: 5.0, label: '5.00', description: 'Failed' },
  { value: 'INC', numeric: null, label: 'INC', description: 'Incomplete' },
  { value: 'DRP', numeric: null, label: 'DRP', description: 'Dropped' },
]

export const GRADE_MAP: Record<GradeValue, GradeOption> = GRADE_OPTIONS.reduce(
  (acc, option) => {
    acc[option.value] = option
    return acc
  },
  {} as Record<GradeValue, GradeOption>,
)

export type CourseType = 'major' | 'elective' | 'ge' | 'pe' | 'nstp'

export interface CourseTypeOption {
  value: CourseType
  label: string
  short: string
  excluded: boolean
}

export const COURSE_TYPE_OPTIONS: CourseTypeOption[] = [
  { value: 'major', label: 'Major', short: 'Major', excluded: false },
  { value: 'elective', label: 'Elective', short: 'Elective', excluded: false },
  { value: 'ge', label: 'General Elective (GE)', short: 'GE', excluded: false },
  { value: 'pe', label: 'Physical Education (PE)', short: 'PE', excluded: true },
  { value: 'nstp', label: 'NSTP', short: 'NSTP', excluded: true },
]

export const COURSE_TYPE_MAP: Record<CourseType, CourseTypeOption> =
  COURSE_TYPE_OPTIONS.reduce(
    (acc, option) => {
      acc[option.value] = option
      return acc
    },
    {} as Record<CourseType, CourseTypeOption>,
  )

export interface Course {
  id: string
  name: string
  units: string
  grade: GradeValue | ''
  /** '' means "not chosen yet" — the placeholder option, deliberately unpickable once set. */
  type: CourseType | ''
}

/** A manually entered aggregate GWA, used in place of a list of courses. */
export interface ManualGwaEntry {
  gwa: string
  units: string
}

export type SemesterKind = 'first' | 'second' | 'midyear'

// The order semesters escalate through as "Add Semester" is clicked.
export const SEMESTER_ORDER: SemesterKind[] = ['first', 'second', 'midyear']

export const SEMESTER_LABELS: Record<SemesterKind, string> = {
  first: '1st Semester',
  second: '2nd Semester',
  midyear: 'Midyear',
}

export interface Semester {
  id: string
  kind: SemesterKind
  courses: Course[]
  manualGwa: ManualGwaEntry | null
}

export interface Year {
  id: string
  /** User-editable label, e.g. "1", "2" — shown as "Year {label}". */
  label: string
  semesters: Semester[]
  manualGwa: ManualGwaEntry | null
}

export function flattenCourses(years: Year[]): Course[] {
  return years.flatMap((year) => year.semesters.flatMap((sem) => sem.courses))
}

export interface GwaResult {
  gwa: number | null
  totalUnits: number
  countedUnits: number
  countedCourses: number
  excludedCourses: number
  excludedByType: Partial<Record<CourseType, number>>
  excludedByGrade: number
}

export function computeGwa(courses: Course[]): GwaResult {
  let weightedSum = 0
  let countedUnits = 0
  let totalUnits = 0
  let countedCourses = 0
  let excludedCourses = 0
  const excludedByType: Partial<Record<CourseType, number>> = {}
  let excludedByGrade = 0

  for (const course of courses) {
    const { type, grade } = course
    const units = Number.parseFloat(course.units)
    if (!Number.isFinite(units) || units <= 0 || grade === '' || type === '') {
      continue
    }

    totalUnits += units

    if (COURSE_TYPE_MAP[type]?.excluded) {
      excludedCourses += 1
      excludedByType[type] = (excludedByType[type] ?? 0) + 1
      continue
    }

    const numeric = GRADE_MAP[grade]?.numeric ?? null

    if (numeric === null) {
      excludedCourses += 1
      excludedByGrade += 1
      continue
    }

    weightedSum += numeric * units
    countedUnits += units
    countedCourses += 1
  }

  return {
    gwa: countedUnits > 0 ? weightedSum / countedUnits : null,
    totalUnits,
    countedUnits,
    countedCourses,
    excludedCourses,
    excludedByType,
    excludedByGrade,
  }
}

export interface Contribution {
  weightedSum: number
  units: number
}

function manualContribution(entry: ManualGwaEntry | null): Contribution | null {
  if (!entry) return null
  const gwa = Number.parseFloat(entry.gwa)
  const units = Number.parseFloat(entry.units)
  if (!Number.isFinite(gwa) || !Number.isFinite(units) || gwa <= 0 || units <= 0) {
    return { weightedSum: 0, units: 0 }
  }
  return { weightedSum: gwa * units, units }
}

export function semesterContribution(sem: Semester): Contribution {
  const manual = manualContribution(sem.manualGwa)
  if (manual) return manual
  const result = computeGwa(sem.courses)
  return { weightedSum: (result.gwa ?? 0) * result.countedUnits, units: result.countedUnits }
}

export function yearContribution(year: Year): Contribution {
  const manual = manualContribution(year.manualGwa)
  if (manual) return manual
  return year.semesters.reduce(
    (acc, sem) => {
      const c = semesterContribution(sem)
      return { weightedSum: acc.weightedSum + c.weightedSum, units: acc.units + c.units }
    },
    { weightedSum: 0, units: 0 },
  )
}

export function getSemesterGwa(sem: Semester): number | null {
  const c = semesterContribution(sem)
  return c.units > 0 ? c.weightedSum / c.units : null
}

export function getYearGwa(year: Year): number | null {
  const c = yearContribution(year)
  return c.units > 0 ? c.weightedSum / c.units : null
}

export function computeCumulativeGwa(years: Year[]): Contribution & { gwa: number | null } {
  const total = years.reduce(
    (acc, y) => {
      const c = yearContribution(y)
      return { weightedSum: acc.weightedSum + c.weightedSum, units: acc.units + c.units }
    },
    { weightedSum: 0, units: 0 },
  )
  return { ...total, gwa: total.units > 0 ? total.weightedSum / total.units : null }
}

export interface HonorInfo {
  title: string
  range: string
  tone: 'summa' | 'magna' | 'cum' | 'dean' | 'none'
  note: string
}

// Latin honors thresholds per UP's General Catalogue. Used for full-year and
// overall cumulative GWA.
export function classifyHonors(gwa: number | null): HonorInfo {
  if (gwa === null) {
    return {
      title: 'No grades yet',
      range: '',
      tone: 'none',
      note: 'Add courses or a GWA to see your standing.',
    }
  }

  if (gwa <= 1.2) {
    return {
      title: 'Summa Cum Laude',
      range: '1.00 – 1.20',
      tone: 'summa',
      note: 'Highest Latin honors. Outstanding academic achievement.',
    }
  }

  if (gwa <= 1.45) {
    return {
      title: 'Magna Cum Laude',
      range: '1.201 – 1.45',
      tone: 'magna',
      note: 'High Latin honors. Excellent academic standing.',
    }
  }

  if (gwa <= 1.75) {
    return {
      title: 'Cum Laude',
      range: '1.451 – 1.75',
      tone: 'cum',
      note: 'Latin honors. Very good academic standing.',
    }
  }

  if (gwa <= 3.0) {
    return {
      title: 'Good Standing',
      range: '1.751 – 3.00',
      tone: 'dean',
      note: 'Passing GWA. Below the Latin honors cutoff of 1.75.',
    }
  }

  return {
    title: 'Below Passing',
    range: 'above 3.00',
    tone: 'none',
    note: 'A GWA above 3.00 does not meet the general passing standard.',
  }
}

export interface ScholarInfo {
  title: string
  range: string
  tone: 'university' | 'college' | 'none'
  note: string
}

// Honorific scholarship thresholds (University Scholar / College Scholar),
// used per-semester. Exact policy varies by college — kept approximate.
export function classifySemesterHonor(gwa: number | null): ScholarInfo {
  if (gwa === null) {
    return {
      title: 'No grades yet',
      range: '',
      tone: 'none',
      note: 'Add courses or a semester GWA to see scholarship eligibility.',
    }
  }

  if (gwa <= 1.45) {
    return {
      title: 'University Scholar',
      range: '1.00 – 1.45',
      tone: 'university',
      note: 'Typically requires no grade below 2.0 on a full load — confirm the exact policy with your college.',
    }
  }

  if (gwa <= 1.75) {
    return {
      title: 'College Scholar',
      range: '1.451 – 1.75',
      tone: 'college',
      note: 'Typically requires no grade below 2.0 — confirm the exact policy with your college.',
    }
  }

  return {
    title: 'Not within scholar range',
    range: 'above 1.75',
    tone: 'none',
    note: 'Semestral honorific scholarships generally require a GWA of 1.75 or better.',
  }
}

export function formatGwa(gwa: number | null): string {
  if (gwa === null) return '—'
  return gwa.toFixed(3)
}
