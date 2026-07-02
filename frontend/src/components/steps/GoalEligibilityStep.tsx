import {
  Target,
  ArrowRight,
  ChevronDown,
  ShieldCheck,
  Loader2,
  Info,
} from 'lucide-react'
import type { Customer } from '@/types'
import { useWorkspace } from '@/state/WorkspaceContext'
import { useSimulatedAgentRun } from '@/hooks/useSimulatedAgentRun'
import { ROLLOVER_GOALS } from '@/data/goals'
import { StepHeader } from './StepHeader'
import { StickyActionBar } from '@/components/layout/StickyActionBar'
import { CustomerDetailsCard } from '@/components/eligibility/CustomerDetailsCard'
import { EligibilityResultCard } from '@/components/eligibility/EligibilityResultCard'
import { RolloverPathCard } from '@/components/eligibility/RolloverPathCard'
import { RecommendedActionCard } from '@/components/eligibility/RecommendedActionCard'
import { FindingsCard } from '@/components/eligibility/FindingsCard'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

function ResultSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </CardContent>
    </Card>
  )
}

export function GoalEligibilityStep({ customer }: { customer: Customer }) {
  const { state, dispatch } = useWorkspace()
  const { run, runningAction } = useSimulatedAgentRun()

  const goal = ROLLOVER_GOALS.find((g) => g.id === state.selectedGoalId)
  const running = runningAction === 'eligibility'
  const status = state.stepStatuses.goal_eligibility
  const hasResult = state.eligibilityResult !== null
  const pendingTools = state.evidence.toolCalls.filter(
    (t) => t.approval === 'pending',
  )

  return (
    <div className="flex flex-1 flex-col space-y-5">
      <StepHeader
        eyebrow="Guided Case Workspace"
        title="Goal & Eligibility"
        description="Capture the customer's rollover goal, then let the agent confirm whether it can proceed as a standard case against customer data and approved policy."
        status={status}
      />

      {/* --- Goal selection --- */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-dark">
              <Target className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Rollover goal
              </p>

              <DropdownMenu>
                <DropdownMenuTrigger className="mt-1.5 flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <span
                    className={cn(
                      'text-sm font-medium',
                      goal ? 'text-ink' : 'text-muted-foreground',
                    )}
                  >
                    {goal ? goal.label : 'Select the customer’s goal…'}
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[min(28rem,80vw)]">
                  {ROLLOVER_GOALS.map((g) => (
                    <DropdownMenuItem
                      key={g.id}
                      selected={g.id === state.selectedGoalId}
                      onSelect={() =>
                        dispatch({ type: 'SELECT_GOAL', goalId: g.id })
                      }
                    >
                      <span className="font-medium text-ink">{g.label}</span>
                      <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
                        {g.description}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {goal && (
                <p className="mt-2 text-sm text-muted-foreground animate-fade-in">
                  {goal.description}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="rounded-lg border border-border bg-background/60 px-4 py-2.5">
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
                <div className="rounded-lg border border-brand/20 bg-brand-soft px-4 py-2.5">
                  <p className="text-[11px] uppercase tracking-wide text-brand-dark/70">
                    To
                  </p>
                  <p className="text-sm font-medium text-brand-dark">
                    {customer.destination_account}
                  </p>
                  <p className="text-xs text-brand-dark/70">Fidelity</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- Eligibility --- */}
      <div className="flex items-center gap-2 pt-1">
        <ShieldCheck className="h-4 w-4 text-secondary" />
        <h3 className="text-sm font-semibold text-ink">Eligibility</h3>
      </div>

      <CustomerDetailsCard customer={customer} />

      {pendingTools.length > 0 && (
        <div className="flex items-start gap-2.5 rounded-lg border border-warn/30 bg-warn-soft px-4 py-3 animate-fade-in">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
          <p className="text-sm text-ink-soft">
            <span className="font-semibold text-ink">
              {pendingTools.length} tool call{pendingTools.length > 1 ? 's' : ''} await your approval
            </span>{' '}
            in the Agent Evidence panel. Approve them to let the agent use the
            data, or switch to “Full control”.
          </p>
        </div>
      )}

      {running && !hasResult ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ResultSkeleton />
          <ResultSkeleton />
        </div>
      ) : hasResult ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 animate-fade-in">
          <EligibilityResultCard result={state.eligibilityResult} />
          <RolloverPathCard path={state.rolloverPath} />
          <RecommendedActionCard text={state.recommendedAction} />
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <ShieldCheck className="h-6 w-6 text-muted-foreground" />
            <p className="max-w-sm text-sm text-muted-foreground">
              {goal
                ? 'Run the eligibility check below to confirm whether this rollover can proceed.'
                : 'Select a rollover goal above, then run the eligibility check.'}
            </p>
          </CardContent>
        </Card>
      )}

      {state.findings.length > 0 && (
        <div className="animate-fade-in">
          <FindingsCard findings={state.findings} />
        </div>
      )}

      {/* --- Sticky submit bar --- */}
      <StickyActionBar>
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">
            {hasResult ? 'Eligibility check complete' : 'Run eligibility check'}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {goal
              ? `Goal: ${goal.label}`
              : 'Select a goal to enable the check'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={hasResult ? 'outline' : 'default'}
            disabled={!goal || runningAction !== null}
            onClick={() => run('eligibility')}
          >
            {running ? (
              <Loader2 className="animate-spin" />
            ) : (
              <ShieldCheck />
            )}
            {running
              ? 'Agent working…'
              : hasResult
                ? 'Re-run check'
                : 'Run Eligibility Check'}
          </Button>
          {hasResult && (
            <Button
              onClick={() =>
                dispatch({ type: 'SELECT_STEP', step: 'required_forms' })
              }
            >
              Continue
              <ArrowRight />
            </Button>
          )}
        </div>
      </StickyActionBar>
    </div>
  )
}
