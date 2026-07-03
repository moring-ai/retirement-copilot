import { User, Landmark, Wallet, ShieldCheck, ArrowRight } from 'lucide-react'
import type { Customer } from '@/types'
import { useWorkspace } from '@/state/WorkspaceContext'
import { useRegisterIslandActions } from '@/lib/island-store'
import { StepHeader } from './StepHeader'
import { IdentityGate } from '@/components/customer/IdentityGate'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium text-ink">{value}</span>
    </div>
  )
}

export function CustomerSnapshotStep({ customer }: { customer: Customer }) {
  const { state, dispatch } = useWorkspace()

  useRegisterIslandActions(
    () => ({
      stepId: 'customer_snapshot',
      title: state.identityVerified ? 'Profile confirmed' : 'Verify the customer',
      hint: state.identityVerified
        ? 'Continue to capture the rollover goal'
        : 'Confirm the customer’s identity to continue',
      actions: state.identityVerified
        ? [
            {
              id: 'continue',
              label: 'Continue to Goal & Eligibility',
              primary: true,
              icon: ArrowRight,
              onClick: () =>
                dispatch({ type: 'SELECT_STEP', step: 'goal_eligibility' }),
            },
          ]
        : [],
    }),
    [state.identityVerified],
  )

  return (
    <div className="flex flex-1 flex-col space-y-5">
      <StepHeader
        eyebrow="Guided Case Workspace"
        title="Customer Snapshot"
        description="Verify the customer, then review their profile and accounts — pulled from customer systems for context."
        status={state.stepStatuses.customer_snapshot}
      />

      {!state.identityVerified ? (
        <div className="flex flex-1 items-start justify-center pt-4">
          <IdentityGate
            customer={customer}
            onVerified={() => {
              dispatch({ type: 'VERIFY_IDENTITY' })
              toast({
                variant: 'success',
                title: 'Identity verified',
                description: `${customer.name} confirmed. Profile unlocked.`,
              })
            }}
          />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 rounded-lg border border-brand/20 bg-brand-soft px-4 py-2.5 animate-fade-in">
            <ShieldCheck className="h-4 w-4 shrink-0 text-brand-dark" />
            <p className="text-sm text-brand-dark">
              <span className="font-semibold">Identity verified</span> — you are
              viewing {customer.name} ({customer.customer_id}).
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 animate-fade-in">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-secondary" />
                  <CardTitle className="normal-case tracking-normal text-ink">
                    Profile
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Row label="Name" value={customer.name} />
                <Row label="Customer ID" value={customer.customer_id} />
                <Row label="Age" value={`${customer.age}`} />
                <Row label="Employment" value={customer.employment_status} />
                <Row label="Veteran status" value={customer.veteran_status} />
                <Row label="State" value={customer.state} />
                <Row
                  label="Contact preference"
                  value={customer.contact_preference}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-secondary" />
                  <CardTitle className="normal-case tracking-normal text-ink">
                    Source Plan
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Row label="Description" value={customer.source_plan.description} />
                <Row label="Provider" value={customer.source_plan.plan_provider} />
                <Row label="Plan type" value={customer.source_plan.plan_type} />
                <Row
                  label="Estimated balance"
                  value={formatCurrency(customer.source_plan.balance_estimate)}
                />
                <Row
                  label="Rollover allowed"
                  value={
                    customer.source_plan.rollover_allowed === true
                      ? 'Yes'
                      : customer.source_plan.rollover_allowed === false
                        ? 'No'
                        : 'Unknown'
                  }
                />
                <Row
                  label="Outstanding plan loan"
                  value={customer.source_plan.outstanding_plan_loan ? 'Yes' : 'No'}
                />
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-secondary" />
                  <CardTitle className="normal-case tracking-normal text-ink">
                    Existing Fidelity Accounts
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {customer.retirement_accounts.map((a) => (
                  <div
                    key={a.account_id}
                    className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">{a.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.account_id} · {a.provider}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-ink">
                      {formatCurrency(a.balance_estimate)}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm text-muted-foreground">
                    Existing Fidelity IRA
                  </span>
                  <Badge
                    variant={customer.has_existing_fidelity_ira ? 'blue' : 'neutral'}
                  >
                    {customer.has_existing_fidelity_ira ? 'On file' : 'None on file'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

        </>
      )}
    </div>
  )
}
