'use client'

import { useMemo, useState } from 'react'
import { CalendarPlus, RotateCcw, X } from 'lucide-react'
import {
  computeCumulativeGwa,
  computeGwa,
  flattenCourses,
  SEMESTER_ORDER,
  yearOrdinalSuffixWord,
  type Course,
  type ManualGwaEntry,
  type Semester,
  type SemesterKind,
  type Year,
} from '@/lib/gwa'
import { YearSection } from '@/components/year-section'
import { ResultCard } from '@/components/result-card'
import { ImportPdfButton } from '@/components/import-pdf-button'
import { toYears, type ImportResult } from '@/lib/pdf-import'

// IDs for items added at runtime. These factories only ever run from client
// event handlers, so a simple counter is fine. A module-level counter must
// NOT be used for the initial state: on the server the module persists
// across requests, so it drifts from the fresh client counter and causes a
// hydration mismatch. The initial state uses static ids instead.
let counter = 0
function uid(prefix: string): string {
  counter += 1
  return `${prefix}-r${counter}`
}

function makeCourse(): Course {
  return { id: uid('course'), name: '', units: '3', grade: '', type: '' }
}

function makeSemester(kind: SemesterKind): Semester {
  return { id: uid('sem'), kind, courses: [], manualGwa: null }
}

function makeYear(label: string): Year {
  return { id: uid('year'), label, semesters: [makeSemester('first')], manualGwa: null }
}

// Fully deterministic initial state — identical on server and client.
function initialYears(): Year[] {
  return [
    {
      id: 'year-init',
      label: '1',
      manualGwa: null,
      semesters: [{ id: 'sem-init', kind: 'first', courses: [], manualGwa: null }],
    },
  ]
}

// True when the board is still exactly the pristine starting state, so an
// import can replace it instead of appending after it.
function isBlankState(years: Year[]): boolean {
  if (years.length !== 1) return false
  const [year] = years
  if (year.manualGwa !== null) return false
  if (year.semesters.length !== 1) return false
  const [sem] = year.semesters
  return sem.courses.length === 0 && sem.manualGwa === null
}

// The smallest positive integer not already used as a year label — e.g. if
// only "Year 2" exists, the next year added defaults to "Year 1" rather than
// "Year 3".
function nextYearLabel(years: Year[]): string {
  const used = new Set(
    years
      .map((y) => Number.parseFloat(y.label))
      .filter((n) => Number.isFinite(n) && Number.isInteger(n) && n > 0),
  )
  let n = 1
  while (used.has(n)) n += 1
  return String(n)
}

// Keeps year tabs ordered by their numeric label. Non-numeric labels sort to
// the end, after any numeric ones, and ties keep their relative order.
function sortYearsByLabel(years: Year[]): Year[] {
  return [...years].sort((a, b) => {
    const na = Number.parseFloat(a.label)
    const nb = Number.parseFloat(b.label)
    const va = Number.isFinite(na) ? na : Number.POSITIVE_INFINITY
    const vb = Number.isFinite(nb) ? nb : Number.POSITIVE_INFINITY
    return va - vb
  })
}

export function GwaCalculator() {
  const [years, setYears] = useState<Year[]>(initialYears)
  const [activeYearId, setActiveYearId] = useState<string>(() => initialYears()[0].id)
  const [importMessage, setImportMessage] = useState<{ tone: 'success' | 'warning'; text: string } | null>(
    null,
  )

  const cumulative = useMemo(() => computeCumulativeGwa(years), [years])
  const courseStats = useMemo(() => computeGwa(flattenCourses(years)), [years])
  const manualEntryCount = useMemo(
    () =>
      years.filter((y) => y.manualGwa !== null).length +
      years.reduce((sum, y) => sum + y.semesters.filter((s) => s.manualGwa !== null).length, 0),
    [years],
  )

  const activeYear = years.find((y) => y.id === activeYearId) ?? years[0]

  // --- Year-level actions ---
  function addYear() {
    const label = nextYearLabel(years)
    const year = makeYear(label)
    setYears((prev) => sortYearsByLabel([...prev, year]))
    setActiveYearId(year.id)
  }

  function removeYear(yearId: string) {
    setYears((prev) => {
      if (prev.length <= 1) return prev
      const next = prev.filter((y) => y.id !== yearId)
      if (yearId === activeYearId) {
        const removedIndex = prev.findIndex((y) => y.id === yearId)
        const fallback = next[Math.max(0, removedIndex - 1)]
        setActiveYearId(fallback.id)
      }
      return next
    })
  }

  function reset() {
    const fresh = initialYears()
    setYears(fresh)
    setActiveYearId(fresh[0].id)
    setImportMessage(null)
  }

  function handleImport(result: ImportResult) {
    if (result.courseCount === 0) {
      setImportMessage({ tone: 'warning', text: result.warnings[0] ?? "Couldn't find any courses in that PDF." })
      return
    }

    const imported = toYears(result.years, uid, isBlankState(years) ? 0 : years.length)
    setYears((prev) => (isBlankState(prev) ? imported : [...prev, ...imported]))
    setActiveYearId(imported[0].id)

    const courseWord = result.courseCount === 1 ? 'course' : 'courses'
    const yearWord = imported.length === 1 ? 'year' : 'years'
    setImportMessage({
      tone: 'success',
      text: `Imported ${result.courseCount} ${courseWord} across ${imported.length} ${yearWord}. Grades were left blank — fill them in, and double-check units and course types.`,
    })
  }

  function updateYear(yearId: string, updater: (year: Year) => Year) {
    setYears((prev) => prev.map((y) => (y.id === yearId ? updater(y) : y)))
  }

  function changeYearLabel(yearId: string, label: string) {
    // Don't re-sort here — reordering mid-keystroke would yank focus away
    // while the person is still typing. Sorting happens on blur instead.
    updateYear(yearId, (year) => ({ ...year, label }))
  }

  // Re-sorts year tabs by their numeric label once an edit is done (on
  // blur), so a year edited to a higher number moves after its siblings.
  function commitYearOrder() {
    setYears((prev) => sortYearsByLabel(prev))
  }

  // --- Year-level manual GWA ---
  function addYearManualGwa(yearId: string) {
    updateYear(yearId, (year) => {
      const semestersEmpty = year.semesters.every((s) => s.courses.length === 0 && s.manualGwa === null)
      if (year.manualGwa !== null || !semestersEmpty) return year
      return { ...year, manualGwa: { gwa: '', units: '' } }
    })
  }

  function changeYearManualGwa(yearId: string, patch: Partial<ManualGwaEntry>) {
    updateYear(yearId, (year) =>
      year.manualGwa ? { ...year, manualGwa: { ...year.manualGwa, ...patch } } : year,
    )
  }

  function removeYearManualGwa(yearId: string) {
    updateYear(yearId, (year) => ({ ...year, manualGwa: null }))
  }

  // --- Semester-level actions ---
  function addSemester(yearId: string) {
    updateYear(yearId, (year) => {
      if (year.manualGwa !== null) return year
      const nextKind = SEMESTER_ORDER.find((kind) => !year.semesters.some((s) => s.kind === kind))
      if (!nextKind) return year
      const semesters = [...year.semesters, makeSemester(nextKind)]
      semesters.sort((a, b) => SEMESTER_ORDER.indexOf(a.kind) - SEMESTER_ORDER.indexOf(b.kind))
      return { ...year, semesters }
    })
  }

  function removeSemester(yearId: string, semesterId: string) {
    updateYear(yearId, (year) =>
      year.semesters.length > 1
        ? { ...year, semesters: year.semesters.filter((s) => s.id !== semesterId) }
        : year,
    )
  }

  function updateSemester(yearId: string, semesterId: string, updater: (sem: Semester) => Semester) {
    updateYear(yearId, (year) => ({
      ...year,
      semesters: year.semesters.map((s) => (s.id === semesterId ? updater(s) : s)),
    }))
  }

  // --- Semester-level manual GWA ---
  function addSemesterManualGwa(yearId: string, semesterId: string) {
    updateSemester(yearId, semesterId, (sem) =>
      sem.manualGwa === null && sem.courses.length === 0
        ? { ...sem, manualGwa: { gwa: '', units: '' } }
        : sem,
    )
  }

  function changeSemesterManualGwa(yearId: string, semesterId: string, patch: Partial<ManualGwaEntry>) {
    updateSemester(yearId, semesterId, (sem) =>
      sem.manualGwa ? { ...sem, manualGwa: { ...sem.manualGwa, ...patch } } : sem,
    )
  }

  function removeSemesterManualGwa(yearId: string, semesterId: string) {
    updateSemester(yearId, semesterId, (sem) => ({ ...sem, manualGwa: null }))
  }

  // --- Course-level actions ---
  function addCourse(yearId: string, semesterId: string) {
    updateSemester(yearId, semesterId, (sem) =>
      sem.manualGwa === null ? { ...sem, courses: [...sem.courses, makeCourse()] } : sem,
    )
  }

  function changeCourse(
    yearId: string,
    semesterId: string,
    courseId: string,
    patch: Partial<Course>,
  ) {
    updateSemester(yearId, semesterId, (sem) => ({
      ...sem,
      courses: sem.courses.map((c) => (c.id === courseId ? { ...c, ...patch } : c)),
    }))
  }

  function removeCourse(yearId: string, semesterId: string, courseId: string) {
    updateSemester(yearId, semesterId, (sem) => ({
      ...sem,
      courses: sem.courses.filter((c) => c.id !== courseId),
    }))
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Add courses per semester, or enter a known GWA directly. Add semesters or years to
            build a cumulative GWA.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <ImportPdfButton onImport={handleImport} />
            <button
              type="button"
              onClick={addYear}
              className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border bg-card px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-secondary"
            >
              <CalendarPlus className="size-4" aria-hidden="true" />
              Add year
            </button>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Reset
            </button>
          </div>
        </div>

        {importMessage && (
          <p
            role="status"
            className={`rounded-lg border p-3 text-sm ${
              importMessage.tone === 'success'
                ? 'border-accent/40 bg-accent/10 text-foreground'
                : 'border-destructive/30 bg-destructive/10 text-destructive'
            }`}
          >
            {importMessage.text}
          </p>
        )}

        <div role="tablist" aria-label="Academic years" className="flex flex-wrap items-center gap-1.5">
          {years.map((year) => {
            const active = year.id === activeYear.id
            return (
              <div
                key={year.id}
                onClick={() => setActiveYearId(year.id)}
                className={`inline-flex cursor-pointer items-center overflow-hidden rounded-lg border transition-colors ${
                  active
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <input
                  type="text"
                  value={year.label}
                  onFocus={() => setActiveYearId(year.id)}
                  onChange={(e) => changeYearLabel(year.id, e.target.value)}
                  onBlur={commitYearOrder}
                  aria-label={`Year ${year.label} number`}
                  className="w-7 bg-transparent py-2 pl-3.5 text-right text-sm font-medium outline-none"
                />
                <span className="py-2 pr-1 text-sm font-medium">{yearOrdinalSuffixWord(year.label)}</span>
                {years.length > 1 && (
                  <button
                    type="button"
                    aria-label={`Remove Year ${year.label}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      removeYear(year.id)
                    }}
                    className={`mr-1.5 flex size-5 items-center justify-center rounded-md transition-colors ${
                      active ? 'hover:bg-primary-foreground/20' : 'hover:bg-destructive/10 hover:text-destructive'
                    }`}
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {activeYear && (
          <YearSection
            key={activeYear.id}
            year={activeYear}
            onAddSemester={() => addSemester(activeYear.id)}
            onSemesterRemove={(semesterId) => removeSemester(activeYear.id, semesterId)}
            onCourseAdd={(semesterId) => addCourse(activeYear.id, semesterId)}
            onCourseChange={(semesterId, courseId, patch) =>
              changeCourse(activeYear.id, semesterId, courseId, patch)
            }
            onCourseRemove={(semesterId, courseId) => removeCourse(activeYear.id, semesterId, courseId)}
            onSemesterManualGwaAdd={(semesterId) => addSemesterManualGwa(activeYear.id, semesterId)}
            onSemesterManualGwaChange={(semesterId, patch) =>
              changeSemesterManualGwa(activeYear.id, semesterId, patch)
            }
            onSemesterManualGwaRemove={(semesterId) => removeSemesterManualGwa(activeYear.id, semesterId)}
            onYearManualGwaAdd={() => addYearManualGwa(activeYear.id)}
            onYearManualGwaChange={(patch) => changeYearManualGwa(activeYear.id, patch)}
            onYearManualGwaRemove={() => removeYearManualGwa(activeYear.id)}
          />
        )}
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <ResultCard cumulative={cumulative} courseStats={courseStats} manualEntryCount={manualEntryCount} />
      </div>
    </div>
  )
}
