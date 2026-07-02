import {
  ScrollText,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { useWorkspace } from '@/state/WorkspaceContext'
import { useSimulatedAgentRun } from '@/hooks/useSimulatedAgentRun'
import { StepHeader } from './StepHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const GUARDRAILS = [
  'No personalized investment advice',
  'No unsupported tax or legal advice',
  'No trade execution or money movement',
  'Customer PII redacted from the draft',
]

export function ComplianceReviewStep() {
  const { state } = useWorkspace()
  const { run, runningAction } = useSimulatedAgentRun()
  const status = state.stepStatuses.compliance_review
  const hasRun = status === 'complete' || status === 'needs_info'
  const formsDone =
    state.stepStatuses.required_forms === 'complete' ||
    state.stepStatuses.required_forms === 'needs_info'
  const escalation = status === 'needs_info'
  const warnings = state.evidence.complianceWarnings

  return (
    <div className="space-y-5">
      <StepHeader
        eyebrow="Guided Case Workspace"
        title="Compliance Review"
        description="Deterministic safety checks against approved language and escalation policy. These run in code — the model cannot argue past them."
        status={status}
      >
        <Button
          size="sm"
          disabled={runningAction !== null || !formsDone}
          onClick={() => run('compliance')}
        >
          {runningAction === 'compliance' ? (
            <Loader2 className="animate-spin" />
          ) : (
            <ScrollText />
          )}
          {runningAction === 'compliance' ? 'Agent working…' : 'Check Compliance'}
        </Button>
      </StepHeader>

      {hasRun && (
        <Card
          className={
            escalation
              ? 'border-l-4 border-l-warn'
              : 'border-l-4 border-l-brand'
          }
        >
          <CardContent className="flex items-start gap-3 p-5">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                escalation
                  ? 'bg-warn-soft text-warn'
                  : 'bg-brand-soft text-brand-dark'
              }`}
            >
              {escalation ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <ShieldCheck className="h-5 w-5" />
              )}
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">
                {escalation
                  ? 'Escalation required'
                  : 'No compliance blockers — cleared for draft response'}
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                {escalation
                  ? 'System data triggered an escalation. Do not proceed as a standard rollover; route to a specialist.'
                  : 'Identity verified, no restrictions, and rollover permitted. The agent may draft a compliant customer response.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="normal-case tracking-normal text-ink">
              Guardrails Enforced
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {GUARDRAILS.map((g) => (
                <li key={g} className="flex items-center gap-2.5 text-sm text-ink">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-brand" />
                  {g}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="normal-case tracking-normal text-ink">
              Compliance Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {warnings.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Run the compliance check to populate notes.
              </p>
            ) : (
              <ul className="space-y-2">
                {warnings.map((w) => (
                  <li
                    key={w}
                    className="flex items-start gap-2.5 rounded-lg border border-warn/20 bg-warn-soft px-3 py-2 text-sm text-ink-soft"
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
                    {w}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
