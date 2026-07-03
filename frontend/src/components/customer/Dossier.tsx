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
  UserRound,
  FileText,
  PenLine,
  UserCog,
} from 'lucide-react'
import type { Dispatch } from 'react'
import { CUSTOMERS } from '@/data/customers'
import { cn } from '@/lib/utils'
import { CustomerShell } from './CustomerShell'
import { DossierProgress, type ProgressStep } from './DossierProgress'
import { CustomerIsland } from './CustomerIsland'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
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

  // Terminal "you're all set" popup once the dossier is saved.
  const [showDone, setShowDone] = useState(false)
  useEffect(() => {
    if (state.saved) setShowDone(true)
  }, [state.saved])

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

  const progressSteps: ProgressStep[] = escalation
    ? [
        { label: 'Your details', icon: UserRound, state: state.planConfirmed ? 'done' : showFacts ? 'current' : 'todo' },
        { label: 'Eligibility', icon: ShieldCheck, state: showHandoff ? 'done' : showVerdict ? 'current' : 'todo' },
        { label: 'Specialist review', icon: UserCog, state: showHandoff ? 'current' : 'todo' },
      ]
    : [
        { label: 'Your details', icon: UserRound, state: state.planConfirmed ? 'done' : showFacts ? 'current' : 'todo' },
        { label: 'Eligibility', icon: ShieldCheck, state: state.movementChoice != null ? 'done' : showVerdict ? 'current' : 'todo' },
        { label: 'Paperwork', icon: FileText, state: state.formsAcknowledged ? 'done' : showForms ? 'current' : 'todo' },
        { label: 'Your plan', icon: PenLine, state: state.saved ? 'done' : showPlan ? 'current' : 'todo' },
      ]

  return (
    <>
    <CustomerShell bar={<DossierProgress steps={progressSteps} />}>
      {/* Hero */}
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e7f3ec] px-2.5 py-1 text-[11px] font-medium text-[#0a5c3b]">
          <UserCheck className="h-3.5 w-3.5" /> written using your account details
        </span>
        <h1 className="paper-serif mt-3 text-[32px] leading-tight text-[color:var(--paper-ink)]">
          Your rollover dossier
        </h1>
        <p className="text-sm text-[color:var(--paper-ink-soft)]">prepared for {customer.name}</p>

        <div className="mt-2.5 flex items-center gap-2 text-[13px] italic text-[color:var(--paper-ink-soft)]">
          {!ready && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          <span className="paper-serif">{gutter}</span>
        </div>

        {/* account flow + eligibility status */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="rounded-xl border border-[color:var(--paper-rule)] bg-[color:var(--paper-card)] px-3.5 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-[color:var(--paper-muted)]">From</p>
            <p className="text-sm font-medium text-[color:var(--paper-ink)]">{customer.source_plan.plan_type}</p>
            <p className="text-[11px] text-[color:var(--paper-ink-soft)]">{customer.source_plan.plan_provider}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-[color:var(--paper-muted)]" />
          <div className="rounded-xl border border-[#0b7a4e]/20 bg-[#e7f3ec] px-3.5 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-[#0a5c3b]/70">To</p>
            <p className="text-sm font-medium text-[#0a5c3b]">{customer.destination_account}</p>
            <p className="text-[11px] text-[#0a5c3b]/70">Fidelity</p>
          </div>
          {showVerdict && (
            <span
              className={cn(
                'ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium',
                escalation ? 'bg-[#fbeeda] text-[#c2760b]' : 'bg-[#e7f3ec] text-[#0a5c3b]',
              )}
            >
              {escalation ? <AlertTriangle className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
              {escalation ? 'Specialist review' : 'Eligible · direct rollover'}
            </span>
          )}
        </div>
      </div>

      {/* the composed document */}
      <div className="paper-card space-y-7 rounded-2xl p-6 shadow-soft sm:p-7">
        {!showFacts && (
          <div className="space-y-3">
            <div className="shimmer h-3.5 w-1/3 rounded bg-[color:var(--paper-rule)]" />
            <div className="shimmer h-3.5 w-2/3 rounded bg-[color:var(--paper-rule)]" />
            <div className="shimmer h-3.5 w-1/2 rounded bg-[color:var(--paper-rule)]" />
            <div className="shimmer h-3.5 w-4/5 rounded bg-[color:var(--paper-rule)]" />
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

                  {showChoice && state.movementChoice && (
                    <p className="mt-4 text-sm text-[color:var(--paper-ink-soft)]">
                      You chose{' '}
                      <span className="font-medium text-[color:var(--paper-ink)]">
                        {state.movementChoice === 'direct'
                          ? 'a direct transfer'
                          : 'to be paid first'}
                      </span>
                      . The options are in the agent bar below.
                    </p>
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
                  <p className="mt-3 text-[12px] text-[color:var(--paper-muted)]">
                    Nothing is submitted until you and your associate both sign off.
                  </p>
                </Section>
              </>
            )}

            {showPlan && (
              <>
                <hr className="paper-rule" />
                <PlanOfAction state={state} response={r!} />
              </>
            )}

        <div className="h-24" aria-hidden />
      </div>
    </CustomerShell>

      <CustomerIsland
        state={state}
        dispatch={dispatch}
        onAcceptForms={onAcceptForms}
        onSave={onSave}
      />

      <Dialog open={showDone} onOpenChange={setShowDone}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-[#e7f3ec] text-[#0a5c3b]">
              <Check className="h-6 w-6" />
            </span>
            <DialogTitle>You're all set</DialogTitle>
            <DialogDescription>
              Your dossier is saved. Your associate will confirm each step with you
              before anything happens.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => dispatch({ type: 'RESET' })}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0b7a4e] px-4 py-2 text-sm font-medium text-white hover:bg-[#0a5c3b]"
            >
              Back to home
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
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
}: {
  state: CustomerState
  response: ChatResponse
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

      {state.saved && (
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
