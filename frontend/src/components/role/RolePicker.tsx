import { FileText, Headset, ArrowRight } from 'lucide-react'
import { chooseRole } from '@/lib/role'
import { FidelityLogo, FidelityWatermark } from '@/components/brand/FidelityLogo'

/** Landing shown when a tab has no role yet. For the demo: open the app in two
 *  tabs and pick Customer in one, Associate in the other. */
export function RolePicker() {
  return (
    <div className="paper relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-12">
      <FidelityWatermark size={620} opacity={0.04} className="-right-40 -top-40" />
      <div className="relative w-full max-w-3xl">
        <FidelityLogo size={30} className="mb-6" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--paper-muted)]">
          Fidelity retirement servicing
        </p>
        <h1 className="paper-serif mt-2 text-3xl font-medium text-[color:var(--paper-ink)]">
          Two views, one agent.
        </h1>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[color:var(--paper-ink-soft)]">
          The same routing agent works underneath both experiences. Open this in
          two tabs — pick one below in each — and watch a customer action ripple
          through to the associate.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => chooseRole('customer')}
            className="paper-card group flex flex-col rounded-2xl p-6 text-left transition-transform hover:-translate-y-0.5"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e7f3ec] text-[#0b7a4e]">
              <FileText className="h-5 w-5" />
            </span>
            <span className="paper-serif mt-4 text-lg font-medium text-[color:var(--paper-ink)]">
              I'm a customer
            </span>
            <span className="mt-1 text-sm leading-relaxed text-[color:var(--paper-ink-soft)]">
              See your personal rollover dossier written for you, step by step.
            </span>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#0b7a4e]">
              Open customer view
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => chooseRole('associate')}
            className="group flex flex-col rounded-2xl border border-border bg-card p-6 text-left shadow-card transition-transform hover:-translate-y-0.5"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-blue-soft text-[#b58a34]">
              <Headset className="h-5 w-5" />
            </span>
            <span className="mt-4 text-lg font-medium text-ink">I'm an associate</span>
            <span className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Work the case queue and review the agent's evidence and decisions.
            </span>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-dark">
              Open associate console
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
        </div>

        <p className="mt-6 text-center text-[11px] text-[color:var(--paper-muted)]">
          Mock data only · human-in-the-loop · the agent never moves money
        </p>
      </div>
    </div>
  )
}
