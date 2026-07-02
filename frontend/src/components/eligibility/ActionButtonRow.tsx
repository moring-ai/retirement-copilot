import { ShieldCheck, FileSearch, ScrollText, PenLine, Loader2 } from 'lucide-react'
import type { RunningAction, StepStatus } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useWorkspace } from '@/state/WorkspaceContext'
import { useSimulatedAgentRun } from '@/hooks/useSimulatedAgentRun'

type ActionKey = Exclude<RunningAction, null>

interface ActionDef {
  key: ActionKey
  label: string
  icon: typeof ShieldCheck
  primary?: boolean
  /** Hint shown in a tooltip when the action is gated by an earlier step. */
  gateHint: string
}

const hasRun = (s: StepStatus | undefined) =>
  s === 'complete' || s === 'needs_info'

export function ActionButtonRow() {
  const { state } = useWorkspace()
  const { run, runningAction } = useSimulatedAgentRun()

  const eligibilityDone = hasRun(state.stepStatuses.eligibility_check)
  const formsDone = hasRun(state.stepStatuses.required_forms)
  const complianceDone = hasRun(state.stepStatuses.compliance_review)

  const actions: (ActionDef & { enabled: boolean })[] = [
    {
      key: 'eligibility',
      label: 'Run Eligibility Check',
      icon: ShieldCheck,
      primary: true,
      gateHint: '',
      enabled: true,
    },
    {
      key: 'forms',
      label: 'Find Required Forms',
      icon: FileSearch,
      gateHint: 'Run the eligibility check first',
      enabled: eligibilityDone,
    },
    {
      key: 'compliance',
      label: 'Check Compliance',
      icon: ScrollText,
      gateHint: 'Find required forms first',
      enabled: formsDone,
    },
    {
      key: 'draft',
      label: 'Generate Draft Response',
      icon: PenLine,
      gateHint: 'Run the compliance check first',
      enabled: complianceDone,
    },
  ]

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {actions.map((action) => {
        const Icon = action.icon
        const isRunning = runningAction === action.key
        const disabled = !action.enabled || runningAction !== null
        const button = (
          <Button
            variant={action.primary ? 'default' : 'outline'}
            disabled={disabled}
            onClick={() => run(action.key)}
            className="w-full sm:w-auto"
          >
            {isRunning ? <Loader2 className="animate-spin" /> : <Icon />}
            {isRunning ? 'Agent working…' : action.label}
          </Button>
        )

        // Show a tooltip explaining the gate when disabled purely by prerequisite.
        if (!action.enabled && !runningAction) {
          return (
            <Tooltip key={action.key}>
              <TooltipTrigger asChild>
                <span className="w-full sm:w-auto">{button}</span>
              </TooltipTrigger>
              <TooltipContent>{action.gateHint}</TooltipContent>
            </Tooltip>
          )
        }
        return <span key={action.key} className="w-full sm:w-auto">{button}</span>
      })}
    </div>
  )
}
