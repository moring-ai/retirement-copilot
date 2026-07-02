import {
  User,
  Target,
  ShieldCheck,
  FileText,
  ScrollText,
  PenLine,
  BadgeCheck,
  type LucideIcon,
} from 'lucide-react'
import type { StepId } from '@/types'
import { useWorkspace } from '@/state/WorkspaceContext'
import { STEP_LABELS, STEP_ORDER } from '@/state/workspace-reducer'
import { CaseStepItem } from './CaseStepItem'
import { Progress } from '@/components/ui/progress'

const STEP_ICONS: Record<StepId, LucideIcon> = {
  customer_snapshot: User,
  rollover_goal: Target,
  eligibility_check: ShieldCheck,
  required_forms: FileText,
  compliance_review: ScrollText,
  draft_response: PenLine,
  final_approval: BadgeCheck,
}

export function CaseStepSidebar() {
  const { state, dispatch } = useWorkspace()

  const completed = STEP_ORDER.filter(
    (s) => state.stepStatuses[s] === 'complete',
  ).length
  const pct = Math.round((completed / STEP_ORDER.length) * 100)

  const onSelect = (step: StepId) => dispatch({ type: 'SELECT_STEP', step })

  return (
    <nav className="flex h-full flex-col gap-4 p-4">
      <div>
        <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Case Workflow
        </p>
        <div className="mt-2 flex items-center gap-3 px-1">
          <Progress value={pct} className="h-1.5" />
          <span className="shrink-0 text-xs font-medium text-ink-soft">
            {completed}/{STEP_ORDER.length}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        {STEP_ORDER.map((step, i) => (
          <CaseStepItem
            key={step}
            step={step}
            index={i}
            label={STEP_LABELS[step]}
            status={state.stepStatuses[step]}
            icon={STEP_ICONS[step]}
            active={state.activeStep === step}
            onSelect={onSelect}
          />
        ))}
      </div>
    </nav>
  )
}
