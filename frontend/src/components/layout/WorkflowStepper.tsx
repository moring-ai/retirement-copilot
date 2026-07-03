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

const N = STEP_ORDER.length
// The connecting track runs between the first and last node centres, so it is
// inset by half a column on each side.
const INSET = 100 / (2 * N)
const TRACK_WIDTH = 100 - 2 * INSET

export function WorkflowStepper() {
  const { state, dispatch } = useWorkspace()

  const completed = STEP_ORDER.filter(
    (s) => state.stepStatuses[s] === 'complete',
  ).length

  // A gap between node i and i+1 is "done" when node i is complete. Filling the
  // track by done-gaps keeps the line and the node states in lock-step.
  const doneGaps = STEP_ORDER.slice(0, N - 1).filter(
    (s) => state.stepStatuses[s] === 'complete',
  ).length
  const fraction = doneGaps / (N - 1)

  return (
    <div className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto w-full max-w-5xl px-4 py-3 lg:px-6">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Case Workflow
          </p>
          <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
            {completed} of {N} complete
          </span>
        </div>

        <div className="relative">
          {/* track (base + filled) — aligned to node centres */}
          <div
            className="absolute top-[15px] h-0.5 rounded-full bg-border"
            style={{ left: `${INSET}%`, width: `${TRACK_WIDTH}%` }}
          />
          <div
            className="absolute top-[15px] h-0.5 rounded-full bg-brand transition-all duration-500 ease-out"
            style={{ left: `${INSET}%`, width: `${TRACK_WIDTH * fraction}%` }}
          />

          {/* nodes — equal-width columns keep everything evenly spaced */}
          <div className="relative flex">
            {STEP_ORDER.map((step) => {
              const status = state.stepStatuses[step]
              const active = state.activeStep === step
              const Icon = STEP_ICONS[step]
              const done = status === 'complete'
              return (
                <button
                  key={step}
                  type="button"
                  onClick={() => dispatch({ type: 'SELECT_STEP', step })}
                  aria-current={active ? 'step' : undefined}
                  className="flex flex-1 basis-0 flex-col items-center gap-1.5 rounded-lg py-1 transition-colors focus-visible:outline-none"
                >
                  <span
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-semibold transition-all duration-200',
                      NODE_STYLE[status],
                      active && 'ring-2 ring-brand/30 ring-offset-2 ring-offset-card',
                    )}
                  >
                    {done ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </span>
                  <span
                    className={cn(
                      'max-w-full truncate px-1 text-center text-[11px] font-medium leading-tight',
                      active ? 'text-ink' : 'text-muted-foreground',
                    )}
                  >
                    {STEP_SHORT[step]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
