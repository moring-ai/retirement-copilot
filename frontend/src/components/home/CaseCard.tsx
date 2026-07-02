import { ArrowRight, Clock3, Target } from 'lucide-react'
import type { CaseSummary } from '@/types'
import { STEP_LABELS } from '@/state/workspace-reducer'
import { StageBadge } from './StageBadge'
import { Progress } from '@/components/ui/progress'
import { initials, timeAgo } from '@/lib/utils'

export function CaseCard({
  summary,
  now,
  onOpen,
}: {
  summary: CaseSummary
  now: number
  onOpen: (id: string) => void
}) {
  const cta = summary.stage === 'submitted' ? 'Review' : 'Continue'
  return (
    <button
      type="button"
      onClick={() => onOpen(summary.id)}
      className="group flex flex-col rounded-xl border border-border bg-card p-4 text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand-dark">
            {initials(summary.customerName)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">
              {summary.customerName}
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              {summary.id} · {summary.customerId}
            </p>
          </div>
        </div>
        <StageBadge stage={summary.stage} />
      </div>

      <div className="mt-3 flex items-start gap-2 text-sm text-ink-soft">
        <Target className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
        <span className="line-clamp-2">{summary.goalLabel}</span>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{STEP_LABELS[summary.currentStep]}</span>
          <span className="font-medium text-ink-soft">{summary.progressPct}%</span>
        </div>
        <Progress value={summary.progressPct} className="h-1.5" />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Clock3 className="h-3.5 w-3.5" />
          {timeAgo(summary.lastUpdatedAt, now)} · {summary.lastUpdatedBy}
        </span>
        <span className="flex items-center gap-1 text-xs font-semibold text-brand-dark transition-transform group-hover:translate-x-0.5">
          {cta}
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </button>
  )
}
