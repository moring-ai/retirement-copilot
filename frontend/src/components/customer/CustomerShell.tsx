import type { ReactNode } from 'react'
import { ShieldCheck, LifeBuoy } from 'lucide-react'
import { FidelityLogo } from '@/components/brand/FidelityLogo'

/** The enterprise frame for the customer experience: a sticky top app bar and a
 *  main area that can host an optional right rail (the agent activity panel). */
export function CustomerShell({
  children,
  right,
  bar,
}: {
  children: ReactNode
  right?: ReactNode
  bar?: ReactNode
}) {
  return (
    <div className="paper min-h-screen">
      <header className="sticky top-0 z-30 border-b border-[color:var(--paper-rule)] bg-[color:var(--paper-card)]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3">
          <FidelityLogo size={26} />
          <span className="hidden h-4 w-px bg-[color:var(--paper-rule)] sm:block" />
          <span className="hidden text-[13px] font-medium text-[color:var(--paper-ink-soft)] sm:inline">
            Retirement rollover
          </span>
          <div className="ml-auto flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--paper-rule)] bg-[color:var(--paper-bg)] px-2.5 py-1 text-[11px] font-medium text-[color:var(--paper-ink-soft)]">
              <ShieldCheck className="h-3.5 w-3.5 text-[color:var(--paper-green)]" />
              <span className="hidden sm:inline">Secure session</span>
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium text-[color:var(--paper-ink-soft)] transition-colors hover:bg-[color:var(--paper-bg)]"
            >
              <LifeBuoy className="h-4 w-4" />
              <span className="hidden sm:inline">Help</span>
            </button>
          </div>
        </div>
        {bar && (
          <div className="mx-auto max-w-6xl px-5 pb-3">{bar}</div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        {right ? (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0">{children}</div>
            <aside className="lg:sticky lg:top-[104px] lg:self-start">{right}</aside>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl">{children}</div>
        )}
      </main>
    </div>
  )
}
