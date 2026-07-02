import {
  ScrollText,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Info,
  Download,
  Ban,
  UserCog,
  ArrowUpRight,
  type LucideIcon,
} from 'lucide-react'
import type {
  ComplianceIssue,
  IssueRecommendation,
  IssueSeverity,
} from '@/types'
import { useWorkspace } from '@/state/WorkspaceContext'
import { useSimulatedAgentRun } from '@/hooks/useSimulatedAgentRun'
import { CUSTOMERS } from '@/data/customers'
import { goalLabel } from '@/data/goals'
import { StepHeader } from './StepHeader'
import { StickyActionBar } from '@/components/layout/StickyActionBar'
import { StepNav } from '@/components/layout/StepNav'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

const GUARDRAILS = [
  'No personalized investment advice',
  'No unsupported tax or legal advice',
  'No trade execution or money movement',
  'Customer PII redacted from the draft',
]

const SEVERITY: Record<
  IssueSeverity,
  { label: string; wrap: string; badge: string; icon: LucideIcon }
> = {
  critical: {
    label: 'Critical',
    wrap: 'border-l-danger',
    badge: 'bg-danger-soft text-danger',
    icon: AlertTriangle,
  },
  warning: {
    label: 'Warning',
    wrap: 'border-l-warn',
    badge: 'bg-warn-soft text-warn',
    icon: AlertTriangle,
  },
  info: {
    label: 'Cleared',
    wrap: 'border-l-brand',
    badge: 'bg-brand-soft text-brand-dark',
    icon: CheckCircle2,
  },
}

const RECOMMENDATION: Record<
  IssueRecommendation,
  { label: string; icon: LucideIcon; tone: string }
> = {
  escalate_supervisor: {
    label: 'Escalate to supervisor',
    icon: ArrowUpRight,
    tone: 'text-danger',
  },
  reassign_specialist: {
    label: 'Reassign to a specialist',
    icon: UserCog,
    tone: 'text-warn',
  },
  reject_case: { label: 'Reject case', icon: Ban, tone: 'text-danger' },
  proceed: { label: 'Proceed', icon: CheckCircle2, tone: 'text-brand-dark' },
}

const SEVERITY_RANK: Record<IssueSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
}

export function ComplianceReviewStep() {
  const { state } = useWorkspace()
  const { run, runningAction } = useSimulatedAgentRun()
  const status = state.stepStatuses.compliance_review
  const hasRun = status === 'complete' || status === 'needs_info'
  const formsDone =
    state.stepStatuses.required_forms === 'complete' ||
    state.stepStatuses.required_forms === 'needs_info'
  const escalation = status === 'needs_info'
  const running = runningAction === 'compliance'

  const issues = [...state.complianceIssues].sort(
    (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity],
  )

  const downloadReport = () => {
    const customer = CUSTOMERS[state.activeCustomerId]
    const caseId = state.activeCaseId ?? 'CASE'
    const lines: string[] = [
      'FIDELITY RETIREMENT SERVICING — COMPLIANCE REVIEW REPORT',
      '='.repeat(60),
      `Case:      ${caseId}`,
      `Customer:  ${customer.name} (${customer.customer_id})`,
      `Goal:      ${goalLabel(state.selectedGoalId)}`,
      `Outcome:   ${escalation ? 'ESCALATION REQUIRED' : 'CLEARED FOR RESPONSE'}`,
      '',
      'FINDINGS',
      '-'.repeat(60),
    ]
    issues.forEach((iss, i) => {
      lines.push(
        `${i + 1}. [${SEVERITY[iss.severity].label.toUpperCase()}] ${iss.title}`,
        `   Detail:         ${iss.detail}`,
        `   Recommendation: ${RECOMMENDATION[iss.recommendation].label} — ${iss.recommendationDetail}`,
        '',
      )
    })
    lines.push(
      'This report was prepared with AI assistance and reviewed by the servicing associate.',
    )
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${caseId}-compliance-report.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast({
      variant: 'info',
      title: 'Report downloaded',
      description: 'Compliance report prepared for the case file.',
    })
  }

  return (
    <div className="flex flex-1 flex-col space-y-5">
      <StepHeader
        eyebrow="Guided Case Workspace"
        title="Compliance Review"
        description="The agent reviews the case against approved language and escalation policy, then flags anything that blocks a standard rollover."
        status={status}
      >
        <Popover>
          <PopoverTrigger className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Info className="h-3.5 w-3.5 text-secondary" />
            Guardrails
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">
              <ShieldCheck className="h-3.5 w-3.5 text-brand" />
              Guardrails enforced
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Deterministic, code-only checks that run on every response — the
              model cannot argue past them.
            </p>
            <ul className="mt-3 space-y-1.5">
              {GUARDRAILS.map((g) => (
                <li key={g} className="flex items-center gap-2 text-sm text-ink">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-brand" />
                  {g}
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      </StepHeader>

      {hasRun && (
        <Card
          className={cn(
            'border-l-4 animate-fade-in',
            escalation ? 'border-l-warn' : 'border-l-brand',
          )}
        >
          <CardContent className="flex items-start gap-3 p-5">
            <span
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                escalation
                  ? 'bg-warn-soft text-warn'
                  : 'bg-brand-soft text-brand-dark',
              )}
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
                  : 'No compliance blockers — cleared for a response'}
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                {escalation
                  ? 'System data triggered an escalation. Do not proceed as a standard rollover — follow the recommendations below.'
                  : 'Identity verified, no restrictions, and rollover permitted. The agent may draft a compliant customer response.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed compliance notes */}
      {running && !hasRun ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      ) : hasRun ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-ink">Compliance notes</h3>
          {issues.map((iss) => (
            <ComplianceIssueCard key={iss.id} issue={iss} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <ScrollText className="h-6 w-6 text-muted-foreground" />
            <p className="max-w-sm text-sm text-muted-foreground">
              {formsDone
                ? 'Run the compliance check below to surface any blockers and recommendations.'
                : 'Complete the Required Forms step first.'}
            </p>
          </CardContent>
        </Card>
      )}

      <StickyActionBar>
        <StepNav>
          {hasRun && (
            <Button variant="outline" onClick={downloadReport}>
              <Download />
              Download Report
            </Button>
          )}
          <Button
            variant={hasRun ? 'outline' : 'default'}
            disabled={runningAction !== null || !formsDone}
            onClick={() => run('compliance')}
          >
            {running ? <Loader2 className="animate-spin" /> : <ScrollText />}
            {running
              ? 'Agent working…'
              : hasRun
                ? 'Re-run check'
                : 'Check Compliance'}
          </Button>
        </StepNav>
      </StickyActionBar>
    </div>
  )
}

function ComplianceIssueCard({ issue }: { issue: ComplianceIssue }) {
  const sev = SEVERITY[issue.severity]
  const rec = RECOMMENDATION[issue.recommendation]
  const SevIcon = sev.icon
  const RecIcon = rec.icon
  return (
    <Card className={cn('border-l-4 animate-fade-in', sev.wrap)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <SevIcon
              className={cn(
                'mt-0.5 h-4 w-4 shrink-0',
                issue.severity === 'info' ? 'text-brand' : 'text-warn',
                issue.severity === 'critical' && 'text-danger',
              )}
            />
            <p className="text-sm font-semibold text-ink">{issue.title}</p>
          </div>
          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
              sev.badge,
            )}
          >
            {sev.label}
          </span>
        </div>
        <p className="mt-1.5 pl-6 text-sm leading-relaxed text-ink-soft">
          {issue.detail}
        </p>
        <div className="mt-3 ml-6 flex items-start gap-2 rounded-lg border border-border bg-background/60 p-2.5">
          <RecIcon className={cn('mt-0.5 h-4 w-4 shrink-0', rec.tone)} />
          <div>
            <p className={cn('text-xs font-semibold', rec.tone)}>{rec.label}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
              {issue.recommendationDetail}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
