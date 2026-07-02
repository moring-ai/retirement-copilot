import type { TimelineEvent } from '@/types'

export function TimelineEntry({
  event,
  last,
}: {
  event: TimelineEvent
  last: boolean
}) {
  return (
    <li className="relative animate-fade-in pl-6">
      {!last && (
        <span className="absolute left-[7px] top-4 h-full w-px bg-border" />
      )}
      <span className="absolute left-0 top-1 flex h-3.5 w-3.5 items-center justify-center">
        <span className="h-2 w-2 rounded-full bg-brand ring-4 ring-brand-soft" />
      </span>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-ink">{event.label}</p>
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
          {event.timestamp}
        </span>
      </div>
      {event.detail && (
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {event.detail}
        </p>
      )}
    </li>
  )
}
