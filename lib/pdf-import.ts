// Imports a curriculum PDF (a checklist/prospectus laid out as one table per
// semester: Subject | Units | Hrs/Wk | Prerequisite) and turns it into the
// app's Year/Semester/Course structure. Grades are left blank since a
// curriculum sheet has no grades — the student fills those in afterward.
//
// This is a heuristic, position-based parser (it reconstructs table columns
// from each row's x-coordinates, using the header row of each table to find
// the column boundaries), tuned for the common "UP-style" checklist layout.
// It will not perfectly handle every curriculum PDF, so the caller should let
// the person review/edit the imported courses before relying on the result.

import { type Course, type CourseType, type Semester, type SemesterKind, type Year } from './gwa'

export interface ImportedYear {
  yearLabel: string
  semesters: {
    kind: SemesterKind
    label: string
    courses: { name: string; units: number; type: CourseType }[]
  }[]
}

export interface ImportResult {
  years: ImportedYear[]
  courseCount: number
  warnings: string[]
}

interface TextItem {
  str: string
  x: number
  y: number
}

interface Row {
  y: number
  items: TextItem[]
}

const Y_TOLERANCE = 3.5

const YEAR_RE = /^(First|Second|Third|Fourth|Fifth)\s+Year$/i
const SEMESTER_RE = /^(\d+)\s*(st|nd|rd|th)\s+Semester$/i
const MIDYEAR_RE = /^Mid[\s-]?year$/i
const STOP_SECTION_RE = /^(Electives|GE\s+Courses)$/i
const HEADER_ROW_RE = /^Subject\b/i

function clusterRows(items: TextItem[]): Row[] {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x)
  const rows: Row[] = []
  for (const item of sorted) {
    const row = rows.find((r) => Math.abs(r.y - item.y) <= Y_TOLERANCE)
    if (row) {
      row.items.push(item)
    } else {
      rows.push({ y: item.y, items: [item] })
    }
  }
  for (const row of rows) row.items.sort((a, b) => a.x - b.x)
  return rows
}

function rowText(items: TextItem[]): string {
  return items
    .map((i) => i.str)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Parse a units cell like "3", "(2)", "(3)" into a number, or null if not numeric. */
function parseUnits(text: string): number | null {
  const cleaned = text.replace(/[()]/g, '').trim()
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null
  const value = Number.parseFloat(cleaned)
  return Number.isFinite(value) ? value : null
}

function inferType(name: string): CourseType {
  if (/^PE\b/i.test(name)) return 'pe'
  if (/^NSTP\b/i.test(name)) return 'nstp'
  if (/^GE\b/i.test(name)) return 'ge'
  if (/^Elective\b/i.test(name)) return 'elective'
  return 'major'
}

/**
 * Reduce a subject cell to just its course code, dropping the parenthetical
 * title (e.g. "Math 83 (Essentials of Analysis I)" -> "Math 83") and any
 * "Track: " bullet prefix used for elective-major rows (e.g.
 * "Stat Comp : Stat 130 (Nonparametric...)" -> "Stat 130"). This also
 * incidentally fixes titles that got cut off mid-word by a PDF line wrap,
 * since everything after the first "(" is dropped anyway.
 */
function extractCourseCode(rawName: string): string {
  let name = rawName.trim()
  const colonIndex = name.lastIndexOf(':')
  if (colonIndex !== -1) name = name.slice(colonIndex + 1).trim()
  const parenIndex = name.indexOf('(')
  if (parenIndex !== -1) name = name.slice(0, parenIndex).trim()
  return name.replace(/\s+/g, ' ').trim()
}

async function loadPdfJs() {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
  return pdfjs
}

/** Extract every text run on every page, with its x/y position in PDF points. */
async function extractPageRows(file: File): Promise<Row[][]> {
  const pdfjs = await loadPdfJs()
  const buffer = await file.arrayBuffer()
  const doc = await pdfjs.getDocument({ data: buffer }).promise

  const pages: Row[][] = []
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum)
    const content = await page.getTextContent()
    const items: TextItem[] = content.items
      .filter((item): item is typeof item & { str: string } => 'str' in item && item.str.trim() !== '')
      .map((item) => {
        const transform = (item as { transform: number[] }).transform
        return { str: item.str, x: transform[4], y: transform[5] }
      })
    pages.push(clusterRows(items))
  }
  return pages
}

/**
 * Find the x-boundaries of the Units / Hrs / Prerequisite columns from a
 * header row (one that starts with "Subject"). Falls back to `null` when a
 * row isn't a header, so the caller can keep using the previous table's
 * boundaries until a new header appears.
 */
function headerBoundaries(row: Row): { unitsX: number; hrsX: number; prereqX: number } | null {
  const text = rowText(row.items)
  if (!HEADER_ROW_RE.test(text)) return null

  const unitsItem = row.items.find((i) => /^Units$/i.test(i.str.trim()))
  const hrsItem = row.items.find((i) => /^(Hrs\.?\/?Wk\.?|Hours\/Week)$/i.test(i.str.trim()))
  const prereqItem = row.items.find((i) => /^Prerequisite$/i.test(i.str.trim()))
  if (!unitsItem) return null

  return {
    unitsX: unitsItem.x - 6,
    hrsX: (hrsItem ?? prereqItem)?.x ? (hrsItem ?? prereqItem)!.x - 6 : unitsItem.x + 40,
    prereqX: prereqItem ? prereqItem.x - 6 : (hrsItem ? hrsItem.x + 60 : unitsItem.x + 100),
  }
}

export async function importCurriculumPdf(file: File): Promise<ImportResult> {
  const pages = await extractPageRows(file)
  const warnings: string[] = []

  const years: ImportedYear[] = []
  let currentYear: ImportedYear | null = null
  let currentSemester: ImportedYear['semesters'][number] | null = null
  let bounds: { unitsX: number; hrsX: number; prereqX: number } | null = null
  let stopped = false

  function pushYear() {
    if (currentYear && currentYear.semesters.some((s) => s.courses.length > 0)) {
      years.push(currentYear)
    }
    currentYear = null
    currentSemester = null
  }

  for (const rows of pages) {
    if (stopped) break

    for (const row of rows) {
      const text = rowText(row.items)
      if (!text) continue

      if (STOP_SECTION_RE.test(text)) {
        stopped = true
        break
      }

      const maybeBounds = headerBoundaries(row)
      if (maybeBounds) {
        bounds = maybeBounds
        continue
      }

      if (YEAR_RE.test(text)) {
        pushYear()
        currentYear = { yearLabel: text, semesters: [] }
        continue
      }

      const semMatch = SEMESTER_RE.exec(text)
      if (semMatch || MIDYEAR_RE.test(text)) {
        if (!currentYear) {
          // Some curricula list a lone "Midyear" block outside any "Nth Year"
          // header (e.g. between 2nd and 3rd year) — group it under a
          // synthetic year so the courses aren't dropped.
          currentYear = { yearLabel: 'Midyear', semesters: [] }
        }
        const kind: SemesterKind = semMatch
          ? semMatch[1] === '1'
            ? 'first'
            : 'second'
          : 'midyear'
        currentSemester = { kind, label: text, courses: [] }
        currentYear.semesters.push(currentSemester)
        continue
      }

      if (!currentSemester || !bounds) continue

      const subjectItems = row.items.filter((i) => i.x < bounds!.unitsX)
      const unitsItems = row.items.filter((i) => i.x >= bounds!.unitsX && i.x < bounds!.hrsX)
      const rawName = rowText(subjectItems)
      const unitsText = rowText(unitsItems)
      if (!rawName) continue

      const units = parseUnits(unitsText)
      if (units === null) continue // section labels, running totals, etc.

      const name = extractCourseCode(rawName)
      if (!name) continue

      currentSemester.courses.push({ name, units, type: inferType(name) })
    }
  }
  pushYear()

  const courseCount = years.reduce(
    (sum, y) => sum + y.semesters.reduce((s, sem) => s + sem.courses.length, 0),
    0,
  )
  if (courseCount === 0) {
    warnings.push(
      "Couldn't find any course rows. This works best with a table-based curriculum checklist (Subject / Units / Hrs columns).",
    )
  }

  return { years, courseCount, warnings }
}

/** Convert the parsed, framework-agnostic result into real Year/Semester/Course state. */
export function toYears(
  imported: ImportedYear[],
  makeId: (prefix: string) => string,
  startIndex = 0,
): Year[] {
  return imported.map((y, index) => ({
    id: makeId('year'),
    label: String(startIndex + index + 1),
    manualGwa: null,
    semesters: y.semesters.map((s) => ({
      id: makeId('sem'),
      kind: s.kind,
      manualGwa: null,
      courses: s.courses.map((c) => ({
        id: makeId('course'),
        name: c.name,
        units: String(c.units),
        grade: '' as const,
        type: c.type,
      })),
    })),
  }))
}
