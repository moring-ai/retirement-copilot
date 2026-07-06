import {
  Route,
  ShieldCheck,
  Wrench,
  BookText,
  Puzzle,
  Brain,
  CircleCheck,
  TriangleAlert,
  Loader2,
  Sparkles,
  ChevronRight,
} from 'lucide-react'
import type { DemoScenario, ReasoningStep, StepKind, Verdict } from '@/data/demo-scenarios'
import { useDemo } from '@/state/DemoContext'
import { cn } from '@/lib/utils'

// Right-docked, collapsible evidence panel. Lighter for Path A ("Answer
// Evidence": sources + skills), fuller for Path B ("Agent Evidence": router,
// gates, MCP calls, RAG lookups, skills, compliance, escalation).

const PATH_A = '#1C6B50'
const PATH_B = '#345A8C'

const KIND_ICON: Record<StepKind, typeof Route> = {
  route: Route,
  gate: ShieldCheck,
  call: Wrench,
  rag: BookText,
  skill: Puzzle,
  think: Brain,
  escalate: TriangleAlert,
  done: CircleCheck,
}

function verdictStyle(v?: Verdict): { label: string; cls: string } | null {
  switch (v) {
    case 'pass':
      return { label: 'PASS', cls: 'bg-brand-soft text-brand-dark' }
    case 'ok':
      return { label: 'OK', cls: 'bg-brand-soft text-brand-dark' }
    case 'flag':
      return { label: 'FLAG', cls: 'bg-danger-soft text-danger' }
    case 'branch':
      return { label: 'BRANCH', cls: 'bg-warn/15 text-warn' }
    default:
      return null
  }
}

function StepRow({ step, accent, active }: { step: ReasoningStep; accent: string; active: boolean }) {
  const Icon = KIND_ICON[step.kind]
  const v = verdictStyle(step.verdict)
  const isGate = step.kind === 'gate'
  const isSkill = step.kind === 'skill'
  const isEscalate = step.kind === 'escalate'
  const isDone = step.kind === 'done'
  return (
    <div className="relative animate-fade-in pl-8">
      <span
        className={cn(
          'absolute left-[9px] top-1 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-card',
          active && 'animate-pulse',
        )}
        style={{ background: isEscalate ? '#b0472a' : isDone ? PATH_A : accent }}
      >
        <Icon className="h-2.5 w-2.5 text-white" />
      </span>
      <div
        className={cn(
          'rounded-lg border px-2.5 py-2',
          isGate && 'border-l-[3px]',
          isEscalate
            ? 'border-danger/30 bg-danger-soft/50'
            : isDone
              ? 'border-brand/30 bg-brand-soft/50'
              : 'border-border bg-background/60',
        )}
        style={isGate ? { borderLeftColor: accent } : undefined}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {isGate && (
              <span
                className="mr-1.5 rounded px-1 py-0.5 text-[8.5px] font-bold uppercase tracking-wider text-white"
                style={{ background: accent }}
              >
                Gate
              </span>
            )}
            {isSkill && (
              <span
                className="mr-1.5 inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[8.5px] font-bold uppercase tracking-wider"
                style={{ background: accent + '1a', color: accent, border: `1px solid ${accent}40` }}
              >
                <Puzzle className="h-2.5 w-2.5" /> Skill
              </span>
            )}
            <span
              className={cn(
                'text-[12px] font-semibold text-ink',
                step.kind === 'call' && 'font-mono text-[11.5px]',
              )}
            >
              {step.label}
            </span>
          </div>
          {v && (
            <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wide', v.cls)}>
              {v.label}
            </span>
          )}
        </div>
        {step.detail && (
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{step.detail}</p>
        )}
        {step.meta && (
          <p className="mt-1 font-mono text-[9.5px] uppercase tracking-wide text-secondary">{step.meta}</p>
        )}
      </div>
    </div>
  )
}

function ChipRow({ label, items, accent }: { label: string; items: string[]; accent: string }) {
  if (!items.length) return null
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-soft">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((s) => (
          <span
            key={s}
            className="rounded-full border px-2 py-0.5 font-mono text-[10px]"
            style={{ borderColor: accent + '55', color: accent, background: accent + '11' }}
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  )
}

function Body({ scenario }: { scenario: DemoScenario }) {
  const { evidenceRevealed, phase } = useDemo()
  const isB = scenario.path === 'B_prompt_chain'
  const accent = isB ? PATH_B : PATH_A
  const steps = scenario.reasoning.slice(0, evidenceRevealed)
  const running = phase === 'running' && evidenceRevealed < scenario.reasoning.length

  return (
    <div className="scrollbar-slim flex-1 space-y-5 overflow-y-auto px-4 py-4">
      <div className="rounded-lg px-3 py-2.5" style={{ background: accent + '12', border: `1px solid ${accent}33` }}>
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accent }}>
          {isB ? 'Controlled Prompt Chain' : 'Augmented LLM'}
        </p>
        <p className="mt-0.5 text-[11px] leading-snug text-ink-soft">
          {isB
            ? 'Gated, step-by-step: each checkpoint tests live customer data and can pass, branch, or flag → human review.'
            : 'One grounded pass over RAG + Agent Skills. No customer data, no gates, no human step.'}
        </p>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-1.5">
          <Brain className="h-3.5 w-3.5 text-secondary" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
            {isB ? 'Reasoning · gated chain' : 'Reasoning · augmented pass'}
          </span>
          {running && <Loader2 className="h-3 w-3 animate-spin text-secondary" />}
        </div>
        <div className="relative space-y-2">
          <span className="absolute bottom-2 left-4 top-2 w-px" style={{ background: accent + '33' }} aria-hidden />
          {steps.map((s, i) => (
            <StepRow key={s.id} step={s} accent={accent} active={running && i === steps.length - 1} />
          ))}
          {running && (
            <div className="relative pl-8 text-[11px] italic text-muted-foreground">
              <span className="absolute left-[11px] top-1 h-2 w-2 animate-pulse rounded-full" style={{ background: accent }} />
              thinking…
            </div>
          )}
        </div>
      </div>

      {phase === 'result' && (
        <div className="space-y-4 animate-fade-in">
          {isB && scenario.mcpCalls && (
            <div>
              <div className="mb-1.5 flex items-center gap-1.5">
                <Wrench className="h-3.5 w-3.5 text-secondary" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
                  MCP tools · {scenario.mcpCalls.length}
                </span>
              </div>
              <ul className="space-y-1">
                {scenario.mcpCalls.map((c) => (
                  <li key={c.tool} className="flex items-center gap-2 rounded-md border border-border bg-background/60 px-2.5 py-1.5">
                    <code className="min-w-0 flex-1 truncate text-[11px] font-medium text-ink">{c.tool}()</code>
                    <span className={cn('shrink-0 text-[10px]', c.flagged ? 'text-danger' : 'text-brand')}>
                      {c.flagged ? '⚑ flag' : '✓ ok'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <ChipRow label={`RAG / policy · ${scenario.ragSources.length}`} items={scenario.ragSources.map((r) => r.id)} accent="#B58A34" />
          <ChipRow label={`Agent Skills · ${scenario.skills.length}`} items={scenario.skills} accent={accent} />
          {isB && scenario.escalationReasons && scenario.escalationReasons.length > 0 && (
            <div className="rounded-lg border border-danger/30 bg-danger-soft/40 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-danger">Escalation triggers · {scenario.escalationReasons.length}</p>
              <ul className="mt-1 space-y-0.5">
                {scenario.escalationReasons.map((r) => (
                  <li key={r} className="text-[10.5px] leading-snug text-ink-soft">• {r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function AgentEvidencePanel() {
  const { scenario, panelOpen, togglePanel, phase } = useDemo()
  if (!scenario) return null
  const isB = scenario.path === 'B_prompt_chain'
  const accent = isB ? PATH_B : PATH_A
  const running = phase === 'running'
  const heading = isB ? 'Agent Evidence' : 'Answer Evidence'

  if (!panelOpen) {
    return (
      <button
        type="button"
        onClick={togglePanel}
        aria-label={`Open ${heading}`}
        className="flex h-full w-12 shrink-0 flex-col items-center gap-3 border-l border-border bg-card py-4 transition-colors hover:bg-muted"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: accent + '18', color: accent }}>
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-soft" style={{ writingMode: 'vertical-rl' }}>
          {heading}
        </span>
      </button>
    )
  }

  return (
    <aside className="flex h-full w-[400px] shrink-0 flex-col border-l border-border bg-card lg:w-[460px] xl:w-[520px]">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: accent + '18', color: accent }}>
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          </span>
          <div>
            <p className="text-[13px] font-semibold leading-none text-ink">{heading}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">{running ? 'working…' : 'run complete'}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={togglePanel}
          aria-label="Collapse panel"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-ink"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <Body scenario={scenario} />
    </aside>
  )
}
