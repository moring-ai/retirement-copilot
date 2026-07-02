import { Target, ArrowRight, Info } from 'lucide-react'
import type { Customer } from '@/types'
import { useWorkspace } from '@/state/WorkspaceContext'
import { StepHeader } from './StepHeader'
import { Card, CardContent } from '@/components/ui/card'

export function RolloverGoalStep({ customer }: { customer: Customer }) {
  const { state } = useWorkspace()
  return (
    <div className="space-y-5">
      <StepHeader
        eyebrow="Guided Case Workspace"
        title="Rollover Goal"
        description="The customer's stated objective for this case, captured by the associate."
        status={state.stepStatuses.rollover_goal}
      />

      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-brand-dark">
              <Target className="h-5 w-5" />
            </span>
            <div>
              <p className="text-base font-semibold text-ink">
                {customer.rollover_goal}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Move funds from the former employer plan into a Fidelity IRA
                without triggering a taxable distribution.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="rounded-lg border border-border bg-background/60 px-4 py-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                From
              </p>
              <p className="text-sm font-medium text-ink">
                {customer.source_plan.description}
              </p>
              <p className="text-xs text-muted-foreground">
                {customer.source_plan.plan_provider}
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
            <div className="rounded-lg border border-brand/20 bg-brand-soft px-4 py-3">
              <p className="text-[11px] uppercase tracking-wide text-brand-dark/70">
                To
              </p>
              <p className="text-sm font-medium text-brand-dark">
                {customer.destination_account}
              </p>
              <p className="text-xs text-brand-dark/70">Fidelity</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-start gap-2.5 rounded-lg border border-secondary/20 bg-accent px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
        <p className="text-sm text-accent-foreground">
          The agent assists the associate only. It does not contact the customer
          or move money — every recommendation is reviewed and executed by the
          associate.
        </p>
      </div>
    </div>
  )
}
