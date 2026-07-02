import { useWorkspace } from '@/state/WorkspaceContext'
import { StepHeader } from './StepHeader'
import { DraftResponseEditor } from '@/components/draft/DraftResponseEditor'

export function DraftResponseStep() {
  const { state } = useWorkspace()
  return (
    <div className="space-y-5">
      <StepHeader
        eyebrow="Guided Case Workspace"
        title="Draft Response"
        description="An editable, policy-grounded response the associate reviews, edits, and approves before anything is sent to the customer."
        status={state.stepStatuses.draft_response}
      />
      <DraftResponseEditor />
    </div>
  )
}
