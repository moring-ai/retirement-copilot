import { useWorkspace } from '@/state/WorkspaceContext'
import { CUSTOMERS } from '@/data/customers'
import { CustomerSnapshotStep } from './CustomerSnapshotStep'
import { GoalEligibilityStep } from './GoalEligibilityStep'
import { RequiredFormsStep } from './RequiredFormsStep'
import { ComplianceReviewStep } from './ComplianceReviewStep'
import { ResponseStep } from './ResponseStep'
import { ReviewStep } from './ReviewStep'

export function StepPanel() {
  const { state } = useWorkspace()
  const customer = CUSTOMERS[state.activeCustomerId]

  switch (state.activeStep) {
    case 'customer_snapshot':
      return <CustomerSnapshotStep customer={customer} />
    case 'goal_eligibility':
      return <GoalEligibilityStep customer={customer} />
    case 'required_forms':
      return <RequiredFormsStep />
    case 'compliance_review':
      return <ComplianceReviewStep />
    case 'response':
      return <ResponseStep />
    case 'review':
      return <ReviewStep />
    default:
      return null
  }
}
