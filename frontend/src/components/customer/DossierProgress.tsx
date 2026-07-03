import { Check, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ProgressStep {
  label: string
  state: 'done' | 'current' | 'todo'
  icon: LucideIcon
}

/** A compact horizontal stepper shown in the customer app bar. */
export function DossierProgress({ steps }: { steps: ProgressStep[] }) {
  const done = steps.filter((s) => s.state === 'done').length
  const pct = Math.round((done / steps.length) * 100)

  return (
    <div>
      <div className="flex items-center gap-1.5">
        {steps.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="flex min-w-0 flex-1 items-center gap-1.5">
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] transition-all',
                  s.state === 'done' && 'border-[#0b7a4e] bg-[#0b7a4e] text-white',
                  s.state === 'current' &&
                    'pulse-ring border-[#0b7a4e] bg-[color:var(--paper-card)] text-[#0b7a4e]',
                  s.state === 'todo' &&
                    'border-[color:var(--paper-rule)] bg-[color:var(--paper-card)] text-[color:var(--paper-muted)]',
                )}
              >
                {s.state === 'done' ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              </span>
              <span
                className={cn(
                  'hidden truncate text-[12px] font-medium md:block',
                  s.state === 'todo'
                    ? 'text-[color:var(--paper-muted)]'
                    : 'text-[color:var(--paper-ink)]',
                )}
              >
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <span
                  className={cn(
                    'h-px min-w-[8px] flex-1',
                    s.state === 'done' ? 'bg-[#0b7a4e]/40' : 'bg-[color:var(--paper-rule)]',
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-[color:var(--paper-rule)]">
        <div
          className="fill-bar h-full rounded-full bg-[#0b7a4e]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
