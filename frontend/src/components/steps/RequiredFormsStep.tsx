import { useEffect, useRef } from 'react'
import {
  FileText,
  FileSearch,
  Loader2,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  PartyPopper,
} from 'lucide-react'
import { useWorkspace } from '@/state/WorkspaceContext'
import { useSimulatedAgentRun } from '@/hooks/useSimulatedAgentRun'
import { useRegisterIslandActions } from '@/lib/island-store'
import { StepHeader } from './StepHeader'
import { StepConfirm } from './StepConfirm'
import { MissingInformationCard } from '@/components/eligibility/MissingInformationCard'
import { FormUploadCard } from '@/components/forms/FormUploadCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function RequiredFormsStep() {
  const { state, dispatch } = useWorkspace()
  const { run, runningAction } = useSimulatedAgentRun()
  const status = state.stepStatuses.required_forms
  const hasRun = status === 'complete' || status === 'needs_info'
  const eligibilityDone =
    state.stepStatuses.goal_eligibility === 'complete' ||
    state.stepStatuses.goal_eligibility === 'needs_info'
  const finding = runningAction === 'forms'

  const outstanding = state.missingInformation
  const hasIssues = state.uploadedForms.some((f) => f.status === 'issues')
  const allClear = hasRun && outstanding.length === 0 && !hasIssues

  // Autopilot: entering this step auto-runs the required-forms check, then
  // waits for the associate to review and continue (no auto-advance).
  // Guarded on state (not a ref) so it survives StrictMode's mount/cleanup/
  // remount — otherwise the scheduled run gets cancelled and never retried.
  const doneRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (eligibilityDone && !hasRun && runningAction === null) {
      run('forms')
    }
  }, [eligibilityDone, hasRun, runningAction, run])

  useEffect(() => {
    if (hasRun) {
      doneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [hasRun])

  useRegisterIslandActions(
    () => ({
      stepId: 'required_forms',
      title: !hasRun
        ? 'Required forms'
        : allClear
          ? 'Forms ready'
          : hasIssues
            ? 'Forms need fixes'
            : 'Items outstanding',
      hint: 'Continue to draft the response',
      actions: hasRun
        ? [
            {
              id: 'continue',
              label: 'Continue to Response',
              primary: true,
              icon: ArrowRight,
              onClick: () =>
                dispatch({ type: 'SELECT_STEP', step: 'response' }),
            },
            {
              id: 'recheck',
              label: 'Re-check forms',
              variant: 'outline',
              icon: FileSearch,
              disabled: runningAction !== null,
              onClick: () => run('forms'),
            },
          ]
        : [],
    }),
    [hasRun, allClear, hasIssues, runningAction],
  )

  return (
    <div className="flex flex-1 flex-col space-y-5">
      <StepHeader
        eyebrow="Guided Case Workspace"
        title="Required Forms"
        description="The agent identifies the forms this rollover needs. Upload the filled-in versions for an AI completeness check before submission."
        status={status}
      />

      {finding && (
        <div className="flex items-center gap-3 rounded-xl border border-secondary/30 bg-accent px-4 py-3 animate-fade-in">
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-secondary" />
          <div>
            <p className="text-sm font-semibold text-ink">
              Autopilot — checking required forms…
            </p>
            <p className="text-xs text-ink-soft">
              The agent is matching this case against the approved forms catalog.
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-secondary" />
            <CardTitle className="normal-case tracking-normal text-ink">
              Required Forms
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {!hasRun ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              {eligibilityDone
                ? 'Checking the approved forms catalog…'
                : 'Complete the Goal & Eligibility step first.'}
            </div>
          ) : (
            <ul className="space-y-2">
              {state.requiredForms.map((form) => (
                <li
                  key={form}
                  className="flex items-start gap-2.5 rounded-lg border border-border bg-background/60 px-3 py-2.5 animate-fade-in"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span className="text-sm text-ink">{form}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <MissingInformationCard items={state.missingInformation} hasRun={hasRun} />

      {hasRun && <FormUploadCard />}

      {hasRun && (
        <div ref={doneRef}>
          <StepConfirm
            tone={allClear ? 'success' : 'warn'}
            icon={allClear ? PartyPopper : AlertTriangle}
            title={
              allClear
                ? 'All required forms are ready'
                : hasIssues
                  ? 'Some uploaded forms need fixes'
                  : `${outstanding.length} item${outstanding.length > 1 ? 's' : ''} still outstanding`
            }
            description={
              allClear
                ? 'Everything the agent flagged for this rollover is accounted for. Ready to draft the response?'
                : hasIssues
                  ? 'The AI review found problems in one or more uploaded forms — see the comments above. You can still continue and resolve them before sending.'
                  : 'The checklist is built. Upload the outstanding documents here, or continue and resolve them later.'
            }
          >
            {!allClear && outstanding.length > 0 && (
              <ul className="mt-2 space-y-1">
                {outstanding.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm text-ink-soft"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warn" />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </StepConfirm>
        </div>
      )}
    </div>
  )
}
