import { useState } from 'react'
import {
  Sparkles,
  Loader2,
  ChevronUp,
  ChevronDown,
  X,
  Wrench,
  Puzzle,
  CircleCheck,
  Ban,
  Clock3,
} from 'lucide-react'
import type { ConfidenceLevel } from '@/types'
import { useWorkspace } from '@/state/WorkspaceContext'
import { useIslandSpec, type IslandAction } from '@/lib/island-store'
import { deriveSkills } from '@/lib/agentSkills'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const CONF: Record<ConfidenceLevel, { pct: number; fill: string; text: string }> = {
  High: { pct: 92, fill: 'bg-brand', text: 'text-brand-dark' },
  Medium: { pct: 60, fill: 'bg-warn', text: 'text-warn' },
  Low: { pct: 28, fill: 'bg-danger', text: 'text-danger' },
}

/** Battery-style confidence gauge shown inside the island. */
function ConfidenceBattery({ level }: { level: ConfidenceLevel }) {
  const c = CONF[level]
  return (
    <div className="hidden shrink-0 items-center gap-1.5 sm:flex" title={`Confidence: ${level}`}>
      <span className="relative flex h-4 w-8 items-center rounded-[3px] border border-ink-soft/40 p-[2px]">
        <span
          className={cn('h-full rounded-[1px] transition-all duration-700', c.fill)}
          style={{ width: `${c.pct}%` }}
        />
        <span className="absolute -right-[3px] top-1/2 h-1.5 w-[2px] -translate-y-1/2 rounded-r bg-ink-soft/40" />
      </span>
      <span className={cn('text-[11px] font-semibold', c.text)}>{level}</span>
    </div>
  )
}

function ActionButton({ a }: { a: IslandAction }) {
  const Icon = a.icon
  if (a.menu && a.menu.length > 0) {
    return (
      <div className="inline-flex">
        <Button
          size="sm"
          variant={a.variant ?? 'default'}
          disabled={a.disabled}
          onClick={a.onClick}
          className="rounded-r-none"
        >
          {Icon && <Icon />}
          {a.label}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant={a.variant ?? 'default'}
              disabled={a.disabled}
              aria-label="More actions"
              className="rounded-l-none border-l border-white/25 px-1.5"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {a.menu.map((m) => {
              const MI = m.icon
              return (
                <DropdownMenuItem key={m.id} onSelect={m.onClick}>
                  <span
                    className={cn(
                      'flex items-center gap-2',
                      m.danger ? 'text-danger' : 'text-ink',
                    )}
                  >
                    {MI && <MI className="h-3.5 w-3.5" />}
                    {m.label}
                  </span>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }
  return (
    <Button
      size="sm"
      variant={a.variant ?? 'default'}
      disabled={a.disabled}
      onClick={a.onClick}
    >
      {Icon && <Icon />}
      {a.label}
    </Button>
  )
}

export function AgentIsland() {
  const { state } = useWorkspace()
  const { timeline, toolCalls, confidence } = state.evidence
  const running = state.runningAction !== null
  const [open, setOpen] = useState(false)

  const spec = useIslandSpec()
  const forStep = spec && spec.stepId === state.activeStep ? spec : null
  const actions = forStep?.actions ?? []
  const primary = actions.find((a) => a.primary) ?? actions[0]
  const skills = deriveSkills(state)

  const latest = timeline[timeline.length - 1]
  const statusText =
    forStep?.statusText ??
    (running
      ? (latest?.label ?? 'Working…')
      : latest
        ? latest.label
        : 'Agent ready — no activity yet')

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
      <div className="pointer-events-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card/90 shadow-card backdrop-blur transition-all duration-300">
        {/* ---- Sliding shelf (rises from behind the island) ---- */}
        {open && (
          <div className="flex max-h-[72vh] flex-col border-b border-border animate-fade-in">
            <div className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-secondary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Agent
                </span>
                {running && (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-secondary">
                    <Loader2 className="h-3 w-3 animate-spin" /> working
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="scrollbar-slim flex-1 space-y-4 overflow-y-auto px-4 pb-3">
              {/* MCP usage */}
              <section>
                <SectionLabel icon={Wrench} label="MCP tools used" count={toolCalls.length} />
                {toolCalls.length === 0 ? (
                  <p className="mt-1 text-xs text-muted-foreground">No tools used yet.</p>
                ) : (
                  <ul className="mt-2 space-y-1">
                    {toolCalls.map((t) => (
                      <li
                        key={t.tool}
                        className="flex items-center gap-2 rounded-md border border-border bg-background/60 px-2.5 py-1.5"
                      >
                        <code className="min-w-0 flex-1 truncate text-xs font-medium text-ink">
                          {t.tool}()
                        </code>
                        {t.approval === 'denied' ? (
                          <span className="flex items-center gap-1 text-[11px] text-danger">
                            <Ban className="h-3 w-3" /> denied
                          </span>
                        ) : t.approval === 'pending' ? (
                          <span className="flex items-center gap-1 text-[11px] text-warn">
                            <Clock3 className="h-3 w-3" /> pending
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] text-brand">
                            <CircleCheck className="h-3 w-3" /> ok
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Skills used */}
              <section>
                <SectionLabel icon={Puzzle} label="Skills used" count={skills.length} />
                {skills.length === 0 ? (
                  <p className="mt-1 text-xs text-muted-foreground">None yet.</p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {skills.map((s) => (
                      <span
                        key={s}
                        className="rounded-full border border-secondary/20 bg-accent px-2 py-0.5 text-[11px] font-medium text-secondary"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Actions (submit) — nearest the pill */}
            {actions.length > 0 && (
              <div className="border-t border-border bg-muted/40 px-4 py-3">
                {forStep?.title && (
                  <p className="mb-2 text-xs text-ink-soft">
                    <span className="font-semibold text-ink">{forStep.title}</span>
                    {forStep.hint ? ` — ${forStep.hint}` : ''}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {actions.map((a) => (
                    <ActionButton key={a.id} a={a} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---- Collapsed pill ---- */}
        <div className="flex items-center gap-3 px-3 py-2.5">
          <span
            className={cn(
              'relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
              running ? 'bg-secondary/15 text-secondary' : 'bg-brand-soft text-brand-dark',
            )}
          >
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {running && (
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-secondary" />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {running ? 'Agent working' : 'Agent'}
            </p>
            <p
              key={statusText}
              className="animate-fade-in truncate text-sm font-medium text-ink"
            >
              {statusText}
            </p>
          </div>

          {confidence && <ConfidenceBattery level={confidence} />}

          {primary && !open && <ActionButton a={primary} />}

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label="Toggle agent shelf"
            className={cn(
              'flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors',
              open
                ? 'border-secondary/30 bg-accent text-secondary'
                : 'border-border bg-background text-ink-soft hover:bg-muted',
            )}
          >
            {actions.length > 0 && !open && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-semibold text-secondary-foreground">
                {actions.length}
              </span>
            )}
            <ChevronUp className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
          </button>
        </div>
      </div>
    </div>
  )
}

function SectionLabel({
  icon: Icon,
  label,
  count,
}: {
  icon: typeof Wrench
  label: string
  count: number
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-secondary" />
      <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
        {label}
      </span>
      {count > 0 && (
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-ink-soft">
          {count}
        </span>
      )}
    </div>
  )
}
