import { useState, type Dispatch } from 'react'
import { Sparkles, Loader2, ChevronUp, BookText } from 'lucide-react'
import type { CustomerState, CustomerAction } from './customerMachine'

type Act = {
  id: string
  label: string
  onClick: () => void
  primary?: boolean
}

/**
 * The customer-facing agent island — a floating bar that shows what the agent
 * is doing and hosts every action (confirm, choose, continue, approve), the
 * same pattern as the associate console.
 */
export function CustomerIsland({
  state,
  dispatch,
  onAcceptForms,
  onSave,
}: {
  state: CustomerState
  dispatch: Dispatch<CustomerAction>
  onAcceptForms: () => void
  onSave: () => void
}) {
  const [open, setOpen] = useState(false)
  const r = state.response
  const ready = state.status === 'ready' && !!r
  const running = state.status === 'running'
  const escalation = !!r?.escalation_required

  let status: string
  let actions: Act[] = []

  if (running) {
    status = 'Reviewing your accounts against Fidelity policy…'
  } else if (!ready) {
    status = 'Getting your dossier ready…'
  } else if (!state.planConfirmed) {
    status = 'Confirm your old plan to continue.'
    actions = [
      { id: 'confirm', label: 'Confirm my plan', primary: true, onClick: () => dispatch({ type: 'CONFIRM_PLAN' }) },
    ]
  } else if (escalation) {
    status = 'A specialist is reviewing your case — nothing needed from you.'
  } else if (!state.movementChoice) {
    status = 'How would you like the money to move?'
    actions = [
      { id: 'direct', label: 'Direct transfer', primary: true, onClick: () => dispatch({ type: 'CHOOSE_MOVEMENT', choice: 'direct' }) },
      { id: 'indirect', label: 'Pay me first', onClick: () => dispatch({ type: 'CHOOSE_MOVEMENT', choice: 'indirect' }) },
    ]
  } else if (!state.formsAcknowledged) {
    status = 'Attach your paperwork, then continue to your plan.'
    actions = [{ id: 'forms', label: 'Continue to my plan', primary: true, onClick: onAcceptForms }]
  } else if (!state.saved) {
    status = 'Review your plan of action and approve it.'
    actions = [{ id: 'save', label: 'Approve my plan', primary: true, onClick: onSave }]
  } else {
    status = 'All set — your dossier is ready.'
  }

  const btn = (a: Act) =>
    a.primary
      ? 'bg-[#0b7a4e] text-white hover:bg-[#0a5c3b]'
      : 'border border-[color:var(--paper-rule)] bg-[color:var(--paper-card)] text-[color:var(--paper-ink)] hover:bg-[color:var(--paper-bg)]'

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div className="pointer-events-auto w-full max-w-xl overflow-hidden rounded-2xl border border-[color:var(--paper-rule)] bg-[color:var(--paper-card)]/95 shadow-soft backdrop-blur">
        {/* Shelf — what the agent said */}
        {open && r?.answer && (
          <div className="ink-in border-b border-[color:var(--paper-rule)] p-4">
            <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[color:var(--paper-muted)]">
              <BookText className="h-3.5 w-3.5" /> What your agent found
            </p>
            <p className="paper-serif text-[14px] leading-relaxed text-[color:var(--paper-ink)]">
              {r.answer}
            </p>
          </div>
        )}

        {/* Pill */}
        <div className="flex items-center gap-3 px-3 py-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e7f3ec] text-[#0a5c3b]">
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-[color:var(--paper-muted)]">
              Your Fidelity agent
            </p>
            <p
              key={status}
              className="ink-in truncate text-[13px] font-medium text-[color:var(--paper-ink)]"
            >
              {status}
            </p>
          </div>

          {actions.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={a.onClick}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${btn(a)}`}
            >
              {a.label}
            </button>
          ))}

          {r?.answer && (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle agent details"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color:var(--paper-rule)] text-[color:var(--paper-ink-soft)] transition-colors hover:bg-[color:var(--paper-bg)]"
            >
              <ChevronUp className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
