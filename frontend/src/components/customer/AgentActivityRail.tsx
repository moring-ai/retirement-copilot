import {
  Check,
  Loader2,
  ShieldCheck,
  UserRound,
  Lock,
  BookMarked,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { FidelityMark } from '@/components/brand/FidelityLogo'
import { cn } from '@/lib/utils'
import type { CustomerState } from './customerMachine'

interface Activity {
  label: string
  caption: string
  done: boolean
  tone?: 'good' | 'warn'
}

/** The right-rail "your agent" panel: a live, friendly feed of what the agent is
 *  doing on the customer's behalf, plus trust assurances and what's next. */
export function AgentActivityRail({ state }: { state: CustomerState }) {
  const r = state.response
  const ready = state.status === 'ready' && !!r
  const escalation = !!r?.escalation_required

  const showVerdict = ready && state.planConfirmed
  const showForms = showVerdict && !escalation && state.movementChoice != null
  const showHandoff = showVerdict && escalation
  const showPlan = showForms && state.formsAcknowledged

  const tools = r?.tools_called.length ?? 0
  const sources = r?.rag_sources.length ?? 0
  const forms = r?.required_forms.length ?? 0
  const reasons = r?.escalation_reasons.length ?? 0

  const activities: Activity[] = [
    { label: 'Verified your identity', caption: 'Date of birth confirmed', done: true },
    {
      label: 'Reviewed your account',
      caption: ready ? `${tools} secure lookups` : 'Reading your records…',
      done: ready,
    },
    {
      label: 'Checked Fidelity’s policy',
      caption: ready ? `${sources} approved sources` : 'Retrieving guidance…',
      done: ready,
    },
    escalation
      ? {
          label: 'Flagged a few items',
          caption: `${reasons} to confirm with you`,
          done: showVerdict,
          tone: 'warn' as const,
        }
      : {
          label: 'Confirmed your eligibility',
          caption: 'Cleared for a direct rollover',
          done: showVerdict,
          tone: 'good' as const,
        },
    escalation
      ? { label: 'Looped in your associate', caption: 'A specialist will reach out', done: showHandoff }
      : { label: 'Prepared your paperwork', caption: `${forms} forms to complete`, done: showForms },
  ]
  if (!escalation) {
    activities.push({ label: 'Drafted your plan', caption: 'Ready for your review', done: showPlan })
  }

  // first not-done item becomes "current" (spinner) while anything remains
  const currentIdx = activities.findIndex((a) => !a.done)

  const working = state.status === 'running' || (ready && currentIdx !== -1)

  const assurances = [
    { icon: BookMarked, text: 'Grounded in Fidelity’s approved policy' },
    { icon: UserRound, text: 'A specialist reviews before anything is sent' },
    { icon: Lock, text: 'Your details stay protected' },
  ]

  return (
    <div className="space-y-4">
      {/* agent header */}
      <div className="paper-card rounded-2xl p-4 shadow-soft">
        <div className="flex items-center gap-3">
          <span className={cn('relative flex h-9 w-9 items-center justify-center rounded-full', working && 'pulse-ring')}>
            <FidelityMark size={36} />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-[color:var(--paper-ink)]">
              Your Fidelity agent
            </p>
            <p className="flex items-center gap-1.5 text-[11px] text-[color:var(--paper-ink-soft)]">
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  working ? 'bg-[#0b7a4e]' : 'bg-[color:var(--paper-muted)]',
                )}
              />
              {working ? 'Working on your behalf' : 'Waiting for you'}
            </p>
          </div>
          <Sparkles className="ml-auto h-4 w-4 text-[color:var(--paper-gold)]" />
        </div>

        {/* activity feed */}
        <ol className="mt-4 space-y-0.5">
          {activities.map((a, i) => {
            const isCurrent = i === currentIdx
            return (
              <li key={a.label} className="rise-in flex gap-3" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full border text-[10px]',
                      a.done && a.tone === 'warn' && 'border-[#c2760b] bg-[#fbeeda] text-[#c2760b]',
                      a.done && a.tone !== 'warn' && 'border-[#0b7a4e] bg-[#e7f3ec] text-[#0b7a4e]',
                      !a.done && isCurrent && 'border-[#0b7a4e] text-[#0b7a4e]',
                      !a.done && !isCurrent && 'border-[color:var(--paper-rule)] text-[color:var(--paper-muted)]',
                    )}
                  >
                    {a.done ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : isCurrent ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    )}
                  </span>
                  {i < activities.length - 1 && (
                    <span className={cn('my-0.5 w-px flex-1', a.done ? 'bg-[#0b7a4e]/30' : 'bg-[color:var(--paper-rule)]')} />
                  )}
                </div>
                <div className={cn('pb-3', !a.done && !isCurrent && 'opacity-60')}>
                  <p className="text-[13px] font-medium leading-tight text-[color:var(--paper-ink)]">
                    {a.label}
                  </p>
                  <p className="text-[11px] text-[color:var(--paper-ink-soft)]">{a.caption}</p>
                </div>
              </li>
            )
          })}
        </ol>
      </div>

      {/* assurances */}
      <div className="paper-card rounded-2xl p-4 shadow-soft">
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--paper-muted)]">
          How we protect you
        </p>
        <ul className="space-y-2.5">
          {assurances.map((a) => (
            <li key={a.text} className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e7f3ec] text-[#0b7a4e]">
                <a.icon className="h-3.5 w-3.5" />
              </span>
              <span className="text-[12px] leading-snug text-[color:var(--paper-ink-soft)]">
                {a.text}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* stamps from the associate (reverse channel) */}
      {state.stamps.length > 0 && (
        <div className="rise-in rounded-2xl border border-[#0b7a4e]/20 bg-[#e7f3ec] p-3">
          {state.stamps.map((s, i) => (
            <p key={i} className="flex items-center gap-1.5 text-[12px] text-[#0a5c3b]">
              <ShieldCheck className="h-3.5 w-3.5" />
              {s.label} · {s.associate}
            </p>
          ))}
        </div>
      )}

      {/* subtle "narrate the pattern" hint for the demo */}
      <button
        type="button"
        onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'T', code: 'KeyT', altKey: true }))}
        className="flex w-full items-center justify-between rounded-xl border border-dashed border-[color:var(--paper-rule)] px-3 py-2 text-[11px] text-[color:var(--paper-muted)] transition-colors hover:bg-[color:var(--paper-card)]"
      >
        See how the agent decided
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
