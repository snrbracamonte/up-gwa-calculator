'use client'

import { useRef, useState } from 'react'
import { FileUp, Loader2 } from 'lucide-react'
import { importCurriculumPdf, type ImportResult } from '@/lib/pdf-import'

interface ImportPdfButtonProps {
  onImport: (result: ImportResult) => void
}

export function ImportPdfButton({ onImport }: ImportPdfButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setStatus('loading')
    setError(null)
    try {
      const result = await importCurriculumPdf(file)
      setStatus('idle')
      onImport(result)
    } catch (err) {
      console.error(err)
      setStatus('error')
      setError('Could not read that PDF. Make sure it has a text-based course table (not a scanned image).')
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={status === 'loading'}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === 'loading' ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <FileUp className="size-4" aria-hidden="true" />
        )}
        {status === 'loading' ? 'Reading PDF…' : 'Import Curriculum'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) void handleFile(file)
        }}
      />
      {error && <p className="max-w-[240px] text-right text-xs text-destructive">{error}</p>}
    </div>
  )
}
