import { useEffect, useState } from 'react'
import {
  Check,
  ChevronDown,
  Paperclip,
  Loader2,
  Download,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  UserCheck,
} from 'lucide-react'
import type { Dispatch } from 'react'
import { CUSTOMERS } from '@/data/customers'
import { FidelityLogo } from '@/components/brand/FidelityLogo'
import type { ChatResponse } from '@/lib/chatContract'
import type { CustomerAction, CustomerState } from './customerMachine'

// --- helpers ----------------------------------------------------------------

const DOC_NAMES: Record<string, string> = {
  'rollover_sop.md': 'rollover policy',
  'ira_opening_guidance.md': 'IRA opening guidance',
  'required_forms_guidance.md': 'forms guidance',
  'approved_customer_language.md': 'approved guidance',
  'escalation_policy.md': 'servicing policy',
  'tax_advice_boundaries.md': 'tax guidance',
}

function firstCitation(r: ChatResponse | null): string {
  const s = r?.rag_sources?.[0]
  if (!s) return "Fidelity's approved guidance"
  const name = DOC_NAMES[s.doc] ?? 'approved guidance'
  return `Fidelity's ${name} [${s.chunk_id}]`
}

function softenReason(reason: string): string {
  const r = reason.replace(/\.$/, '')
  if (/beneficiary/i.test(r)) return 'confirming your beneficiary details'
  if (/address/i.test(r)) return 'confirming your current address'
  if (/loan/i.test(r)) return 'reviewing an outstanding loan on your old plan'
  if (/identity/i.test(r)) return 'finishing your identity check'
  if (/eligibility/i.test(r)) return 'confirming your old plan allows a rollover'
  if (/risk flag/i.test(r)) return 'a routine security review'
  return r.replace(/^Account restriction:\s*/i, '').toLowerCase()
}

// --- small presentational pieces -------------------------------------------

function Footnote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1.5 text-[12px] text-[color:var(--paper-muted)]">{children}</p>
  )
}

function Section({
  n,
  title,
  writing,
  children,
}: {
  n: number
  title: string
  writing?: boolean
  children: React.ReactNode
}) {
  return (
    <section className="ink-in">
      <div className="flex items-baseline gap-2">
        <span className="text-[11px] font-semibold text-[color:var(--paper-muted)]">
          {String(n).padStart(2, '0')}
        </span>
        <h2 className="paper-serif text-[19px] text-[color:var(--paper-ink)]">{title}</h2>
        {writing && <span className="paper-nib ml-0.5" />}
      </div>
      <div className="mt-3 pl-6">{children}</div>
    </section>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-sm text-[color:var(--paper-ink-soft)]">{label}</span>
      <span className="text-right text-sm font-medium text-[color:var(--paper-ink)]">
        {value}
      </span>
    </div>
  )
}

// --- main -------------------------------------------------------------------

export function Dossier({
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
  const customer = state.customerId ? CUSTOMERS[state.customerId] : null
  const r = state.response
  const ready = state.status === 'ready' && !!r
  const escalation = !!r?.escalation_required
  const first = (customer?.name ?? 'there').split(' ')[0]

  const [opened, setOpened] = useState(false)
  useEffect(() => {
    if (ready) {
      const t = window.setTimeout(() => setOpened(true), 350)
      return () => window.clearTimeout(t)
    }
  }, [ready])

  if (!customer) return null

  // reveal gates
  const showFacts = ready && opened
  const showVerdict = showFacts && state.planConfirmed
  const showChoice = showVerdict && !escalation
  const showHandoff = showVerdict && escalation
  const showForms = showChoice && state.movementChoice != null
  const showPlan = showForms && state.formsAcknowledged

  // current activity line + which section is "being written"
  let gutter = 'Reading your account against Fidelity’s approved policy…'
  if (ready && !state.planConfirmed) gutter = 'I’ve drafted your dossier. Confirm your old plan to continue.'
  else if (showHandoff) gutter = 'Handing this to a specialist on your team.'
  else if (showVerdict && !state.movementChoice) gutter = 'Confirm how you’d like the money to move.'
  else if (showForms && !state.formsAcknowledged) gutter = 'Preparing the paperwork you’ll need.'
  else if (showPlan && !state.saved) gutter = 'Writing your plan of action.'
  else if (state.saved) gutter = 'Your dossier is ready.'

  const rail = [
    { label: 'About you', done: showVerdict, current: showFacts && !showVerdict },
    { label: 'Your old plan', done: state.planConfirmed, current: showFacts && !state.planConfirmed },
    {
      label: 'Whether you can roll over',
      done: escalation ? showHandoff : state.movementChoice != null,
      current: showVerdict && !escalation && state.movementChoice == null,
    },
    escalation
      ? { label: 'A specialist review', done: showHandoff, current: showHandoff }
      : { label: "What we'll need", done: state.formsAcknowledged, current: showForms && !state.formsAcknowledged },
    escalation
      ? { label: 'Your copy', done: showHandoff, current: false }
      : { label: 'Your plan of action', done: state.saved, current: showPlan && !state.saved },
  ]

  return (
    <div className="paper min-h-screen">
      <div className="mx-auto w-full max-w-3xl px-5 py-10">
        <FidelityLogo size={26} className="mb-6" />
        {/* Ribbon: Path A legibility, no jargon */}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e7f3ec] px-2.5 py-1 text-[11px] font-medium text-[#0a5c3b]">
          <UserCheck className="h-3.5 w-3.5" /> written using your account details
        </span>

        <h1 className="paper-serif mt-3 text-[30px] leading-tight text-[color:var(--paper-ink)]">
          Your rollover dossier
        </h1>
        <p className="text-sm text-[color:var(--paper-ink-soft)]">
          prepared for {customer.name}
        </p>

        {/* activity gutter */}
        <div className="mt-3 flex items-center gap-2 text-[13px] italic text-[color:var(--paper-ink-soft)]">
          {!ready && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          <span className="paper-serif">{gutter}</span>
        </div>

        <hr className="paper-rule my-7" />

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-[150px_1fr]">
          {/* margin rail */}
          <nav className="hidden flex-col gap-3 text-[13px] sm:flex">
            {rail.map((it) => (
              <div
                key={it.label}
                className={
                  it.current
                    ? 'text-[color:var(--paper-ink)]'
                    : 'text-[color:var(--paper-ink-soft)]'
                }
              >
                <span
                  className={
                    it.done ? 'text-[#0b7a4e]' : it.current ? 'text-[#0b7a4e]' : 'text-[color:var(--paper-muted)]'
                  }
                >
                  {it.done ? '✓' : it.current ? '✎' : '○'}
                </span>{' '}
                {it.label}
              </div>
            ))}
          </nav>

          {/* the composed document */}
          <div className="min-w-0 space-y-7">
            {!showFacts && (
              <div className="space-y-3">
                <div className="h-3 w-1/3 rounded bg-[color:var(--paper-rule)]" />
                <div className="h-3 w-2/3 rounded bg-[color:var(--paper-rule)]" />
                <div className="h-3 w-1/2 rounded bg-[color:var(--paper-rule)]" />
              </div>
            )}

            {showFacts && (
              <>
                <Section n={1} title="About you">
                  <Row label="Name" value={customer.name} />
                  <Row label="State" value={customer.state} />
                  <Row
                    label="Status"
                    value={`${customer.employment_status}${
                      customer.veteran_status && customer.veteran_status !== 'Not a veteran'
                        ? ` · ${customer.veteran_status}`
                        : ''
                    }`}
                  />
                  <Footnote>From your Fidelity profile</Footnote>
                </Section>

                <hr className="paper-rule" />

                <Section n={2} title="Your old plan" writing={ready && !state.planConfirmed}>
                  <Row
                    label="Plan"
                    value={`${customer.source_plan.plan_type} · ${customer.source_plan.plan_provider}`}
                  />
                  <Row
                    label="Outstanding loan"
                    value={customer.source_plan.outstanding_plan_loan ? 'Yes' : 'None'}
                  />
                  <Footnote>From your account, verified today</Footnote>

                  {!state.planConfirmed && (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="text-sm text-[color:var(--paper-ink-soft)]">
                        Is this the plan you'd like to move?
                      </span>
                      <button
                        type="button"
                        onClick={() => dispatch({ type: 'CONFIRM_PLAN' })}
                        className="rounded-full bg-[#0b7a4e] px-3.5 py-1.5 text-[13px] font-medium text-white hover:bg-[#0a5c3b]"
                      >
                        Yes, that's the one
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-[color:var(--paper-rule)] bg-[color:var(--paper-card)] px-3.5 py-1.5 text-[13px] text-[color:var(--paper-ink)]"
                        onClick={() => dispatch({ type: 'CONFIRM_PLAN' })}
                        title="For the demo this continues with the same plan."
                      >
                        That's not it
                      </button>
                    </div>
                  )}
                </Section>
              </>
            )}

            {showVerdict && (
              <>
                <hr className="paper-rule" />
                <Section
                  n={3}
                  title="Whether you can roll over"
                  writing={showVerdict && !escalation && state.movementChoice == null}
                >
                  {escalation ? (
                    <p className="paper-serif flex items-start gap-2 text-[17px] text-[color:var(--paper-ink)]">
                      <AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-[#c2760b]" />
                      We need a specialist to check a few things first, {first}.
                    </p>
                  ) : (
                    <p className="paper-serif flex items-start gap-2 text-[17px] text-[color:var(--paper-ink)]">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-[#0b7a4e]" />
                      Good news, {first} — you're set for a direct rollover.
                    </p>
                  )}
                  <Footnote>From {firstCitation(r)}</Footnote>

                  {showChoice && (
                    <div className="mt-4">
                      {!state.movementChoice ? (
                        <>
                          <p className="mb-2 text-sm text-[color:var(--paper-ink-soft)]">
                            How would you like the money to move?
                          </p>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <button
                              type="button"
                              onClick={() => dispatch({ type: 'CHOOSE_MOVEMENT', choice: 'direct' })}
                              className="rounded-xl border border-[#0b7a4e]/40 bg-[#e7f3ec] p-3.5 text-left"
                            >
                              <span className="block text-sm font-medium text-[#0a5c3b]">
                                Direct transfer · recommended
                              </span>
                              <span className="mt-1 block text-xs text-[color:var(--paper-ink-soft)]">
                                It goes straight to your new IRA, untaxed.
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => dispatch({ type: 'CHOOSE_MOVEMENT', choice: 'indirect' })}
                              className="rounded-xl border border-[color:var(--paper-rule)] bg-[color:var(--paper-card)] p-3.5 text-left"
                            >
                              <span className="block text-sm font-medium text-[color:var(--paper-ink)]">
                                Pay me first
                              </span>
                              <span className="mt-1 block text-xs text-[color:var(--paper-ink-soft)]">
                                You receive it, then have 60 days to redeposit.
                              </span>
                            </button>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-[color:var(--paper-ink-soft)]">
                          You chose{' '}
                          <span className="font-medium text-[color:var(--paper-ink)]">
                            {state.movementChoice === 'direct'
                              ? 'a direct transfer'
                              : 'to be paid first'}
                          </span>
                          .
                        </p>
                      )}
                    </div>
                  )}
                </Section>
              </>
            )}

            {showHandoff && (
              <>
                <hr className="paper-rule" />
                <HandoffCard response={r!} first={first} contact={customer.contact_preference} />
              </>
            )}

            {showForms && (
              <>
                <hr className="paper-rule" />
                <Section n={4} title="What we'll need from you" writing={!state.formsAcknowledged}>
                  <p className="mb-3 text-sm text-[color:var(--paper-ink-soft)]">
                    A couple of enclosures — attach them here when you're ready.
                  </p>
                  <div className="space-y-2">
                    {(r?.required_forms ?? []).map((form) => {
                      const received = state.receivedForms.includes(form)
                      return (
                        <div
                          key={form}
                          className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-[color:var(--paper-rule)] bg-[color:var(--paper-card)] px-3 py-2.5"
                        >
                          <span className="text-sm text-[color:var(--paper-ink)]">{form}</span>
                          {received ? (
                            <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#0b7a4e]">
                              <Check className="h-3.5 w-3.5" /> Received
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => dispatch({ type: 'RECEIVE_FORM', form })}
                              className="inline-flex items-center gap-1 rounded-md border border-[color:var(--paper-rule)] px-2.5 py-1 text-[12px] text-[color:var(--paper-ink-soft)] hover:bg-[#f3eee2]"
                            >
                              <Paperclip className="h-3.5 w-3.5" /> Attach
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  {!state.formsAcknowledged && (
                    <button
                      type="button"
                      onClick={onAcceptForms}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#0b7a4e] px-4 py-2 text-sm font-medium text-white hover:bg-[#0a5c3b]"
                    >
                      Continue to my plan <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                  <p className="mt-3 text-[12px] text-[color:var(--paper-muted)]">
                    Nothing is submitted until you and your associate both sign off.
                  </p>
                </Section>
              </>
            )}

            {showPlan && (
              <>
                <hr className="paper-rule" />
                <PlanOfAction state={state} response={r!} onSave={onSave} />
              </>
            )}

            {/* associate review stamps (reverse channel) */}
            {state.stamps.length > 0 && (
              <div className="ink-in border-t border-[color:var(--paper-rule)] pt-4">
                {state.stamps.map((s, i) => (
                  <p
                    key={i}
                    className="flex items-center gap-1.5 text-[12px] text-[color:var(--paper-muted)]"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-[#0b7a4e]" />
                    {s.label} · {s.associate}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function HandoffCard({
  response,
  first,
  contact,
}: {
  response: ChatResponse
  first: string
  contact: string
}) {
  const [open, setOpen] = useState(false)
  const reasons = Array.from(new Set(response.escalation_reasons.map(softenReason)))
  return (
    <Section n={4} title="A specialist is stepping in">
      <div className="rounded-xl border border-[#c2760b]/25 bg-[#fbf4e6] p-4">
        <p className="paper-serif text-[16px] text-[color:var(--paper-ink)]">
          We're bringing in a specialist, {first}.
        </p>
        <p className="mt-1.5 text-sm text-[color:var(--paper-ink-soft)]">
          A few things on your account need a person's eyes before we move anything —
          no action is needed from you right now. Your associate has your dossier and
          will reach out by {contact}.
        </p>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-[#c2760b]"
        >
          What we're confirming
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <ul className="ink-in mt-2 space-y-1">
            {reasons.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px] text-[color:var(--paper-ink-soft)]">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#c2760b]" />
                {r}
              </li>
            ))}
          </ul>
        )}
      </div>
      <Footnote>You keep a copy of everything gathered so far.</Footnote>
    </Section>
  )
}

function PlanOfAction({
  state,
  response,
  onSave,
}: {
  state: CustomerState
  response: ChatResponse
  onSave: () => void
}) {
  const customer = CUSTOMERS[state.customerId!]
  const steps: string[] = []
  if (!customer.has_existing_fidelity_ira)
    steps.push('Open your Fidelity Traditional IRA — we’ll guide you through it.')
  steps.push('Complete your Fidelity rollover request form.')
  steps.push(
    state.movementChoice === 'indirect'
      ? 'You’ll receive the funds, then we’ll help you redeposit within 60 days.'
      : 'We’ll move your 401(k) straight into your IRA — no funds paid to you, no withholding.',
  )
  steps.push('Your associate confirms each step with you before anything happens.')

  return (
    <Section n={5} title="Your plan of action" writing={!state.saved}>
      <ol className="space-y-2">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3 text-sm text-[color:var(--paper-ink)]">
            <span className="paper-serif text-[color:var(--paper-muted)]">{i + 1}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>

      <div className="mt-5 rounded-xl border border-[color:var(--paper-rule)] bg-[#faf6ec] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--paper-muted)]">
          A note from your team
        </p>
        <p className="paper-serif mt-1.5 text-[15px] leading-relaxed text-[color:var(--paper-ink)]">
          {response.customer_draft}
        </p>
      </div>

      {!state.saved ? (
        <button
          type="button"
          onClick={onSave}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#0b7a4e] px-4 py-2 text-sm font-medium text-white hover:bg-[#0a5c3b]"
        >
          <Check className="h-4 w-4" /> This looks right — save my dossier
        </button>
      ) : (
        <div className="mt-4 flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0a5c3b]">
            <Check className="h-4 w-4" /> Saved
          </span>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--paper-rule)] px-3 py-1.5 text-[13px] text-[color:var(--paper-ink-soft)] hover:bg-[#f3eee2]"
          >
            <Download className="h-3.5 w-3.5" /> Download your dossier
          </button>
        </div>
      )}
    </Section>
  )
}
