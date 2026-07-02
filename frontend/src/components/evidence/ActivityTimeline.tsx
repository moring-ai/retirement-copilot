import { Activity } from 'lucide-react'
import type { TimelineEvent } from '@/types'
import { TimelineEntry } from './TimelineEntry'
import { SectionHeading } from './SectionHeading'

export function ActivityTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <section>
      <SectionHeading icon={Activity} title="Agent Activity" count={events.length} />
      <ol className="mt-3 space-y-3">
        {events.map((event, i) => (
          <TimelineEntry
            key={event.id}
            event={event}
            last={i === events.length - 1}
          />
        ))}
      </ol>
    </section>
  )
}
