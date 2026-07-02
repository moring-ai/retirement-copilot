import { User, Landmark, FileText, Wallet } from 'lucide-react'
import type { Customer, DocumentState } from '@/types'
import { useWorkspace } from '@/state/WorkspaceContext'
import { StepHeader } from './StepHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'

const DOC_BADGE: Record<
  DocumentState,
  { variant: 'default' | 'warn' | 'neutral'; label: string }
> = {
  complete: { variant: 'default', label: 'Complete' },
  incomplete: { variant: 'warn', label: 'Incomplete' },
  missing: { variant: 'warn', label: 'Missing' },
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium text-ink">{value}</span>
    </div>
  )
}

export function CustomerSnapshotStep({ customer }: { customer: Customer }) {
  const { state } = useWorkspace()
  return (
    <div className="space-y-5">
      <StepHeader
        eyebrow="Guided Case Workspace"
        title="Customer Snapshot"
        description="A consolidated view of the customer's profile, accounts, and document status — pulled from customer systems for context."
        status={state.stepStatuses.customer_snapshot}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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

        <Card>
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
            <Row
              label="Existing Fidelity IRA"
              value={customer.has_existing_fidelity_ira ? 'On file' : 'None on file'}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-secondary" />
              <CardTitle className="normal-case tracking-normal text-ink">
                Document Status
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {(
              [
                ['IRA application', customer.documents.ira_application],
                [
                  'Rollover request form',
                  customer.documents.rollover_request_form,
                ],
                [
                  'Identity verification',
                  customer.documents.identity_verification,
                ],
              ] as [string, DocumentState][]
            ).map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2"
              >
                <span className="text-sm text-ink">{label}</span>
                <Badge variant={DOC_BADGE[value].variant}>
                  {DOC_BADGE[value].label}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
