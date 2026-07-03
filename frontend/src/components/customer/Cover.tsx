import { useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  BookMarked,
  CalendarDays,
  Landmark,
  Lock,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { CUSTOMERS, CUSTOMER_LIST } from '@/data/customers'
import { FidelityLogo, FidelityWatermark } from '@/components/brand/FidelityLogo'
import { GUIDE_TOPICS, type GuideTopic } from './customerMachine'

const digits = (s: string) => s.replace(/\D/g, '')

export function Cover({
  onIdentify,
  onExplore,
}: {
  onIdentify: (customerId: string) => void
  onExplore: (topic: GuideTopic) => void
}) {
  const [picked, setPicked] = useState<string | null>(null)
  const [dob, setDob] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [exploring, setExploring] = useState(false)

  const customer = picked ? CUSTOMERS[picked] : null

  const verify = () => {
    if (!customer) return
    if (digits(dob) === digits(customer.date_of_birth)) {
      onIdentify(customer.customer_id)
    } else {
      setError('That date of birth does not match our records.')
    }
  }

  return (
    <div className="paper relative min-h-screen overflow-hidden">
      <FidelityWatermark size={560} opacity={0.04} className="-right-32 top-24" />
      <div className="relative mx-auto w-full max-w-2xl px-5 py-14">
        <FidelityLogo size={28} className="mb-8" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--paper-muted)]">
          Fidelity retirement servicing
        </p>
        <h1 className="paper-serif mt-3 text-[34px] leading-tight text-[color:var(--paper-ink)]">
          Your rollover dossier
        </h1>
        <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-[color:var(--paper-ink-soft)]">
          A personal plan for moving your old 401(k) into a Fidelity IRA — written
          for you, one section at a time. Nothing is ever sent until you say so.
        </p>

        {!picked ? (
          <>
            <hr className="paper-rule my-8" />
            <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--paper-muted)]">
              Prepared for
            </p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {CUSTOMER_LIST.map((c) => {
                const id = c.customer_id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setPicked(id)
                      setError(null)
                    }}
                    className="paper-card group rounded-2xl p-4 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:border-[#0b7a4e]/30"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e7f3ec] font-semibold text-[#0b7a4e]">
                        {c.name.split(' ').map((p) => p[0]).join('')}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-[color:var(--paper-ink)]">
                          {c.name}
                        </span>
                        <span className="block truncate text-xs text-[color:var(--paper-ink-soft)]">
                          {c.employment_status} · {c.state}
                        </span>
                      </span>
                      <ArrowRight className="h-4 w-4 text-[color:var(--paper-muted)] transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <div className="mt-3 flex items-center gap-2 border-t border-[color:var(--paper-rule)] pt-2.5 text-[11px] text-[color:var(--paper-ink-soft)]">
                      <Landmark className="h-3.5 w-3.5 text-[color:var(--paper-muted)]" />
                      {c.source_plan.plan_type} · {c.source_plan.plan_provider}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-8">
              {!exploring ? (
                <button
                  type="button"
                  onClick={() => setExploring(true)}
                  className="inline-flex items-center gap-2 text-sm text-[color:var(--paper-ink-soft)] underline decoration-[color:var(--paper-rule)] underline-offset-4 hover:text-[color:var(--paper-ink)]"
                >
                  <BookOpen className="h-4 w-4" />
                  Just exploring how rollovers work?
                </button>
              ) : (
                <div className="ink-in">
                  <p className="text-sm text-[color:var(--paper-ink-soft)]">
                    Read a general guide — no account needed.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {GUIDE_TOPICS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => onExplore(t.id)}
                        className="rounded-full border border-[color:var(--paper-rule)] bg-[color:var(--paper-card)] px-3.5 py-1.5 text-[13px] text-[color:var(--paper-ink)] transition-colors hover:bg-[#f3eee2]"
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* trust row */}
            <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { icon: BookMarked, t: 'Grounded in Fidelity’s approved policy' },
                { icon: UserRound, t: 'A specialist reviews everything' },
                { icon: Lock, t: 'Your details stay protected' },
              ].map((b) => (
                <div
                  key={b.t}
                  className="flex items-start gap-2.5 rounded-xl border border-[color:var(--paper-rule)] bg-[color:var(--paper-card)]/60 p-3"
                >
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e7f3ec] text-[#0b7a4e]">
                    <b.icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-[12px] leading-snug text-[color:var(--paper-ink-soft)]">
                    {b.t}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="ink-in mt-8">
            <div className="paper-card flex items-center gap-3 rounded-xl p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0b7a4e] text-white">
                <UserRound className="h-5 w-5" />
              </span>
              <div>
                <p className="font-medium text-[color:var(--paper-ink)]">{customer?.name}</p>
                <p className="text-xs text-[color:var(--paper-ink-soft)]">
                  {customer?.customer_id} · {customer?.state}
                </p>
              </div>
            </div>

            <label className="mt-5 block text-xs font-medium text-[color:var(--paper-ink-soft)]">
              Confirm your date of birth to open your dossier
            </label>
            <div className="mt-2 flex gap-2">
              <div className="relative flex-1">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--paper-muted)]" />
                <input
                  autoFocus
                  value={dob}
                  onChange={(e) => {
                    setDob(e.target.value)
                    setError(null)
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && dob.trim() && verify()}
                  placeholder="YYYY-MM-DD"
                  className="w-full rounded-lg border border-[color:var(--paper-rule)] bg-[color:var(--paper-card)] py-2 pl-9 pr-3 text-sm text-[color:var(--paper-ink)] outline-none focus:border-[#0b7a4e]"
                />
              </div>
              <button
                type="button"
                onClick={verify}
                disabled={!dob.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0b7a4e] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0a5c3b] disabled:opacity-50"
              >
                Open my dossier
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            {error && (
              <p className="mt-2 text-xs font-medium text-[#b4231e]">{error}</p>
            )}
            <p className="mt-2 text-[11px] text-[color:var(--paper-muted)]">
              Demo hint: {customer?.name}'s date of birth is {customer?.date_of_birth}.
            </p>
            <button
              type="button"
              onClick={() => {
                setPicked(null)
                setDob('')
                setError(null)
              }}
              className="mt-4 text-xs text-[color:var(--paper-ink-soft)] underline underline-offset-4"
            >
              ← Choose a different person
            </button>
          </div>
        )}

        <div className="mt-12 flex items-center gap-2 text-[11px] text-[color:var(--paper-muted)]">
          <ShieldCheck className="h-3.5 w-3.5" />
          Mock data only · your associate reviews everything before anything is sent
        </div>
      </div>
    </div>
  )
}
