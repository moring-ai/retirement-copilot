import { useEffect, useRef } from 'react'
import { CheckCircle2, Circle, ArrowRight, PenLine } from 'lucide-react'
import { useWorkspace } from '@/state/WorkspaceContext'
import { useRegisterIslandActions } from '@/lib/island-store'
import { StepHeader } from './StepHeader'
import { StepConfirm } from './StepConfirm'
import { ResponseEditor } from '@/components/response/ResponseEditor'
import { cn } from '@/lib/utils'

function ApprovalRow({
  checked,
  onToggle,
  title,
  hint,
}: {
  checked: boolean
  onToggle: () => void
  title: string
  hint: string
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors',
        checked
          ? 'border-brand/30 bg-brand-soft/60'
          : 'border-border bg-card hover:bg-muted',
      )}
    >
      {checked ? (
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
      ) : (
        <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
      )}
      <div>
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
    </button>
  )
}

export function ResponseStep() {
  const { state, dispatch } = useWorkspace()
  const hasDraft = state.draftText.length > 0
  const approved = state.responseApproved

  // Approving the response completes the step and moves straight to Review.
  const approve = () => {
    dispatch({ type: 'SET_RESPONSE_APPROVED', approved: true })
    dispatch({ type: 'SET_STEP_STATUS', step: 'response', status: 'complete' })
    dispatch({ type: 'SELECT_STEP', step: 'review' })
  }

  // Auto-scroll to the generated draft once the agent finishes writing it.
  const draftRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (hasDraft) {
      draftRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [hasDraft])

  useRegisterIslandActions(
    () => ({
      stepId: 'response',
      title: approved ? 'Response approved' : 'Review & approve',
      hint: approved
        ? 'Approved — sent to the final review'
        : 'Approve the response to continue',
      actions: hasDraft
        ? [
            {
              id: 'approve',
              label: 'Approve & Continue',
              primary: true,
              icon: ArrowRight,
              onClick: approve,
            },
          ]
        : [],
    }),
    [hasDraft, approved],
  )

  return (
    <div className="flex flex-1 flex-col space-y-5">
      <StepHeader
        eyebrow="Guided Case Workspace"
        title="Response"
        description="An editable, policy-grounded response the associate reviews, directs, and approves before anything is sent to the customer."
        status={state.stepStatuses.response}
      />

      <ResponseEditor />

      {hasDraft && (
        <div ref={draftRef} className="scroll-mt-24">
          <ApprovalRow
            checked={approved}
            onToggle={() => {
              if (!approved) approve()
              else dispatch({ type: 'SET_RESPONSE_APPROVED', approved: false })
            }}
            title="Approve the response"
            hint="Checking this approves the response and moves to the final review."
          />
        </div>
      )}

      {hasDraft && (
        <StepConfirm
          tone={approved ? 'success' : 'info'}
          icon={approved ? CheckCircle2 : PenLine}
          title={approved ? 'Response approved' : 'Review & approve the response'}
          description={
            approved
              ? 'You’ve approved the response — continuing to the final review.'
              : 'Review the draft above (direct the AI to adjust it if needed), then approve to continue.'
          }
        />
      )}
    </div>
  )
}
