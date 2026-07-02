import { BookText, FileCheck2 } from 'lucide-react'
import type { RagSource } from '@/types'
import { SectionHeading } from './SectionHeading'

export function SourcesUsedList({ sources }: { sources: RagSource[] }) {
  return (
    <section>
      <SectionHeading icon={BookText} title="Sources Used" count={sources.length} />
      <ul className="mt-3 space-y-2">
        {sources.map((s) => (
          <li
            key={s.chunk_id}
            className="flex items-start gap-2.5 rounded-lg border border-border bg-background/60 p-2.5"
          >
            <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">
                {s.displayName}
              </p>
              <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="rounded bg-muted px-1 py-0.5 font-mono">
                  {s.chunk_id}
                </span>
                <span className="truncate">{s.doc}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] italic text-muted-foreground">
        Every claim is grounded in approved guidance and cited by document id.
      </p>
    </section>
  )
}
