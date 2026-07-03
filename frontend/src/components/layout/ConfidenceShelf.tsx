import { Gauge, ShieldAlert } from 'lucide-react'
import type { ConfidenceLevel } from '@/types'
import { useWorkspace } from '@/state/WorkspaceContext'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const CONFIDENCE_STYLE: Record<
  ConfidenceLevel,
  { bar: string; text: string; pct: number }
> = {
  High: { bar: 'bg-brand', text: 'text-brand-dark', pct: 90 },
  Medium: { bar: 'bg-warn', text: 'text-warn', pct: 60 },
  Low: { bar: 'bg-danger', text: 'text-danger', pct: 30 },
}

/**
 * A small, always-visible shelf that appears once the eligibility check has
 * produced a confidence level, keeping the agent's confidence & risk read in
 * view across the rest of the workflow.
 */
export function ConfidenceShelf() {
  const { state } = useWorkspace()
  const { confidence, riskTags } = state.evidence
  if (confidence === null) return null

  const style = CONFIDENCE_STYLE[confidence]

  return (
    <div className="pointer-events-auto fixed right-4 top-[132px] z-20 hidden w-60 rounded-xl border border-border bg-card/95 p-3 shadow-card backdrop-blur animate-fade-in md:block">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
          <Gauge className="h-3.5 w-3.5 text-brand-dark" />
          Confidence &amp; Risk
        </div>
        <span className={cn('text-sm font-bold tabular-nums', style.text)}>
          {confidence}
        </span>
      </div>

      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all duration-700', style.bar)}
          style={{ width: `${style.pct}%` }}
        />
      </div>

      <div className="mt-2.5 flex items-start gap-1.5">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warn" />
        <div className="flex flex-wrap gap-1">
          {riskTags.length ? (
            riskTags.map((tag) => (
              <Badge
                key={tag}
                variant={tag.toLowerCase().includes('low') ? 'default' : 'warn'}
              >
                {tag}
              </Badge>
            ))
          ) : (
            <span className="text-[11px] text-muted-foreground">No risk flags</span>
          )}
        </div>
      </div>
    </div>
  )
}
