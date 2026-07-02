import { useState } from 'react'
import { History, ChevronDown } from 'lucide-react'
import type { TimelineEvent } from '@/types'
import { TimelineEntry } from './TimelineEntry'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

/**
 * The agent's step-by-step activity log — an audit trail. Collapsed by default
 * (it's history, not the headline), expandable when the associate wants the
 * detail behind a result.
 */
export function ActivityTimeline({
  events,
  running,
}: {
  events: TimelineEvent[]
  running: boolean
}) {
  // Auto-open while the agent is actively working; otherwise default collapsed.
  const [open, setOpen] = useState(running)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md py-1 text-left transition-colors hover:opacity-80 focus-visible:outline-none">
        <History className="h-4 w-4 text-secondary" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
          Agent History
        </h3>
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-ink-soft">
          {events.length}
        </span>
        {running && (
          <span className="flex h-1.5 w-1.5 animate-pulse rounded-full bg-secondary" />
        )}
        <ChevronDown
          className={cn(
            'ml-auto h-4 w-4 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-fade-in">
        <ol className="mt-3 space-y-3">
          {events.map((event, i) => (
            <TimelineEntry
              key={event.id}
              event={event}
              last={i === events.length - 1}
            />
          ))}
        </ol>
      </CollapsibleContent>
    </Collapsible>
  )
}
