import { Sparkles, RefreshCw, Copy, PenLine } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { DraftGuardrailNotice } from './DraftGuardrailNotice'
import { useWorkspace } from '@/state/WorkspaceContext'
import { useSimulatedAgentRun } from '@/hooks/useSimulatedAgentRun'
import { toast } from '@/components/ui/use-toast'

export function DraftResponseEditor() {
  const { state, dispatch } = useWorkspace()
  const { run, runningAction } = useSimulatedAgentRun()
  const hasDraft = state.draftText.length > 0
  const generating = runningAction === 'draft'

  return (
    <Card>
      <CardHeader className="border-b border-border pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary/10">
              <Sparkles className="h-4 w-4 text-secondary" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">Draft Response</p>
              <Badge variant="warn" className="mt-0.5">
                AI-generated draft — associate review required
              </Badge>
            </div>
          </div>
          {hasDraft && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard?.writeText(state.draftText)
                  toast({ variant: 'info', title: 'Draft copied to clipboard' })
                }}
              >
                <Copy />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={runningAction !== null}
                onClick={() => run('draft')}
              >
                <RefreshCw />
                Regenerate
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        <DraftGuardrailNotice />
        {hasDraft || generating ? (
          <Textarea
            value={state.draftText}
            onChange={(e) =>
              dispatch({ type: 'SET_DRAFT_TEXT', text: e.target.value })
            }
            placeholder={generating ? 'Drafting…' : ''}
            className="min-h-[340px] resize-y font-sans text-sm leading-relaxed"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-background/60 px-6 py-10 text-center">
            <PenLine className="h-6 w-6 text-muted-foreground" />
            <p className="max-w-sm text-sm text-muted-foreground">
              No draft yet. Run{' '}
              <span className="font-medium text-ink">Generate Draft Response</span>{' '}
              from the Eligibility Check step (after the compliance review) to
              produce an editable, policy-grounded draft for your review.
            </p>
            <Button
              disabled={
                runningAction !== null ||
                !(
                  state.stepStatuses.compliance_review === 'complete' ||
                  state.stepStatuses.compliance_review === 'needs_info'
                )
              }
              onClick={() => run('draft')}
            >
              <Sparkles />
              Generate Draft Response
            </Button>
          </div>
        )}
        <p className="text-[11px] italic text-muted-foreground">
          This draft is a starting point produced with AI assistance. The
          associate edits, verifies, and approves it before any customer
          communication is sent.
        </p>
      </CardContent>
    </Card>
  )
}
