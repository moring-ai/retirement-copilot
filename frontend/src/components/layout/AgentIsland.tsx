import { useState } from 'react'
import { Sparkles, Loader2, ListTree, ChevronUp, X } from 'lucide-react'
import { useWorkspace } from '@/state/WorkspaceContext'
import { TimelineEntry } from '@/components/evidence/TimelineEntry'
import { cn } from '@/lib/utils'

/**
 * Floating "dynamic island" pinned to the bottom of the associate workspace.
 * Shows the latest agent-history line at a glance and toggles open into the
 * full agent trace (the activity timeline).
 */
export function AgentIsland() {
  const { state } = useWorkspace()
  const { timeline } = state.evidence
  const running = state.runningAction !== null
  const [open, setOpen] = useState(false)

  const latest = timeline[timeline.length - 1]
  const statusText = running
    ? (latest?.label ?? 'Agent working…')
    : latest
      ? latest.label
      : 'Agent ready — no activity yet'

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
      <div className="pointer-events-auto w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card/90 shadow-card backdrop-blur transition-all duration-300">
        {/* Expanded trace (grows upward above the pill) */}
        {open && (
          <div className="animate-fade-in border-b border-border">
            <div className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-2">
                <ListTree className="h-4 w-4 text-secondary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Agent trace
                </span>
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-ink-soft">
                  {timeline.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close trace"
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="scrollbar-slim max-h-72 overflow-y-auto px-4 pb-3">
              {timeline.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  No agent activity yet.
                </p>
              ) : (
                <ol className="space-y-3">
                  {timeline.map((e, i) => (
                    <TimelineEntry
                      key={e.id}
                      event={e}
                      last={i === timeline.length - 1}
                    />
                  ))}
                </ol>
              )}
            </div>
          </div>
        )}

        {/* Collapsed pill row */}
        <div className="flex items-center gap-3 px-3 py-2.5">
          <span
            className={cn(
              'relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
              running
                ? 'bg-secondary/15 text-secondary'
                : 'bg-brand-soft text-brand-dark',
            )}
          >
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {running && (
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-secondary" />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {running ? 'Agent working' : 'Agent'}
            </p>
            <p
              key={latest?.id ?? 'idle'}
              className="animate-fade-in truncate text-sm font-medium text-ink"
            >
              {statusText}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              open
                ? 'border-secondary/30 bg-accent text-secondary'
                : 'border-border bg-background text-ink-soft hover:bg-muted',
            )}
          >
            <ListTree className="h-3.5 w-3.5" />
            Trace
            {timeline.length > 0 && (
              <span className="rounded-full bg-muted px-1.5 text-[10px] font-semibold">
                {timeline.length}
              </span>
            )}
            <ChevronUp
              className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')}
            />
          </button>
        </div>
      </div>
    </div>
  )
}
