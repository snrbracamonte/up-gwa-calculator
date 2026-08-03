// Full-board export/import as JSON. JSON is the natural fit here: the data
// is a nested Year -> Semester -> Course tree, JSON preserves that structure
// exactly (no flattening like CSV would need), it's human-readable, and both
// serializing and parsing it need nothing beyond what the browser already
// provides (JSON.parse/stringify, Blob, File#text()).

import type { Year } from './gwa'

export const DATA_EXPORT_VERSION = 1

export interface GwaExportFile {
  app: 'up-gwa-calculator'
  version: number
  exportedAt: string
  years: Year[]
}

export function serializeYears(years: Year[]): string {
  const payload: GwaExportFile = {
    app: 'up-gwa-calculator',
    version: DATA_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    years,
  }
  return JSON.stringify(payload, null, 2)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isValidManualGwa(value: unknown): boolean {
  if (value === null) return true
  if (!isRecord(value)) return false
  return typeof value.gwa === 'string' && typeof value.units === 'string'
}

function isValidCourse(value: unknown): boolean {
  if (!isRecord(value)) return false
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.units === 'string' &&
    typeof value.grade === 'string' &&
    typeof value.type === 'string'
  )
}

function isValidSemester(value: unknown): boolean {
  if (!isRecord(value)) return false
  return (
    typeof value.id === 'string' &&
    (value.kind === 'first' || value.kind === 'second' || value.kind === 'midyear') &&
    Array.isArray(value.courses) &&
    value.courses.every(isValidCourse) &&
    isValidManualGwa(value.manualGwa)
  )
}

function isValidYear(value: unknown): value is Year {
  if (!isRecord(value)) return false
  return (
    typeof value.id === 'string' &&
    typeof value.label === 'string' &&
    Array.isArray(value.semesters) &&
    value.semesters.every(isValidSemester) &&
    isValidManualGwa(value.manualGwa)
  )
}

export interface ParsedImport {
  years: Year[]
}

/** Accepts either the full `{ app, version, years }` export shape, or a bare Year[] array. */
export function parseYearsFile(text: string): ParsedImport | null {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return null
  }

  const candidate = Array.isArray(data)
    ? data
    : isRecord(data) && Array.isArray(data.years)
      ? data.years
      : null

  if (!candidate || candidate.length === 0) return null
  if (!candidate.every(isValidYear)) return null

  return { years: candidate }
}
