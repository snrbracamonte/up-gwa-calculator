'use client'

import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

export interface AccordionItem {
  id: string
  title: string
  content: ReactNode
}

interface InfoAccordionProps {
  items: AccordionItem[]
}

export function InfoAccordion({ items }: InfoAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {items.map((item, index) => {
        const open = openId === item.id
        return (
          <div key={item.id} className={index > 0 ? 'border-t border-border' : ''}>
            <button
              type="button"
              onClick={() => setOpenId(open ? null : item.id)}
              aria-expanded={open}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-secondary/60"
            >
              <span className="font-serif text-sm font-semibold text-foreground">{item.title}</span>
              <ChevronDown
                className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>
            {open && (
              <div className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{item.content}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}
