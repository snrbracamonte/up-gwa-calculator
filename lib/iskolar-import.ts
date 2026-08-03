// Parses a grades table copy-pasted from
// https://iskolar.upm.edu.ph/student/classes/grades. When copied from an
// actual HTML table, each row's cells are tab-separated, in this fixed
// column order:
//   Class Number | Subject Code | Section | Instructor | Grade Base |
//   Units | Grade | Grade Points | Remarks
// The header row may or may not be included. Only Subject Code, Units, and
// Grade are used — everything else is ignored. If both Grade and Grade
// Points are blank (grades not posted yet), only the subject code and units
// are extracted, leaving the grade blank for the person to fill in later.

import { GRADE_OPTIONS, type CourseType, type GradeValue } from './gwa'

export interface IskolarCourse {
  name: string
  units: number
  grade: GradeValue | ''
  type: CourseType
}

export interface IskolarImportResult {
  courses: IskolarCourse[]
  skipped: number
}

const HEADER_HINTS = [
  'class number',
  'subject code',
  'section',
  'instructor',
  'grade base',
  'units',
  'grade points',
  'remarks',
]

const KNOWN_GRADES = new Set<string>(GRADE_OPTIONS.map((g) => g.value))

function inferType(code: string): CourseType {
  if (/^PE\b/i.test(code)) return 'pe'
  if (/^NSTP\b/i.test(code)) return 'nstp'
  if (/^GE\b/i.test(code)) return 'ge'
  if (/^Elective\b/i.test(code)) return 'elective'
  return 'major'
}

/** Split a pasted row into cells — tab-separated if it's an actual table
 * paste, falling back to runs of 2+ spaces for plain-text pastes. */
function splitRow(line: string): string[] {
  if (line.includes('\t')) return line.split('\t')
  return line.split(/\s{2,}/)
}

function looksLikeHeader(fields: string[]): boolean {
  const joined = fields.join(' ').toLowerCase()
  const hits = HEADER_HINTS.filter((hint) => joined.includes(hint)).length
  return hits >= 3
}

/** Normalizes a raw grade cell ("1.00", "1", "INC") to a known GradeValue, or '' if unrecognized. */
function normalizeGrade(raw: string): GradeValue | '' {
  const trimmed = raw.trim().toUpperCase()
  if (!trimmed) return ''
  if (KNOWN_GRADES.has(trimmed)) return trimmed as GradeValue

  const num = Number.parseFloat(trimmed)
  if (Number.isFinite(num)) {
    const formatted = num.toFixed(2)
    if (KNOWN_GRADES.has(formatted)) return formatted as GradeValue
  }
  return ''
}

export function parseIskolarGrades(text: string): IskolarImportResult {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  const courses: IskolarCourse[] = []
  let skipped = 0

  for (const line of lines) {
    const fields = splitRow(line).map((f) => f.trim())
    if (looksLikeHeader(fields)) continue

    // Fixed layout: 0 Class Number, 1 Subject Code, 2 Section, 3 Instructor,
    // 4 Grade Base, 5 Units, 6 Grade, 7 Grade Points, 8 Remarks
    const subjectCode = fields[1] ?? ''
    const unitsText = fields[5] ?? ''
    const gradeText = fields[6] ?? ''
    const gradePointsText = fields[7] ?? ''

    const units = Number.parseFloat(unitsText)
    if (fields.length < 6 || !subjectCode || !Number.isFinite(units) || units <= 0) {
      skipped += 1
      continue
    }

    const hasGradeData = gradeText.trim() !== '' || gradePointsText.trim() !== ''
    const grade = hasGradeData ? normalizeGrade(gradeText) : ''

    courses.push({ name: subjectCode, units, grade, type: inferType(subjectCode) })
  }

  return { courses, skipped }
}
