import { useEffect, useRef } from 'react'
import {
  FileText,
  FileSearch,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  AlertTriangle,
  PartyPopper,
} from 'lucide-react'
import { useWorkspace } from '@/state/WorkspaceContext'
import { useSimulatedAgentRun } from '@/hooks/useSimulatedAgentRun'
import { StepHeader } from './StepHeader'
import { StickyActionBar } from '@/components/layout/StickyActionBar'
import { StepNav } from '@/components/layout/StepNav'
import { MissingInformationCard } from '@/components/eligibility/MissingInformationCard'
import { FormUploadCard, reviewComments } from '@/components/forms/FormUploadCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function RequiredFormsStep() {
  const { state, dispatch } = useWorkspace()
  const { run, runningAction } = useSimulatedAgentRun()
  const status = state.stepStatuses.required_forms
  const hasRun = status === 'complete' || status === 'needs_info'
  const eligibilityDone =
    state.stepStatuses.goal_eligibility === 'complete' ||
    state.stepStatuses.goal_eligibility === 'needs_info'
  const finding = runningAction === 'forms'
  const canValidate = state.uploadedForms.some(
    (f) => f.status === 'unverified' || f.status === 'issues',
  )

  const outstanding = state.missingInformation
  const hasIssues = state.uploadedForms.some((f) => f.status === 'issues')
  const allClear = hasRun && outstanding.length === 0 && !hasIssues

  // Autopilot: entering this step auto-runs the required-forms check, then
  // waits for the associate to review and continue (no auto-advance).
  const autoRan = useRef(false)
  const doneRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (eligibilityDone && !hasRun && !runningAction && !autoRan.current) {
      autoRan.current = true
      run('forms')
    }
  }, [eligibilityDone, hasRun, runningAction, run])

  useEffect(() => {
    if (hasRun) {
      doneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [hasRun])

  const validateAll = () => {
    state.uploadedForms
      .filter((f) => f.status === 'unverified' || f.status === 'issues')
      .forEach((f, i) => {
        dispatch({ type: 'SET_FORM_STATUS', id: f.id, status: 'verifying' })
        window.setTimeout(
          () => {
            const { status: s, comments } = reviewComments(f.name)
            dispatch({ type: 'SET_FORM_STATUS', id: f.id, status: s, comments })
          },
          900 + i * 400,
        )
      })
  }

  return (
    <div className="flex flex-1 flex-col space-y-5">
      <StepHeader
        eyebrow="Guided Case Workspace"
        title="Required Forms"
        description="Identify the forms this rollover needs, then upload the filled-in versions for an AI completeness check before submission."
        status={status}
      />

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
                ? 'Run “Find Required Forms” below to build the checklist.'
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
          <Card
            className={cn(
              'border-l-4 animate-fade-in',
              allClear ? 'border-l-brand' : 'border-l-warn',
            )}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                    allClear
                      ? 'bg-brand-soft text-brand-dark'
                      : 'bg-warn-soft text-warn',
                  )}
                >
                  {allClear ? (
                    <PartyPopper className="h-5 w-5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">
                    {allClear
                      ? 'All required forms are ready'
                      : hasIssues
                        ? 'Some uploaded forms need fixes'
                        : `${outstanding.length} item${outstanding.length > 1 ? 's' : ''} still outstanding`}
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">
                    {allClear
                      ? 'Everything the agent flagged for this rollover is accounted for. Ready to move on to the compliance review?'
                      : hasIssues
                        ? 'The AI review found problems in one or more uploaded forms — see the comments above. You can still continue and resolve them during compliance review.'
                        : 'The checklist is built. Upload the outstanding documents here, or continue and resolve them later.'}
                  </p>
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
                  <div className="mt-4">
                    <Button
                      onClick={() =>
                        dispatch({
                          type: 'SELECT_STEP',
                          step: 'compliance_review',
                        })
                      }
                    >
                      Continue to Compliance Review
                      <ArrowRight />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <StickyActionBar>
        <StepNav>
          <Button
            variant={hasRun ? 'outline' : 'default'}
            disabled={runningAction !== null || !eligibilityDone}
            onClick={() => run('forms')}
          >
            {finding ? <Loader2 className="animate-spin" /> : <FileSearch />}
            {finding
              ? 'Agent working…'
              : hasRun
                ? 'Re-find Forms'
                : 'Find Required Forms'}
          </Button>
          {hasRun && (
            <Button
              variant="outline"
              disabled={!canValidate}
              onClick={validateAll}
            >
              <ShieldCheck />
              Validate Required Forms
            </Button>
          )}
        </StepNav>
      </StickyActionBar>
    </div>
  )
}
