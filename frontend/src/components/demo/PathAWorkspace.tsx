import { useState } from 'react'
import {
  ArrowLeft,
  Sparkles,
  BookText,
  Info,
  Puzzle,
  Copy,
  Download,
  ExternalLink,
  MessageSquarePlus,
  SkipForward,
  RotateCcw,
} from 'lucide-react'
import type { DemoScenario } from '@/data/demo-scenarios'
import { useDemo } from '@/state/DemoContext'
import { AgentEvidencePanel } from './AgentEvidencePanel'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'

const PATH_A = '#1C6B50'

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// Path A — a simple, fast augmented-answer workspace. No workflow steps, no
// approval queue. The answer streams into a card that is visible immediately;
// sources and skills reveal as the agent uses them.
export function PathAWorkspace({ scenario }: { scenario: DemoScenario }) {
  const { answerLen, evidenceRevealed, phase, close, start, skip, replay } = useDemo()
  const [followupOpen, setFollowupOpen] = useState(false)
  const full = scenario.answer ?? ''
  const shown = full.slice(0, answerLen)
  const streaming = phase === 'running'
  const done = phase === 'result'

  // Progressive evidence: sources appear after the RAG retrieval event; each
  // skill chip appears as its skill reasoning event streams in.
  const revealed = scenario.reasoning.slice(0, evidenceRevealed)
  const sourcesShown = revealed.some((r) => r.kind === 'rag')
  const skillsShownCount = revealed.filter((r) => r.kind === 'skill').length
  const skillsShown = scenario.skills.slice(0, skillsShownCount)

  const copyAnswer = () => {
    navigator.clipboard?.writeText(full)
    toast({ title: 'Answer copied', variant: 'success' })
  }
  const exportAnswer = () => {
    const text = [`Q: ${scenario.question}`, '', full, '', scenario.caveat ?? '', '', `Sources: ${scenario.ragSources.map((s) => s.id).join(', ')}`].join('\n')
    downloadText('rollover-answer.txt', text)
    toast({ title: 'Answer exported', description: 'rollover-answer.txt', variant: 'info' })
  }

  return (
    <div className="flex h-full flex-col">
      {/* top bar */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-4 py-3">
        <button type="button" onClick={close} className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:bg-muted">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="mx-1 h-5 w-px bg-border" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">Rollover options</p>
          <p className="truncate text-[11px] text-muted-foreground">{scenario.persona}</p>
        </div>
        {streaming ? (
          <Button size="sm" variant="ghost" onClick={skip}><SkipForward className="h-4 w-4" /> Skip</Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={replay}><RotateCcw className="h-4 w-4" /> Replay</Button>
        )}
        <span className="rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider" style={{ background: PATH_A + '15', color: PATH_A, border: `1px solid ${PATH_A}33` }}>
          Path A · Augmented LLM
        </span>
      </div>

      <div className="flex min-h-0 flex-1">
        <main className="scrollbar-slim min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1400px] px-6 py-6 lg:px-10">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
              {/* LEFT — question + answer */}
              <div className="min-w-0 space-y-4">
                {/* question */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Question</p>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-ink">“{scenario.question}”</p>
                </div>

                {/* action bar */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" onClick={copyAnswer} disabled={!done}><Copy className="h-3.5 w-3.5" /> Copy Answer</Button>
                  <Button size="sm" variant="outline" onClick={exportAnswer} disabled={!done}><Download className="h-3.5 w-3.5" /> Export Answer</Button>
                  <Button size="sm" variant="secondary" onClick={() => start('b-robert')}><ExternalLink className="h-3.5 w-3.5" /> Start Customer Case</Button>
                  <Button size="sm" variant="ghost" onClick={() => setFollowupOpen((o) => !o)}><MessageSquarePlus className="h-3.5 w-3.5" /> Ask Follow-up</Button>
                </div>
                {followupOpen && (
                  <div className="animate-fade-in rounded-lg border border-dashed border-border bg-card px-3 py-2">
                    <input
                      disabled
                      placeholder="Ask a follow-up question… (disabled in this demo)"
                      className="w-full bg-transparent text-sm text-ink placeholder:text-muted-foreground focus:outline-none"
                    />
                  </div>
                )}

                {/* streaming answer card */}
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ background: PATH_A + '18', color: PATH_A }}>
                      <Sparkles className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">{streaming ? 'Generating answer…' : 'General answer'}</span>
                  </div>
                  {shown.length === 0 ? (
                    <div className="space-y-2" aria-hidden>
                      <div className="h-3 w-11/12 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-full animate-pulse rounded bg-muted" />
                      <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
                    </div>
                  ) : (
                    <p className="whitespace-pre-line text-[14.5px] leading-relaxed text-ink">
                      {shown}
                      {streaming && <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-brand align-middle" />}
                    </p>
                  )}
                  {done && scenario.caveat && (
                    <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 animate-fade-in">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                      <p className="text-[12px] leading-relaxed text-muted-foreground">{scenario.caveat}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT rail — filled from t0 (skeletons while the agent works) */}
              <div className="space-y-4">
                {/* evidence: sources + skills (progressive) */}
                <div className="space-y-3 rounded-xl border border-border bg-card p-4">
                  <div>
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <BookText className="h-3.5 w-3.5 text-secondary" />
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Sources</span>
                    </div>
                    {sourcesShown ? (
                      <div className="flex flex-wrap gap-1.5 animate-fade-in">
                        {scenario.ragSources.map((s) => (
                          <span key={s.id} className="rounded-md border border-border bg-background/60 px-2 py-0.5 font-mono text-[10.5px] text-ink-soft">{s.id}</span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">Gathering sources…</p>
                    )}
                  </div>
                  <div>
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <Puzzle className="h-3.5 w-3.5 text-secondary" />
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Agent skills</span>
                    </div>
                    {skillsShown.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {skillsShown.map((s) => (
                          <span key={s} className="animate-fade-in rounded-full border px-2 py-0.5 font-mono text-[10.5px]" style={{ borderColor: PATH_A + '55', color: PATH_A, background: PATH_A + '11' }}>{s}</span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">Applying skills…</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <AgentEvidencePanel />
      </div>
    </div>
  )
}
