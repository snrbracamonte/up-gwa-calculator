import { Award } from 'lucide-react'

const TONE_STYLES: Record<string, string> = {
  summa: 'bg-primary text-primary-foreground border-primary',
  magna: 'bg-primary/90 text-primary-foreground border-primary',
  cum: 'bg-accent text-accent-foreground border-accent',
  university: 'bg-primary text-primary-foreground border-primary',
  college: 'bg-accent text-accent-foreground border-accent',
  dean: 'bg-secondary text-secondary-foreground border-border',
  none: 'bg-secondary text-secondary-foreground border-border',
}

const HIGHLIGHT_TONES = new Set(['summa', 'magna', 'cum', 'university', 'college'])

interface HonorBadgeProps {
  title: string
  range: string
  note: string
  tone: string
  /** Compact drops the note text and shrinks padding, for inline use on Semester/Year cards. */
  compact?: boolean
}

export function HonorBadge({ title, range, note, tone, compact }: HonorBadgeProps) {
  const highlight = HIGHLIGHT_TONES.has(tone)
  const toneClass = TONE_STYLES[tone] ?? TONE_STYLES.none

  return (
    <div className={`rounded-lg border ${compact ? 'p-2.5 text-xs' : 'p-4 text-sm'} ${toneClass}`}>
      <div className="flex items-center gap-1.5">
        {highlight && <Award className={compact ? 'size-3.5 shrink-0' : 'size-5 shrink-0'} aria-hidden="true" />}
        <p className={`font-serif font-semibold leading-tight ${compact ? '' : 'text-lg'}`}>{title}</p>
      </div>
      {range && <p className="mt-0.5 opacity-80">{`GWA ${range}`}</p>}
      {!compact && note && <p className="mt-2 leading-relaxed opacity-90">{note}</p>}
    </div>
  )
}
