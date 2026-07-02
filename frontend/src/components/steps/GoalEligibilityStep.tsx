import { useEffect, useRef, useState } from 'react'
import {
  Target,
  ArrowRight,
  ChevronDown,
  ShieldCheck,
  Loader2,
  Rocket,
  Pause,
  AlertTriangle,
} from 'lucide-react'
import type { Customer } from '@/types'
import { useWorkspace } from '@/state/WorkspaceContext'
import { useSimulatedAgentRun } from '@/hooks/useSimulatedAgentRun'
import { ROLLOVER_GOALS } from '@/data/goals'
import { StepHeader } from './StepHeader'
import { StickyActionBar } from '@/components/layout/StickyActionBar'
import { StepNav } from '@/components/layout/StepNav'
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
  const escalation = status === 'needs_info'

  // ---- Autopilot: agent drives, associate watches / intervenes ----
  const resultsRef = useRef<HTMLDivElement>(null)
  const autoRan = useRef(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [paused, setPaused] = useState(false)

  const clean =
    Boolean(state.eligibilityResult?.eligible) &&
    !escalation &&
    pendingTools.length === 0

  // Selecting a goal auto-starts the eligibility check.
  useEffect(() => {
    if (
      state.selectedGoalId &&
      !state.eligibilityResult &&
      !state.runningAction &&
      !autoRan.current
    ) {
      autoRan.current = true
      run('eligibility')
    }
  }, [state.selectedGoalId, state.eligibilityResult, state.runningAction, run])

  // Bring the results into view while the agent works.
  useEffect(() => {
    if (running || state.eligibilityResult) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [running, state.eligibilityResult])

  // Once every check passes, count down and advance to Required Forms.
  useEffect(() => {
    if (autoRan.current && !paused && clean && countdown === null) {
      setCountdown(10)
    }
  }, [clean, paused, countdown])

  useEffect(() => {
    if (countdown === null) return
    if (countdown <= 0) {
      dispatch({ type: 'SELECT_STEP', step: 'required_forms' })
      return
    }
    const t = window.setTimeout(
      () => setCountdown((c) => (c === null ? null : c - 1)),
      1000,
    )
    return () => window.clearTimeout(t)
  }, [countdown, dispatch])

  const cancelAutopilot = () => {
    setPaused(true)
    setCountdown(null)
  }

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

      {/* Autopilot status */}
      {countdown !== null ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-brand/30 bg-brand-soft px-4 py-3 animate-fade-in">
          <Rocket className="h-5 w-5 shrink-0 text-brand-dark" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">
              All checks passed — autopilot engaged
            </p>
            <p className="text-xs text-ink-soft">
              Moving to Required Forms in{' '}
              <span className="font-semibold tabular-nums text-brand-dark">
                {countdown}s
              </span>
              . Stay to review, or jump ahead.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={cancelAutopilot}>
            <Pause />
            Stay
          </Button>
          <Button
            size="sm"
            onClick={() =>
              dispatch({ type: 'SELECT_STEP', step: 'required_forms' })
            }
          >
            Go now
            <ArrowRight />
          </Button>
        </div>
      ) : running ? (
        <div className="flex items-center gap-3 rounded-xl border border-secondary/30 bg-accent px-4 py-3 animate-fade-in">
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-secondary" />
          <div>
            <p className="text-sm font-semibold text-ink">
              Autopilot — running the eligibility check…
            </p>
            <p className="text-xs text-ink-soft">
              The agent is gathering data and checking policy. You’re watching.
            </p>
          </div>
        </div>
      ) : hasResult && pendingTools.length > 0 ? (
        <div className="flex items-start gap-3 rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 animate-fade-in">
          <Pause className="mt-0.5 h-5 w-5 shrink-0 text-warn" />
          <p className="text-sm text-ink-soft">
            <span className="font-semibold text-ink">Autopilot paused</span> —
            approve the {pendingTools.length} pending tool call
            {pendingTools.length > 1 ? 's' : ''} in the Agent Evidence panel to
            continue, or switch to “Full control”.
          </p>
        </div>
      ) : hasResult && escalation ? (
        <div className="flex items-start gap-3 rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 animate-fade-in">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warn" />
          <p className="text-sm text-ink-soft">
            <span className="font-semibold text-ink">
              Autopilot paused — needs your review.
            </span>{' '}
            This case can’t proceed automatically. Review the findings and
            recommendations before continuing.
          </p>
        </div>
      ) : null}

      <div ref={resultsRef} className="scroll-mt-36">
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
                  ? 'Running the eligibility check…'
                  : 'Select a rollover goal above — the eligibility check starts automatically.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {state.findings.length > 0 && (
        <div className="animate-fade-in">
          <FindingsCard findings={state.findings} />
        </div>
      )}

      {/* --- Sticky submit bar --- */}
      <StickyActionBar>
        <StepNav>
          <Button
            variant={hasResult ? 'outline' : 'default'}
            disabled={!goal || runningAction !== null}
            onClick={() => run('eligibility')}
          >
            {running ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
            {running
              ? 'Agent working…'
              : hasResult
                ? 'Re-run check'
                : 'Run Eligibility Check'}
          </Button>
        </StepNav>
      </StickyActionBar>
    </div>
  )
}
