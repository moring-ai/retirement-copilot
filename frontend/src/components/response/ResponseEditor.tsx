import { useEffect, useState } from 'react'
import {
  Sparkles,
  RefreshCw,
  Copy,
  PenLine,
  ShieldCheck,
  Loader2,
  Wand2,
  SendHorizonal,
  Info,
  CheckCircle2,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import { useWorkspace } from '@/state/WorkspaceContext'
import { useSimulatedAgentRun } from '@/hooks/useSimulatedAgentRun'
import { toast } from '@/components/ui/use-toast'

// The deterministic, code-only guardrails the agent works within — surfaced
// here as an info popover (same content the compliance step enforces).
const GUARDRAILS = [
  'No personalized investment advice',
  'No unsupported tax or legal advice',
  'No trade execution or money movement',
  'Customer PII redacted from the draft',
]

const REWRITE_PRESETS = ['More concise', 'More explanatory', 'Warmer', 'More formal']

/** Apply the associate's plain-language rewrite instruction to the draft. */
function rewrite(current: string, direction: string): string {
  const d = direction.toLowerCase()
  const note = `\n\n(Revised per associate direction: “${direction.trim()}”.)`
  if (/short|concise|brief|trim/.test(d)) {
    const paras = current.split('\n\n')
    return [paras[0], paras[1], paras[paras.length - 1]].filter(Boolean).join('\n\n') + note
  }
  if (/explan|detail|thorough|elaborat/.test(d)) {
    return (
      current +
      '\n\nHappy to expand on any part: your former plan sends the funds directly to Fidelity, we deposit them into your new IRA, and you receive written confirmation at each step. Reach out any time and we can walk through it together.' +
      note
    )
  }
  if (/warm|friendl|personal|empath/.test(d)) {
    return current.replace(
      /^Hi ([^,]+),/,
      'Hi $1,\n\nThank you so much for trusting us with this — we’re glad to help.',
    ) + note
  }
  if (/formal|professional/.test(d)) {
    return current.replace(/^Hi /, 'Dear ') + note
  }
  return current + note
}

export function ResponseEditor() {
  const { state, dispatch } = useWorkspace()
  const { run, runningAction } = useSimulatedAgentRun()
  const hasDraft = state.draftText.length > 0
  const generating = runningAction === 'draft'
  const [direction, setDirection] = useState('')
  const [rewriting, setRewriting] = useState(false)

  const formsReady =
    state.stepStatuses.required_forms === 'complete' ||
    state.stepStatuses.required_forms === 'needs_info'

  // Autopilot: the agent drafts the response on arrival; the associate then
  // reviews and approves it. Guarded on state (not a ref) so it is
  // StrictMode-safe.
  useEffect(() => {
    if (formsReady && !hasDraft && runningAction === null) {
      run('draft')
    }
  }, [formsReady, hasDraft, runningAction, run])

  const doRewrite = (preset?: string) => {
    const instruction = (preset ?? direction).trim()
    if (!instruction) return
    setRewriting(true)
    window.setTimeout(() => {
      dispatch({ type: 'SET_DRAFT_TEXT', text: rewrite(state.draftText, instruction) })
      dispatch({ type: 'SET_RESPONSE_APPROVED', approved: false })
      setRewriting(false)
      setDirection('')
      toast({
        variant: 'info',
        title: 'Response rewritten',
        description: `Draft updated: “${instruction}”.`,
      })
    }, 1200)
  }

  return (
    <Card>
      <CardHeader className="border-b border-border pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary/10">
              <Sparkles className="h-4 w-4 text-secondary" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">Response</p>
              <Badge variant="warn" className="mt-0.5">
                AI-generated — associate review required
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Info className="h-3.5 w-3.5 text-secondary" />
                Guardrails
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  <ShieldCheck className="h-3.5 w-3.5 text-brand" />
                  How the AI is bounded
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Deterministic, code-only checks run on every response — the
                  model cannot argue past them.
                </p>
                <ul className="mt-3 space-y-1.5">
                  {GUARDRAILS.map((g) => (
                    <li key={g} className="flex items-center gap-2 text-sm text-ink">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-brand" />
                      {g}
                    </li>
                  ))}
                </ul>
              </PopoverContent>
            </Popover>

            {hasDraft && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard?.writeText(state.draftText)
                    toast({ variant: 'info', title: 'Response copied to clipboard' })
                  }}
                >
                  <Copy />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={runningAction !== null || rewriting}
                  onClick={() => run('draft')}
                >
                  <RefreshCw />
                  Regenerate
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-4">
        <div className="flex items-start gap-2.5 rounded-lg border border-secondary/20 bg-accent px-3 py-2.5">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
          <p className="text-xs leading-relaxed text-accent-foreground">
            Guardrails applied: no investment or tax advice, no money-movement
            instructions, and customer PII is kept out of the draft. Tax
            questions are deferred to a qualified professional.
          </p>
        </div>

        {rewriting ? (
          <div className="space-y-2 rounded-md border border-border bg-background/60 p-4">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ) : hasDraft || generating ? (
          <Textarea
            value={state.draftText}
            onChange={(e) => dispatch({ type: 'SET_DRAFT_TEXT', text: e.target.value })}
            placeholder={generating ? 'Drafting…' : ''}
            className="min-h-[320px] resize-y font-sans text-sm leading-relaxed"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-background/60 px-6 py-10 text-center">
            <PenLine className="h-6 w-6 text-muted-foreground" />
            <p className="max-w-sm text-sm text-muted-foreground">
              No response yet. Generate an editable, policy-grounded draft for
              your review.
            </p>
            <Button
              disabled={runningAction !== null || !formsReady}
              onClick={() => run('draft')}
            >
              {generating ? <Loader2 className="animate-spin" /> : <Sparkles />}
              Generate Response
            </Button>
          </div>
        )}

        {/* AI rewrite direction */}
        {hasDraft && (
          <div className="rounded-lg border border-border bg-background/60 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
              <Wand2 className="h-3.5 w-3.5 text-secondary" />
              Direct the AI
            </p>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {REWRITE_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={rewriting}
                  onClick={() => doRewrite(p)}
                  className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-ink-soft transition-colors hover:border-secondary/40 hover:bg-muted disabled:opacity-50"
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={direction}
                onChange={(e) => setDirection(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && doRewrite()}
                placeholder="Or type your own: make it warmer, shorter, more formal…"
                disabled={rewriting}
              />
              <Button onClick={() => doRewrite()} disabled={rewriting || !direction.trim()}>
                {rewriting ? <Loader2 className="animate-spin" /> : <SendHorizonal />}
                Rewrite
              </Button>
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Give an instruction and the AI revises the draft — your edits above
              are the source of truth.
            </p>
          </div>
        )}

        <p className="text-[11px] italic text-muted-foreground">
          This response is a starting point produced with AI assistance. The
          associate edits, verifies, and approves it before any customer
          communication is sent.
        </p>
      </CardContent>
    </Card>
  )
}
