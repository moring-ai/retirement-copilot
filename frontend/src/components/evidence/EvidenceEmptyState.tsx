import { Radar } from 'lucide-react'

export function EvidenceEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-background/60 px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Radar className="h-6 w-6 text-muted-foreground" />
      </span>
      <div>
        <p className="text-sm font-medium text-ink">No agent activity yet</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Run an action from the case workspace — the agent's timeline, sources,
          tool calls, and risk assessment will appear here as evidence for your
          review.
        </p>
      </div>
    </div>
  )
}
