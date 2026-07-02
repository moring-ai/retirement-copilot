import type { Customer } from '@/types'
import { useWorkspace } from '@/state/WorkspaceContext'
import { StepHeader } from './StepHeader'
import { CustomerDetailsCard } from '@/components/eligibility/CustomerDetailsCard'
import { ActionButtonRow } from '@/components/eligibility/ActionButtonRow'
import { EligibilityResultCard } from '@/components/eligibility/EligibilityResultCard'
import { RolloverPathCard } from '@/components/eligibility/RolloverPathCard'
import { MissingInformationCard } from '@/components/eligibility/MissingInformationCard'
import { RecommendedActionCard } from '@/components/eligibility/RecommendedActionCard'
import { FindingsCard } from '@/components/eligibility/FindingsCard'

export function EligibilityCheckStep({ customer }: { customer: Customer }) {
  const { state } = useWorkspace()
  const formsRun =
    state.stepStatuses.required_forms === 'complete' ||
    state.stepStatuses.required_forms === 'needs_info'

  return (
    <div className="space-y-5">
      <StepHeader
        eyebrow="Guided Case Workspace"
        title="Eligibility Check"
        description="Confirm whether this 401(k)-to-IRA rollover can proceed as a standard case. The agent checks customer data and approved policy, then surfaces its findings for your review."
        status={state.stepStatuses.eligibility_check}
      />

      <CustomerDetailsCard customer={customer} />

      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-soft">
          Agent Actions
        </p>
        <ActionButtonRow />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <EligibilityResultCard result={state.eligibilityResult} />
        <RolloverPathCard path={state.rolloverPath} />
        <MissingInformationCard
          items={state.missingInformation}
          hasRun={formsRun}
        />
        <RecommendedActionCard text={state.recommendedAction} />
      </div>

      {state.findings.length > 0 && <FindingsCard findings={state.findings} />}
    </div>
  )
}
