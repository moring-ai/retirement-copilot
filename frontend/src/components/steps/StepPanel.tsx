import { useWorkspace } from '@/state/WorkspaceContext'
import { CUSTOMERS } from '@/data/customers'
import { CustomerSnapshotStep } from './CustomerSnapshotStep'
import { RolloverGoalStep } from './RolloverGoalStep'
import { EligibilityCheckStep } from './EligibilityCheckStep'
import { RequiredFormsStep } from './RequiredFormsStep'
import { ComplianceReviewStep } from './ComplianceReviewStep'
import { DraftResponseStep } from './DraftResponseStep'
import { FinalApprovalStep } from './FinalApprovalStep'

export function StepPanel() {
  const { state } = useWorkspace()
  const customer = CUSTOMERS[state.activeCustomerId]

  switch (state.activeStep) {
    case 'customer_snapshot':
      return <CustomerSnapshotStep customer={customer} />
    case 'rollover_goal':
      return <RolloverGoalStep customer={customer} />
    case 'eligibility_check':
      return <EligibilityCheckStep customer={customer} />
    case 'required_forms':
      return <RequiredFormsStep />
    case 'compliance_review':
      return <ComplianceReviewStep />
    case 'draft_response':
      return <DraftResponseStep />
    case 'final_approval':
      return <FinalApprovalStep />
    default:
      return null
  }
}
