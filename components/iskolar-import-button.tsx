'use client'

import { useState } from 'react'
import { ClipboardPaste, X } from 'lucide-react'
import { parseIskolarGrades, type IskolarCourse } from '@/lib/iskolar-import'
import { ACTION_BUTTON_CLASS } from '@/components/action-button-class'

interface IskolarImportButtonProps {
  onImport: (courses: IskolarCourse[]) => void
}

export function IskolarImportButton({ onImport }: IskolarImportButtonProps) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [status, setStatus] = useState<{ tone: 'success' | 'warning'; text: string } | null>(null)

  function close() {
    setOpen(false)
    setText('')
    setStatus(null)
  }

  function handleImportClick() {
    const result = parseIskolarGrades(text)
    if (result.courses.length === 0) {
      setStatus({
        tone: 'warning',
        text: "Couldn't find any course rows in that paste. Make sure you copied the full grades table, including all its columns.",
      })
      return
    }
    onImport(result.courses)
    close()
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={ACTION_BUTTON_CLASS}>
        <ClipboardPaste className="size-4" aria-hidden="true" />
        Import from ISKOLAR
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Import from ISKOLAR"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={close}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-lg"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-serif text-lg font-semibold text-foreground">Import from ISKOLAR</h3>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Go to{' '}
              <a
                href="https://iskolar.upm.edu.ph/student/classes/grades"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline underline-offset-2"
              >
                iskolar.upm.edu.ph/student/classes/grades
              </a>{' '}
              and copy your grades table for this semester.
            </p>

            <label className="sr-only" htmlFor="iskolar-paste">
              Pasted grades table
            </label>
            <textarea
              id="iskolar-paste"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              placeholder="Paste your grades table here…"
              className="mt-3 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs text-foreground outline-none transition-colors placeholder:font-sans placeholder:text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            />

            {status && (
              <p
                role="status"
                className={`mt-2 text-sm ${status.tone === 'warning' ? 'text-destructive' : 'text-foreground'}`}
              >
                {status.text}
              </p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportClick}
                disabled={text.trim() === ''}
                className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
