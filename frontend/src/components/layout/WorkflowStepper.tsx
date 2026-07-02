import {
  User,
  Target,
  FileText,
  ScrollText,
  PenLine,
  BadgeCheck,
  Check,
  type LucideIcon,
} from 'lucide-react'
import type { StepId, StepStatus } from '@/types'
import { useWorkspace } from '@/state/WorkspaceContext'
import { STEP_ORDER, STEP_SHORT } from '@/state/workspace-reducer'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

const STEP_ICONS: Record<StepId, LucideIcon> = {
  customer_snapshot: User,
  goal_eligibility: Target,
  required_forms: FileText,
  compliance_review: ScrollText,
  response: PenLine,
  review: BadgeCheck,
}

const NODE_STYLE: Record<StepStatus, string> = {
  complete: 'bg-brand text-white border-brand',
  in_progress: 'bg-secondary text-white border-secondary',
  needs_info: 'bg-warn text-white border-warn',
  pending: 'bg-card text-muted-foreground border-border',
}

export function WorkflowStepper() {
  const { state, dispatch } = useWorkspace()
  const completed = STEP_ORDER.filter(
    (s) => state.stepStatuses[s] === 'complete',
  ).length
  const pct = Math.round((completed / STEP_ORDER.length) * 100)

  return (
    <div className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto w-full max-w-5xl px-4 py-3 lg:px-6">
        <div className="scrollbar-slim flex items-center gap-1 overflow-x-auto">
          {STEP_ORDER.map((step, i) => {
            const status = state.stepStatuses[step]
            const active = state.activeStep === step
            const Icon = STEP_ICONS[step]
            const done = status === 'complete'
            return (
              <div key={step} className="flex flex-1 items-center">
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'SELECT_STEP', step })}
                  aria-current={active ? 'step' : undefined}
                  className={cn(
                    'group flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 transition-colors',
                    active ? 'bg-brand-soft' : 'hover:bg-muted',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-all duration-200',
                      NODE_STYLE[status],
                      active && 'ring-2 ring-brand/30 ring-offset-1',
                    )}
                  >
                    {done ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Icon className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <span className="hidden min-w-0 flex-col text-left sm:flex">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Step {i + 1}
                    </span>
                    <span
                      className={cn(
                        'truncate text-xs font-medium',
                        active ? 'text-ink' : 'text-ink-soft',
                      )}
                    >
                      {STEP_SHORT[step]}
                    </span>
                  </span>
                </button>
                {i < STEP_ORDER.length - 1 && (
                  <span
                    className={cn(
                      'h-px w-4 shrink-0 sm:w-6',
                      done ? 'bg-brand/40' : 'bg-border',
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Slim overall progress line under the stepper */}
        <div className="mt-2 flex items-center gap-3">
          <Progress value={pct} className="h-1" />
          <span className="shrink-0 text-[11px] font-medium tabular-nums text-muted-foreground">
            {completed}/{STEP_ORDER.length}
          </span>
        </div>
      </div>
    </div>
  )
}
