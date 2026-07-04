import { ArrowRight, Clock3, Target, MoreVertical, Send } from 'lucide-react'
import type { CasePriority, CaseSummary } from '@/types'
import { useWorkspace } from '@/state/WorkspaceContext'
import { STEP_LABELS } from '@/state/workspace-reducer'
import { StageBadge } from './StageBadge'
import { PriorityBadge } from './PriorityBadge'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { initials, timeAgo } from '@/lib/utils'

const PRIORITIES: CasePriority[] = ['high', 'medium', 'low']

export function CaseCard({
  summary,
  now,
  onOpen,
  onTransfer,
}: {
  summary: CaseSummary
  now: number
  onOpen: (id: string) => void
  onTransfer: (summary: CaseSummary) => void
}) {
  const { dispatch } = useWorkspace()
  const cta =
    summary.stage === 'submitted'
      ? 'Review'
      : summary.stage === 'pending'
        ? 'Open'
        : 'Continue'

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(summary.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(summary.id)
        }
      }}
      className="group flex cursor-pointer flex-col rounded-xl border border-border bg-card p-4 text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand-dark">
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

        <div className="flex shrink-0 items-center gap-1">
          <PriorityBadge priority={summary.priority} />
          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              aria-label="Case actions"
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuLabel>Priority</DropdownMenuLabel>
              {PRIORITIES.map((p) => (
                <DropdownMenuItem
                  key={p}
                  selected={summary.priority === p}
                  onSelect={() =>
                    dispatch({
                      type: 'SET_CASE_PRIORITY',
                      caseId: summary.id,
                      priority: p,
                    })
                  }
                >
                  <span className="capitalize">{p}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => onTransfer(summary)}>
                <span className="flex items-center gap-2 text-ink">
                  <Send className="h-3.5 w-3.5" />
                  Transfer case…
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
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
        <span className="flex min-w-0 items-center gap-1.5 truncate text-[11px] text-muted-foreground">
          <Clock3 className="h-3.5 w-3.5 shrink-0" />
          {timeAgo(summary.lastUpdatedAt, now)} · {summary.assignee}
        </span>
        <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-brand-dark transition-transform group-hover:translate-x-0.5">
          {cta}
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </div>
  )
}
