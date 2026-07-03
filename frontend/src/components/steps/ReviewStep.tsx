import {
  User,
  Target,
  ShieldCheck,
  ShieldAlert,
  FileText,
  CheckCircle2,
  PenLine,
  PauseCircle,
  XCircle,
  Home,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useWorkspace } from '@/state/WorkspaceContext'
import { useRegisterIslandActions } from '@/lib/island-store'
import { CUSTOMERS } from '@/data/customers'
import { goalLabel } from '@/data/goals'
import { StepHeader } from './StepHeader'
import { StepConfirm } from './StepConfirm'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

function SummarySection({
  icon: Icon,
  title,
  children,
  tone = 'default',
}: {
  icon: LucideIcon
  title: string
  children: ReactNode
  tone?: 'default' | 'warn' | 'brand'
}) {
  return (
    <Card
      className={cn(
        'animate-fade-in',
        tone === 'warn' && 'border-l-4 border-l-warn',
        tone === 'brand' && 'border-l-4 border-l-brand',
      )}
    >
      <CardContent className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <Icon className="h-4 w-4 text-secondary" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            {title}
          </h3>
        </div>
        {children}
      </CardContent>
    </Card>
  )
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-1.5 last:border-0">
      <span className="text-sm text-muted-foreground">{k}</span>
      <span className="text-right text-sm font-medium text-ink">{v}</span>
    </div>
  )
}

export function ReviewStep() {
  const { state, dispatch } = useWorkspace()
  const customer = CUSTOMERS[state.activeCustomerId]
  const result = state.eligibilityResult
  const verifiedForms = state.uploadedForms.filter((f) => f.status === 'verified')
  const submitted = state.stepStatuses.review === 'complete'

  const ready =
    state.identityVerified &&
    state.selectedGoalId !== null &&
    result !== null &&
    state.responseApproved

  const caseId = state.activeCaseId ?? customer.customer_id

  const approve = () => {
    dispatch({ type: 'SET_STEP_STATUS', step: 'review', status: 'complete' })
    toast({
      variant: 'success',
      title: 'Case approved',
      description: `${caseId} approved and finalised.`,
    })
  }

  const moveTo = (stage: 'pending' | 'rejected') => {
    if (state.activeCaseId)
      dispatch({ type: 'SET_CASE_STAGE', caseId: state.activeCaseId, stage })
    toast({
      variant: 'info',
      title: stage === 'pending' ? 'Moved to pending' : 'Case rejected',
      description: `${caseId} marked ${stage}.`,
    })
    dispatch({ type: 'GO_HOME' })
  }

  useRegisterIslandActions(
    () => ({
      stepId: 'review',
      title: submitted
        ? 'Submitted'
        : ready
          ? 'Ready to submit'
          : 'Complete the case',
      hint: submitted
        ? 'Sent to a reviewer'
        : 'Submit this case for a reviewer',
      actions: submitted
        ? [
            {
              id: 'home',
              label: 'Back to Cases',
              primary: true,
              variant: 'outline',
              icon: Home,
              onClick: () => dispatch({ type: 'GO_HOME' }),
            },
          ]
        : [
            {
              id: 'approve',
              label: 'Approve',
              primary: true,
              icon: CheckCircle2,
              disabled: !ready,
              onClick: approve,
              menu: [
                {
                  id: 'pending',
                  label: 'Move to Pending',
                  icon: PauseCircle,
                  onClick: () => moveTo('pending'),
                },
                {
                  id: 'reject',
                  label: 'Reject case',
                  icon: XCircle,
                  danger: true,
                  onClick: () => moveTo('rejected'),
                },
              ],
            },
          ],
    }),
    [submitted, ready],
  )

  return (
    <div className="flex flex-1 flex-col space-y-5">
      <StepHeader
        eyebrow="Guided Case Workspace"
        title="Review"
        description="A full summary of the case — customer, goal, eligibility, forms, and response — before it is submitted for a reviewer."
        status={state.stepStatuses.review}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SummarySection icon={User} title="Customer">
          <KV k="Name" v={customer.name} />
          <KV k="Customer ID" v={customer.customer_id} />
          <KV k="Identity" v={state.identityVerified ? 'Verified' : 'Not verified'} />
          <KV k="Contact" v={`${customer.contact_preference} · ${customer.state}`} />
        </SummarySection>

        <SummarySection icon={Target} title="Goal">
          <p className="text-sm font-medium text-ink">
            {goalLabel(state.selectedGoalId)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {customer.source_plan.description} → {customer.destination_account}
          </p>
        </SummarySection>

        <SummarySection
          icon={result?.eligible ? ShieldCheck : ShieldAlert}
          title="Eligibility"
          tone={result ? (result.eligible ? 'brand' : 'warn') : 'default'}
        >
          {result ? (
            <>
              <p className="text-sm font-semibold text-ink">{result.headline}</p>
              {state.recommendedAction && (
                <p className="mt-1 text-sm text-ink-soft">
                  {state.recommendedAction}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Eligibility check not yet run.
            </p>
          )}
        </SummarySection>

        <SummarySection icon={FileText} title="Forms">
          {state.requiredForms.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Required forms not yet identified.
            </p>
          ) : (
            <>
              <KV k="Required" v={`${state.requiredForms.length}`} />
              <KV k="Uploaded" v={`${state.uploadedForms.length}`} />
              <KV
                k="AI-verified"
                v={`${verifiedForms.length}/${state.uploadedForms.length || 0}`}
              />
            </>
          )}
        </SummarySection>

        <SummarySection icon={PenLine} title="Response">
          <div className="flex items-center gap-2">
            <Badge variant={state.responseApproved ? 'default' : 'neutral'}>
              {state.responseApproved ? 'Approved' : 'Not approved'}
            </Badge>
          </div>
          {state.draftText && (
            <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
              {state.draftText}
            </p>
          )}
        </SummarySection>
      </div>

      <StepConfirm
        tone={submitted || ready ? 'success' : 'info'}
        icon={submitted ? CheckCircle2 : PenLine}
        title={
          submitted
            ? 'Case approved'
            : ready
              ? 'Ready to approve'
              : 'Complete the case to approve'
        }
        description={
          submitted
            ? 'This case has been approved and finalised.'
            : ready
              ? 'Everything checks out — approve, or use the caret to move it to pending or reject.'
              : 'Identity, goal, eligibility, and an approved response are required before approving.'
        }
      />
    </div>
  )
}
