import {
  Paperclip,
  FileText,
  CheckCircle2,
  Circle,
  AlertTriangle,
} from 'lucide-react'
import { useWorkspace } from '@/state/WorkspaceContext'
import { StepHeader } from './StepHeader'
import { StickyActionBar } from '@/components/layout/StickyActionBar'
import { StepNav } from '@/components/layout/StepNav'
import { ResponseEditor } from '@/components/response/ResponseEditor'
import { Card, CardContent } from '@/components/ui/card'
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
  const escalation = state.stepStatuses.compliance_review === 'needs_info'
  const docNeeded = escalation
  const canContinue =
    hasDraft && state.responseApproved && (!docNeeded || state.complianceDocApproved)

  return (
    <div className="flex flex-1 flex-col space-y-5">
      <StepHeader
        eyebrow="Guided Case Workspace"
        title="Response"
        description="An editable, policy-grounded response the associate reviews, directs, and approves before anything is sent to the customer."
        status={state.stepStatuses.response}
      />

      <ResponseEditor />

      {docNeeded && hasDraft && (
        <Card className="border-l-4 border-l-warn animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
              <div>
                <p className="text-sm font-semibold text-ink">
                  Compliance report attached
                </p>
                <p className="mt-0.5 text-sm text-ink-soft">
                  This case was flagged in compliance review. The compliance
                  report is attached to this response and must be approved
                  alongside it.
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-border bg-background/60 px-3 py-2">
              <Paperclip className="h-4 w-4 text-secondary" />
              <FileText className="h-4 w-4 text-secondary" />
              <span className="flex-1 truncate text-sm font-medium text-ink">
                {state.activeCaseId ?? 'CASE'}-compliance-report.txt
              </span>
              <span className="text-[11px] text-muted-foreground">attached</span>
            </div>
          </CardContent>
        </Card>
      )}

      {hasDraft && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ApprovalRow
            checked={state.responseApproved}
            onToggle={() => {
              const next = !state.responseApproved
              dispatch({ type: 'SET_RESPONSE_APPROVED', approved: next })
              dispatch({
                type: 'SET_STEP_STATUS',
                step: 'response',
                status: next ? 'complete' : 'in_progress',
              })
            }}
            title="Approve the response"
            hint="I have reviewed and approve this customer response."
          />
          {docNeeded && (
            <ApprovalRow
              checked={state.complianceDocApproved}
              onToggle={() =>
                dispatch({
                  type: 'SET_COMPLIANCE_DOC_APPROVED',
                  approved: !state.complianceDocApproved,
                })
              }
              title="Approve the compliance report"
              hint="I approve the attached compliance report."
            />
          )}
        </div>
      )}

      <StickyActionBar>
        <StepNav
          nextDisabled={!canContinue}
          nextHint={
            !hasDraft
              ? 'Generate a response first'
              : docNeeded
                ? 'Approve the response and report'
                : 'Approve the response to continue'
          }
        />
      </StickyActionBar>
    </div>
  )
}
