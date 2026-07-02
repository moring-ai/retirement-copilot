import {
  FileText,
  FileSearch,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react'
import { useWorkspace } from '@/state/WorkspaceContext'
import { useSimulatedAgentRun } from '@/hooks/useSimulatedAgentRun'
import { StepHeader } from './StepHeader'
import { StickyActionBar } from '@/components/layout/StickyActionBar'
import { MissingInformationCard } from '@/components/eligibility/MissingInformationCard'
import { FormUploadCard, reviewComments } from '@/components/forms/FormUploadCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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

      <StickyActionBar>
        <p className="min-w-0 truncate text-sm text-muted-foreground">
          {hasRun
            ? 'Upload filled-in forms, then validate them with AI.'
            : 'Build the required-forms checklist to begin.'}
        </p>
        <div className="flex items-center gap-2">
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
          {hasRun && (
            <Button
              onClick={() =>
                dispatch({ type: 'SELECT_STEP', step: 'compliance_review' })
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
