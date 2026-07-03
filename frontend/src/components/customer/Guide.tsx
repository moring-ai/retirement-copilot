import { Loader2, ArrowRight, BookOpen } from 'lucide-react'
import { CustomerShell } from './CustomerShell'
import type { CustomerState } from './customerMachine'

/** Path B — the impersonal "general guide". No customer, no personal facts;
 *  every citation is guidance-scoped. This is what the router produces when the
 *  customer is just learning. */
export function Guide({
  state,
  onStartPersonal,
  onBack,
}: {
  state: CustomerState
  onStartPersonal: () => void
  onBack: () => void
}) {
  const r = state.response
  const ready = state.status === 'ready' && !!r
  const contentSkills = (r?.skills_used ?? []).filter((s) => s.kind === 'content')

  return (
    <CustomerShell>
      <div>
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-[color:var(--paper-ink-soft)] underline underline-offset-4"
        >
          ← Back
        </button>

        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[color:var(--paper-rule)] bg-[color:var(--paper-card)] px-2.5 py-1 text-[11px] font-medium text-[color:var(--paper-ink-soft)]">
          <BookOpen className="h-3.5 w-3.5" /> a general guide · not based on your personal account
        </span>

        <h1 className="paper-serif mt-3 text-[30px] leading-tight text-[color:var(--paper-ink)]">
          How a 401(k) rollover works
        </h1>
        <p className="text-sm text-[color:var(--paper-ink-soft)]">A Fidelity guide</p>

        <div className="mt-3 flex items-center gap-2 text-[13px] italic text-[color:var(--paper-ink-soft)]">
          {!ready && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          <span className="paper-serif">
            {ready ? 'Pulled from Fidelity’s approved guidance.' : 'Pulling Fidelity’s general guidance…'}
          </span>
        </div>

        <hr className="paper-rule my-7" />

        {!ready ? (
          <div className="space-y-3">
            <div className="h-3 w-full rounded bg-[color:var(--paper-rule)]" />
            <div className="h-3 w-11/12 rounded bg-[color:var(--paper-rule)]" />
            <div className="h-3 w-4/5 rounded bg-[color:var(--paper-rule)]" />
          </div>
        ) : (
          <div className="ink-in space-y-6">
            <p className="paper-serif text-[17px] leading-relaxed text-[color:var(--paper-ink)]">
              {r!.answer}
            </p>

            {r!.required_forms.length > 0 && (
              <div>
                <h2 className="paper-serif text-[18px] text-[color:var(--paper-ink)]">
                  Forms you'd typically need
                </h2>
                <ul className="mt-2 space-y-1.5">
                  {r!.required_forms.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-[color:var(--paper-ink-soft)]"
                    >
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[color:var(--paper-muted)]" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-[12px] text-[color:var(--paper-muted)]">
              From Fidelity's approved guidance
              {r!.rag_sources.length > 0
                ? ` [${r!.rag_sources.map((s) => s.chunk_id).join(', ')}]`
                : ''}
              .
            </p>

            {contentSkills.length > 0 && (
              <p className="text-[11px] text-[color:var(--paper-muted)]">
                Prepared using: {contentSkills.map((s) => s.skill).join(' · ')}
              </p>
            )}

            <div className="rounded-xl border border-[color:var(--paper-rule)] bg-[#faf6ec] p-4">
              <p className="text-sm text-[color:var(--paper-ink-soft)]">
                Want this tailored to your own account?
              </p>
              <button
                type="button"
                onClick={onStartPersonal}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#0b7a4e] px-4 py-2 text-sm font-medium text-white hover:bg-[#0a5c3b]"
              >
                Start a personal dossier <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </CustomerShell>
  )
}
