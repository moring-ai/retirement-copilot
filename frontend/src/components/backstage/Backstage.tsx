import { X, CircleDot, Circle } from 'lucide-react'
import type { AgentRunEvent } from '@/lib/agentBus'
import type { ApiTraceStep } from '@/lib/chatContract'

// The presenter-facing "backstage" — a calm monospace ledger that reads the REAL
// /chat trace and makes the deterministic router legible. Toggleable in both tabs
// (Alt/⌥ + T). It renders the last agent run's response verbatim, so it doubles
// as proof the demo did what the slide claims.

const STEP_LABEL: Record<string, string> = {
  parse_user_request: 'parse',
  classify_request: 'classify · ROUTER',
  retrieve_rag_documents: 'retrieve_rag',
  decide_required_tools: 'decide_tools',
  call_mcp_tools: 'call_mcp_tools',
  synthesize_rollover_plan: 'synthesize',
  pb_gate: 'pb_gate',
  pb_explain: 'pb_explain',
  pb_checklist: 'pb_checklist',
  guardrails_check: 'guardrails',
  format_final_response: 'format',
}

function stepLabel(step: string): string {
  if (step.startsWith('skill:')) return step
  return STEP_LABEL[step] ?? step
}

function Pip({ on, children }: { on: boolean; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px]"
      style={{ color: on ? '#0b7a4e' : '#97907f' }}
    >
      {on ? <CircleDot className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
      {children}
    </span>
  )
}

export function Backstage({
  run,
  open,
  onClose,
}: {
  run: AgentRunEvent | null
  open: boolean
  onClose: () => void
}) {
  if (!open) return null

  const r = run?.response ?? null
  const path = r?.path
  const isA = path === 'A_augmented_llm'
  const isB = path === 'B_prompt_chain'
  const cls = r?.trace?.classification ?? {}
  const parsed = r?.trace?.parsed ?? {}
  const steps: ApiTraceStep[] = r?.trace?.steps ?? []
  const kws = parsed.rollover_keywords ?? []
  const customerSpecific = !!cls.is_customer_specific
  const escalation = !!r?.escalation_required

  const gloss = isA
    ? 'This customer, this account → the agent looks up their real records.'
    : isB
      ? 'General question → the agent explains what’s allowed, no personal data.'
      : 'Not a routed rollover request → clarification.'

  return (
    <>
      {/* faint scrim */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className="bs-slide fixed right-0 top-0 z-50 flex h-full w-[min(460px,92vw)] flex-col border-l border-[#d9ddd4] bg-[#f6f7f4] shadow-xl"
        role="dialog"
        aria-label="Agent trace"
      >
        {/* header */}
        <div className="flex items-center justify-between border-b border-[#e5e8e1] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-[#16241c] text-[10px] font-bold text-white">
              ◈
            </span>
            <span className="text-sm font-medium text-[#16241c]">Agent trace</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="mono text-[10px] text-[#6b7a70]">
              {r?.trace?.model_mode ? `${r.trace.model_mode} mode` : '—'}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-[#6b7a70] hover:bg-[#eef1eb]"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="scrollbar-slim flex-1 overflow-y-auto px-4 py-4">
          {!r ? (
            <p className="mono mt-8 text-center text-xs text-[#6b7a70]">
              No run yet. Trigger the agent (a customer action) to see the router
              decision and live trace.
            </p>
          ) : (
            <>
              {/* Router verdict receipt */}
              <div className="rounded-lg border border-[#e5e8e1] bg-white p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6b7a70]">
                  Router verdict
                </p>
                <div className="mono mt-2 space-y-2 text-[11px] text-[#51605a]">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="w-14 shrink-0 text-[9.5px] uppercase text-[#97907f]">
                      input
                    </span>
                    {kws.map((k) => (
                      <span key={k} className="rounded border border-[#e5e8e1] bg-[#f6f7f4] px-1.5 py-0.5">
                        {k}
                      </span>
                    ))}
                    {parsed.customer_id && (
                      <span className="rounded border border-[#e5e8e1] bg-[#f6f7f4] px-1.5 py-0.5">
                        {parsed.customer_id}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="w-14 shrink-0 text-[9.5px] uppercase text-[#97907f]">
                      signals
                    </span>
                    <Pip on={kws.length > 0}>rollover keyword</Pip>
                    <Pip on={customerSpecific}>customer-specific</Pip>
                  </div>
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="w-14 shrink-0 text-[9.5px] uppercase text-[#97907f]">
                      verdict
                    </span>
                    <span className="text-[13px] font-semibold text-[#16241c]">
                      {path ?? 'other'}
                    </span>
                    {typeof cls.confidence === 'number' && (
                      <span className="text-[#6b7a70]">· {cls.confidence.toFixed(2)}</span>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-[#6b7a70]">{gloss}</p>
              </div>

              {/* Engine bay */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <EngineCard
                  title="Augmented LLM"
                  sub="RAG + MCP tools"
                  lit={isA}
                />
                <EngineCard
                  title="Prompt-chain"
                  sub="RAG + skills"
                  lit={isB}
                />
              </div>

              {/* Trace tape */}
              <p className="mt-4 mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#6b7a70]">
                Trace
              </p>
              <div className="rounded-lg border border-[#e5e8e1] bg-white">
                {steps.map((s, i) => (
                  <div
                    key={i}
                    className="mono grid grid-cols-[12px_128px_1fr] items-baseline gap-2 border-t border-[#eef1eb] px-2.5 py-1.5 text-[10.5px] first:border-t-0"
                  >
                    <span style={{ color: s.status === 'error' ? '#b4231e' : '#0b7a4e' }}>
                      {s.status === 'error' ? '✕' : '●'}
                    </span>
                    <span
                      className="truncate"
                      style={{ color: s.step.startsWith('skill:') ? '#b58a34' : '#16241c' }}
                    >
                      {stepLabel(s.step)}
                    </span>
                    <span className="truncate text-[#97907f]" title={s.detail}>
                      {s.detail}
                    </span>
                  </div>
                ))}
              </div>

              {/* Evidence */}
              <EvidenceGroup title={`RAG sources (${r.rag_sources.length})`}>
                {r.rag_sources.map((s) => (
                  <span key={s.chunk_id} className="mono rounded bg-[#eef2f8] px-1.5 py-0.5 text-[10px] text-[#b58a34]">
                    {s.chunk_id}
                    {s.score != null ? `·${s.score.toFixed(2)}` : ''}
                  </span>
                ))}
              </EvidenceGroup>

              {isA && (
                <EvidenceGroup title={`MCP tools (${r.tools_called.length})`}>
                  {r.tools_called.map((t) => (
                    <span key={t.tool} className="mono rounded bg-[#e7f3ec] px-1.5 py-0.5 text-[10px] text-[#0a5c3b]">
                      {t.tool}
                    </span>
                  ))}
                </EvidenceGroup>
              )}

              <EvidenceGroup title={`Skills (${r.skills_used.length})`}>
                {r.skills_used.map((s) => (
                  <span
                    key={s.skill}
                    className="mono rounded px-1.5 py-0.5 text-[10px]"
                    style={{
                      background: s.kind === 'content' ? '#eef2f8' : '#f2f0ea',
                      color: s.flagged ? '#c2760b' : s.kind === 'content' ? '#b58a34' : '#6a6252',
                    }}
                    title={s.detail}
                  >
                    {s.skill}
                    {s.flagged ? ' ⚑' : ''}
                  </span>
                ))}
              </EvidenceGroup>

              <div
                className="mt-4 rounded-lg border px-3 py-2 text-[11px]"
                style={
                  escalation
                    ? { borderColor: '#c2760b33', background: '#fbf2df', color: '#c2760b' }
                    : { borderColor: '#0b7a4e22', background: '#e7f3ec', color: '#0a5c3b' }
                }
              >
                {escalation
                  ? `Guardrails → escalation (${r.escalation_reasons.length} reason${r.escalation_reasons.length === 1 ? '' : 's'})`
                  : 'Guardrails → cleared, no escalation'}
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  )
}

function EngineCard({ title, sub, lit }: { title: string; sub: string; lit: boolean }) {
  return (
    <div
      className="rounded-lg border p-2.5 transition-opacity"
      style={{
        borderColor: lit ? '#0b7a4e66' : '#e5e8e1',
        background: lit ? '#e7f3ec' : '#ffffff',
        opacity: lit ? 1 : 0.5,
      }}
    >
      <p className="text-[12px] font-medium text-[#16241c]">{title}</p>
      <p className="text-[10.5px] text-[#6b7a70]">{sub}</p>
      {lit && (
        <p className="mono mt-1 text-[9.5px] font-semibold" style={{ color: '#0b7a4e' }}>
          ● fired
        </p>
      )}
    </div>
  )
}

function EvidenceGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#6b7a70]">
        {title}
      </p>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  )
}
