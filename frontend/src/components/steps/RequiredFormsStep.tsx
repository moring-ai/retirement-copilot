import { FileText, FileSearch, Loader2, CheckCircle2 } from 'lucide-react'
import { useWorkspace } from '@/state/WorkspaceContext'
import { useSimulatedAgentRun } from '@/hooks/useSimulatedAgentRun'
import { StepHeader } from './StepHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MissingInformationCard } from '@/components/eligibility/MissingInformationCard'

export function RequiredFormsStep() {
  const { state } = useWorkspace()
  const { run, runningAction } = useSimulatedAgentRun()
  const status = state.stepStatuses.required_forms
  const hasRun = status === 'complete' || status === 'needs_info'
  const eligibilityDone =
    state.stepStatuses.eligibility_check === 'complete' ||
    state.stepStatuses.eligibility_check === 'needs_info'

  return (
    <div className="space-y-5">
      <StepHeader
        eyebrow="Guided Case Workspace"
        title="Required Forms"
        description="Forms and documents needed to complete this rollover, identified against the approved forms catalog."
        status={status}
      >
        <Button
          size="sm"
          disabled={runningAction !== null || !eligibilityDone}
          onClick={() => run('forms')}
        >
          {runningAction === 'forms' ? (
            <Loader2 className="animate-spin" />
          ) : (
            <FileSearch />
          )}
          {runningAction === 'forms' ? 'Agent working…' : 'Find Required Forms'}
        </Button>
      </StepHeader>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="normal-case tracking-normal text-ink">
            Required Forms
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasRun ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              {eligibilityDone
                ? 'Run "Find Required Forms" to build the checklist.'
                : 'Complete the eligibility check first.'}
            </div>
          ) : (
            <ul className="space-y-2">
              {state.requiredForms.map((form) => (
                <li
                  key={form}
                  className="flex items-start gap-2.5 rounded-lg border border-border bg-background/60 px-3 py-2.5"
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
    </div>
  )
}
