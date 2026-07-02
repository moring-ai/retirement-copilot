import { BadgeCheck, Send, CircleDot, CheckCircle2 } from 'lucide-react'
import { useWorkspace } from '@/state/WorkspaceContext'
import { STEP_LABELS, STEP_ORDER } from '@/state/workspace-reducer'
import { StepHeader } from './StepHeader'
import { StatusBadge } from '@/components/sidebar/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'

export function FinalApprovalStep() {
  const { state } = useWorkspace()
  const reviewDone = state.reviewQueue.filter((i) => i.checked).length
  const reviewTotal = state.reviewQueue.length
  const allStepsClear = STEP_ORDER.filter((s) => s !== 'final_approval').every(
    (s) => state.stepStatuses[s] === 'complete',
  )
  const readyToSubmit = reviewDone === reviewTotal && allStepsClear

  return (
    <div className="space-y-5">
      <StepHeader
        eyebrow="Guided Case Workspace"
        title="Final Associate Approval"
        description="Confirm every step is complete and the review queue is cleared before submitting the case for a reviewer."
        status={state.stepStatuses.final_approval}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="normal-case tracking-normal text-ink">
              Workflow Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {STEP_ORDER.filter((s) => s !== 'final_approval').map((s) => (
              <div
                key={s}
                className="flex items-center justify-between border-b border-border py-1.5 last:border-0"
              >
                <span className="text-sm text-ink-soft">{STEP_LABELS[s]}</span>
                <StatusBadge status={state.stepStatuses[s]} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="normal-case tracking-normal text-ink">
              Review Queue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {state.reviewQueue.map((item) => (
              <div key={item.id} className="flex items-center gap-2 py-1.5">
                {item.checked ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-brand" />
                ) : (
                  <CircleDot className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span
                  className={
                    item.checked
                      ? 'text-sm text-muted-foreground line-through'
                      : 'text-sm text-ink'
                  }
                >
                  {item.label}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className={readyToSubmit ? 'border-l-4 border-l-brand' : undefined}>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-brand-dark">
              <BadgeCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">
                {readyToSubmit
                  ? 'Ready to submit for review'
                  : 'Complete all steps and review items to submit'}
              </p>
              <p className="text-xs text-muted-foreground">
                {reviewDone}/{reviewTotal} review items done ·{' '}
                {allStepsClear ? 'all steps complete' : 'steps outstanding'}
              </p>
            </div>
          </div>
          <Button
            disabled={!readyToSubmit}
            onClick={() =>
              toast({
                variant: 'success',
                title: 'Submitted for review',
                description: 'Case sent to a retirement servicing reviewer.',
              })
            }
          >
            <Send />
            Submit for Review
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
