import { useState } from 'react'
import {
  ArrowLeft,
  User,
  ShieldCheck,
  FileText,
  PenLine,
  BadgeCheck,
  Check,
  Lock,
  Loader2,
  Send,
  ShieldAlert,
  UserCog,
  UserCheck,
  CircleCheck,
  TriangleAlert,
  RefreshCw,
  Pencil,
  Download,
  Save,
  SkipForward,
  RotateCcw,
  Compass,
  type LucideIcon,
} from 'lucide-react'
import type { DemoScenario, ReadinessCheck } from '@/data/demo-scenarios'
import { B_STEPS, useDemo, type BStep, type StepStatus } from '@/state/DemoContext'
import { CUSTOMERS } from '@/data/customers'
import { AgentEvidencePanel } from './AgentEvidencePanel'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

const PATH_B = '#345A8C'

const STEP_META: Record<BStep, { label: string; icon: LucideIcon }> = {
  context: { label: 'Case Context', icon: User },
  readiness: { label: 'Rollover Readiness Review', icon: ShieldCheck },
  forms: { label: 'Required Forms & Next Steps', icon: FileText },
  draft: { label: 'Draft & Compliance Check', icon: PenLine },
  approval: { label: 'Associate Approval', icon: BadgeCheck },
}

const NODE: Record<StepStatus, string> = {
  complete: 'bg-brand text-white border-brand',
  running: 'bg-secondary text-white border-secondary',
  needs_info: 'bg-warn text-white border-warn',
  pending: 'bg-card text-muted-foreground border-border',
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── shared bits ──────────────────────────────────────────────────────────────
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-ink">{value}</p>
    </div>
  )
}

function Running({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-card/60 px-4 py-3 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin text-secondary" />
      {label}
    </div>
  )
}

function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-base font-semibold text-ink">{children}</h2>
      {hint && <p className="mt-0.5 text-[12.5px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

function Card({ title, children, tone }: { title?: string; children: React.ReactNode; tone?: 'danger' | 'brand' | 'warn' }) {
  const border =
    tone === 'danger' ? 'border-danger/30' : tone === 'brand' ? 'border-brand/30' : tone === 'warn' ? 'border-warn/30' : 'border-border'
  return (
    <div className={cn('rounded-xl border bg-card p-4', border)}>
      {title && <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">{title}</p>}
      {children}
    </div>
  )
}

// ── derivations ───────────────────────────────────────────────────────────────
function nextActionText(
  s: DemoScenario,
  d: { phase: string; submitted: boolean; hitl: string | null; allDone: boolean },
): string {
  if (s.nextAction) return s.nextAction
  const escalate = s.readiness === 'escalate'
  if (d.submitted) return 'Case submitted for review — no further action needed.'
  if (d.hitl) return d.hitl === 'escalated' ? 'Escalated to a supervisor — awaiting their review.' : 'Reassigned to a specialist — handed off.'
  if (d.phase === 'running') return 'Review the evidence on the right as the agent completes its checks.'
  if (escalate) return 'Decide routing: escalate to a supervisor or reassign to a specialist.'
  if (!d.allDone) return 'Complete the review queue below, then submit the draft for review.'
  return 'Everything checks out — submit the reviewed draft for approval.'
}

// ── step: Case Context ─────────────────────────────────────────────────────────
function CaseContext({ scenario }: { scenario: DemoScenario }) {
  const c = CUSTOMERS[scenario.customerId ?? '']
  return (
    <div>
      <SectionTitle hint="Who this customer is and what they’re asking for.">Case Context</SectionTitle>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <Field label="Customer" value={c?.name ?? scenario.caseCard.customerName} />
        <Field label="Customer ID" value={scenario.caseCard.customerId} />
        <Field label="Case ID" value={scenario.caseCard.id} />
        {c && <Field label="Age" value={String(c.age)} />}
        {c && <Field label="State" value={c.state} />}
        {c && <Field label="Employment" value={c.employment_status} />}
        {c?.veteran_status && c.veteran_status !== 'Not a veteran' && <Field label="Note" value={c.veteran_status} />}
        {c && <Field label="Source account" value={`${c.source_plan.plan_type} · ${c.source_plan.plan_provider}`} />}
        {c && <Field label="Destination" value={c.destination_account} />}
        <Field label="Rollover intent" value={c?.rollover_goal ?? 'Direct rollover to a Fidelity IRA'} />
      </div>
    </div>
  )
}

// ── step: Rollover Readiness Review ────────────────────────────────────────────
function CheckRow({ check }: { check: ReadinessCheck }) {
  const tone = check.ok === true ? 'text-brand-dark' : check.ok === 'warn' ? 'text-warn' : 'text-danger'
  const Icon = check.ok === true ? CircleCheck : TriangleAlert
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm animate-fade-in">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className={cn('h-4 w-4', tone)} />
        {check.label}
      </span>
      <span className={cn('text-right font-medium', tone)}>{check.value}</span>
    </div>
  )
}

function Readiness({ scenario }: { scenario: DemoScenario }) {
  const { readinessRevealed, readinessReady } = useDemo()
  const all = scenario.readinessChecks ?? []
  const shown = all.slice(0, readinessRevealed)
  const result = scenario.readiness
  return (
    <div>
      <SectionTitle hint="The agent checked the account against approved policy — you review the result.">
        Rollover Readiness Review
      </SectionTitle>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {shown.map((chk, i) => (
          <div key={chk.label} className={cn(i > 0 && 'border-t border-border')}>
            <CheckRow check={chk} />
          </div>
        ))}
        {shown.length < all.length && (
          <div className="flex items-center gap-2 border-t border-border px-4 py-2.5 text-[13px] text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-secondary" /> checking…
          </div>
        )}
      </div>
      <div className="mt-3">
        {!readinessReady ? (
          <Running label="Running eligibility, restriction, and identity checks…" />
        ) : result === 'escalate' ? (
          <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger-soft/50 px-4 py-3 text-sm font-medium text-danger">
            <ShieldAlert className="h-4 w-4" /> Escalate — this case needs specialist review before a rollover can proceed.
          </div>
        ) : result === 'review' ? (
          <div className="flex items-center gap-2 rounded-xl border border-warn/30 bg-warn/10 px-4 py-3 text-sm font-medium text-warn">
            <TriangleAlert className="h-4 w-4" /> Needs associate review before proceeding.
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-brand/30 bg-brand-soft/50 px-4 py-3 text-sm font-medium text-brand-dark">
            <CircleCheck className="h-4 w-4" /> Ready to proceed — no blocking issues found.
          </div>
        )}
      </div>
    </div>
  )
}

// ── step: Required Forms & Next Steps ──────────────────────────────────────────
function Forms({ scenario }: { scenario: DemoScenario }) {
  const { formsReady } = useDemo()
  if (!formsReady) {
    return (
      <div>
        <SectionTitle hint="Documents and next actions based on the readiness review.">Required Forms & Next Steps</SectionTitle>
        <Running label="Identifying required forms and next steps…" />
      </div>
    )
  }
  return (
    <div>
      <SectionTitle hint="Documents and next actions based on the readiness review.">Required Forms & Next Steps</SectionTitle>
      {scenario.openIraFirst && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-secondary/20 bg-accent px-3 py-2 text-[13px] text-secondary">
          <FileText className="h-4 w-4" /> A Fidelity IRA must be opened first — no suitable IRA is on file.
        </div>
      )}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {(scenario.requiredForms ?? []).map((f, i) => (
          <div key={f} className={cn('flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink', i > 0 && 'border-t border-border')}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-ink-soft">{i + 1}</span>
            {f}
          </div>
        ))}
      </div>
      {scenario.optionalForms && scenario.optionalForms.length > 0 && (
        <p className="mt-2 text-[12px] text-muted-foreground">Optional: {scenario.optionalForms.join(', ')}</p>
      )}
    </div>
  )
}

// ── step: Draft & Compliance Check ─────────────────────────────────────────────
function DraftCompliance({ scenario }: { scenario: DemoScenario }) {
  const { draftReady, complianceReady } = useDemo()
  const [draft, setDraft] = useState(scenario.draft ?? '')
  const [editing, setEditing] = useState(false)
  const held = scenario.readiness === 'escalate'
  if (!draftReady) {
    return (
      <div>
        <SectionTitle hint="The agent drafts the customer-facing response and validates it.">Draft & Compliance Check</SectionTitle>
        <Running label="Drafting the customer response and running compliance checks…" />
      </div>
    )
  }
  return (
    <div>
      <SectionTitle hint="The agent drafts the customer-facing response and validates it.">Draft & Compliance Check</SectionTitle>
      {held && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-[13px] text-warn">
          <TriangleAlert className="h-4 w-4" /> Draft withheld — this case must clear specialist review before a proceed-message is sent.
        </div>
      )}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Customer response draft</span>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => setDraft(scenario.draft ?? '')}>
              <RefreshCw className="h-3.5 w-3.5" /> Regenerate
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing((e) => !e)}>
              <Pencil className="h-3.5 w-3.5" /> {editing ? 'Done' : 'Edit'}
            </Button>
          </div>
        </div>
        {editing ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="scrollbar-slim h-32 w-full resize-none bg-transparent px-4 py-3 text-sm leading-relaxed text-ink focus:outline-none"
          />
        ) : (
          <p className="px-4 py-3 text-sm leading-relaxed text-ink">{draft}</p>
        )}
      </div>

      <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Compliance validation</p>
      {!complianceReady ? (
        <Running label="Validating the draft against compliance guardrails…" />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {(scenario.complianceChecks ?? []).map((chk, i) => (
              <div key={chk.label} className={cn('flex items-center justify-between px-4 py-2 text-[13px]', i > 0 && 'border-t border-border')}>
                <span className="text-muted-foreground">{chk.label}</span>
                <span className={cn('flex items-center gap-1 font-medium', chk.ok ? 'text-brand-dark' : 'text-danger')}>
                  <CircleCheck className="h-3.5 w-3.5" /> {chk.ok ? 'Pass' : 'Fail'}
                </span>
              </div>
            ))}
          </div>
          {scenario.complianceWarnings && scenario.complianceWarnings.length > 0 && (
            <div className="mt-2 rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-[12.5px] text-warn">
              {scenario.complianceWarnings.map((w) => (
                <p key={w}>{w}</p>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── step: Associate Approval ────────────────────────────────────────────────────
function Approval({ scenario }: { scenario: DemoScenario }) {
  const { checklist, submitted, hitl, submit, decideHitl } = useDemo()
  const items = scenario.reviewChecklist ?? []
  const allDone = items.every((i) => checklist[i.id])
  const escalate = scenario.readiness === 'escalate'
  return (
    <div>
      <SectionTitle hint="Final human-in-the-loop review before anything is submitted.">Associate Approval</SectionTitle>
      <div className="grid gap-2.5 sm:grid-cols-3">
        <Field label="Readiness" value={escalate ? 'Escalate' : 'Ready to proceed'} />
        <Field label="Required forms" value={`${(scenario.requiredForms ?? []).length} identified`} />
        <Field label="Compliance" value={escalate ? 'Warnings open' : 'All checks pass'} />
      </div>
      <div className="mt-4 rounded-xl border border-border bg-card p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Draft preview</p>
        <p className="mt-1.5 text-sm leading-relaxed text-ink">{scenario.draft}</p>
      </div>
      <div className="mt-5">
        {submitted ? (
          <div className="flex items-center gap-2 rounded-xl border border-brand/30 bg-brand-soft/50 px-4 py-3 text-sm font-medium text-brand-dark animate-fade-in">
            <CircleCheck className="h-4 w-4" /> Submitted for review.
          </div>
        ) : hitl ? (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm font-medium text-ink animate-fade-in">
            <CircleCheck className="h-4 w-4 text-brand-dark" />
            {hitl === 'escalated' ? 'Escalated to a supervisor — case held pending review.' : 'Reassigned to a rollover specialist.'}
          </div>
        ) : escalate ? (
          <div>
            <p className="mb-2 text-[13px] text-muted-foreground">
              This case can’t be submitted while readiness checks are unresolved. The associate decides how to route it.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="destructive" onClick={() => decideHitl('escalated')}>
                <ShieldAlert /> Escalate to supervisor
              </Button>
              <Button variant="outline" onClick={() => decideHitl('reassigned')}>
                <UserCog /> Reassign to specialist
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <Button size="lg" disabled={!allDone} onClick={submit}>
              <Send /> Submit for Review
            </Button>
            {!allDone && <p className="mt-2 text-[12px] text-muted-foreground">Complete the review queue below to enable submission.</p>}
          </div>
        )}
      </div>
    </div>
  )
}

// ── new cards ─────────────────────────────────────────────────────────────────
function StatusPill({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: 'neutral' | 'good' | 'warn' | 'danger' | 'muted' }) {
  const cls = {
    neutral: 'text-ink',
    good: 'text-brand-dark',
    warn: 'text-warn',
    danger: 'text-danger',
    muted: 'text-muted-foreground',
  }[tone]
  return (
    <div className="rounded-lg border border-border bg-background/60 px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn('mt-0.5 text-[13px] font-semibold capitalize', cls)}>{value}</p>
    </div>
  )
}

function CaseSummaryCard({ scenario, statusText }: { scenario: DemoScenario; statusText: string }) {
  const d = useDemo()
  const escalate = scenario.readiness === 'escalate'
  const readiness = d.readinessReady ? (scenario.readiness ?? 'ready') : 'analyzing…'
  const forms = d.formsReady ? `${(scenario.requiredForms ?? []).length} identified` : 'pending'
  const draft = d.draftReady ? (escalate ? 'withheld' : 'ready') : 'pending'
  const approval = d.submitted ? 'submitted' : d.hitl ? d.hitl : d.approvalReady ? 'awaiting associate' : 'pending'
  return (
    <Card title="Case Summary">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <StatusPill label="Status" value={statusText} tone={escalate && d.readinessReady ? 'warn' : 'neutral'} />
        <StatusPill label="Readiness" value={readiness} tone={!d.readinessReady ? 'muted' : escalate ? 'danger' : 'good'} />
        <StatusPill label="Forms" value={forms} tone={d.formsReady ? 'neutral' : 'muted'} />
        <StatusPill label="Draft" value={draft} tone={!d.draftReady ? 'muted' : escalate ? 'warn' : 'good'} />
        <StatusPill label="Approval" value={approval} tone={d.submitted ? 'good' : d.hitl ? 'warn' : 'muted'} />
        <StatusPill label="Priority" value={scenario.caseCard.priority} tone={scenario.caseCard.priority === 'high' ? 'danger' : 'neutral'} />
      </div>
    </Card>
  )
}

function NextBestActionCard({ scenario }: { scenario: DemoScenario }) {
  const d = useDemo()
  const items = scenario.reviewChecklist ?? []
  const allDone = items.every((i) => d.checklist[i.id])
  const text = nextActionText(scenario, { phase: d.phase, submitted: d.submitted, hitl: d.hitl, allDone })
  return (
    <div className="flex items-start gap-3 rounded-xl border p-4" style={{ borderColor: PATH_B + '33', background: PATH_B + '0d' }}>
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ background: PATH_B + '1a', color: PATH_B }}>
        <Compass className="h-4 w-4" />
      </span>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: PATH_B }}>Next best action</p>
        <p className="mt-0.5 text-sm font-medium text-ink">{text}</p>
      </div>
    </div>
  )
}

function DecisionSummaryCard({ scenario }: { scenario: DemoScenario }) {
  const { readinessReady } = useDemo()
  if (!readinessReady) return null
  const escalate = scenario.readiness === 'escalate'
  const why =
    scenario.decisionWhy ??
    (escalate
      ? scenario.escalationReasons ?? []
      : (scenario.readinessChecks ?? []).filter((c) => c.ok === true).map((c) => `${c.label}: ${c.value}`))
  const evidence = [
    ...(scenario.mcpCalls ?? []).filter((m) => (escalate ? m.flagged : !m.flagged)).map((m) => `${m.tool}()`),
    ...scenario.ragSources.map((r) => r.id),
  ]
  const result = escalate ? 'Escalated' : scenario.readiness === 'review' ? 'Needs review' : 'Ready to proceed'
  return (
    <Card title="Decision Summary" tone={escalate ? 'danger' : 'brand'}>
      <div className="flex items-center gap-2">
        {escalate ? <ShieldAlert className="h-4 w-4 text-danger" /> : <CircleCheck className="h-4 w-4 text-brand-dark" />}
        <span className={cn('text-sm font-semibold', escalate ? 'text-danger' : 'text-brand-dark')}>{result}</span>
      </div>
      <p className="mb-1 mt-3 text-[10px] font-semibold uppercase tracking-wider text-ink-soft">Why</p>
      <ul className="space-y-0.5">
        {why.map((w) => (
          <li key={w} className="flex gap-1.5 text-[12.5px] text-ink-soft">
            <span className="text-muted-foreground">•</span> {w}
          </li>
        ))}
      </ul>
      <p className="mb-1.5 mt-3 text-[10px] font-semibold uppercase tracking-wider text-ink-soft">Key evidence</p>
      <div className="flex flex-wrap gap-1.5">
        {evidence.map((e) => (
          <span key={e} className="rounded-md border border-border bg-background/60 px-2 py-0.5 font-mono text-[10.5px] text-ink-soft">{e}</span>
        ))}
      </div>
    </Card>
  )
}

function ReviewQueueCard({ scenario }: { scenario: DemoScenario }) {
  const { checklist, toggleChecklist, phase } = useDemo()
  return (
    <Card title="Associate Review Queue">
      <p className="mb-2.5 -mt-1 text-[12px] text-muted-foreground">
        Auto items are ticked by the agent; confirm the rest before submitting.
      </p>
      <div className="flex flex-wrap gap-2">
        {(scenario.reviewChecklist ?? []).map((item) => {
          const checked = !!checklist[item.id]
          const locked = item.auto
          return (
            <button
              key={item.id}
              type="button"
              disabled={locked || phase !== 'result'}
              onClick={() => !locked && toggleChecklist(item.id)}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[12px] transition-colors',
                checked ? 'border-brand/40 bg-brand-soft/50 text-brand-dark' : 'border-border bg-card text-ink-soft hover:bg-muted',
                (locked || phase !== 'result') && 'cursor-default',
              )}
            >
              <span className={cn('flex h-4 w-4 items-center justify-center rounded border', checked ? 'border-brand bg-brand text-white' : 'border-border')}>
                {checked && <Check className="h-3 w-3" />}
              </span>
              {item.label}
              {locked && <span className="text-[9px] uppercase text-muted-foreground">auto</span>}
            </button>
          )
        })}
      </div>
    </Card>
  )
}

// ── the workspace ─────────────────────────────────────────────────────────────
export function PathBWorkspace({ scenario }: { scenario: DemoScenario }) {
  const { stepStatus, activeStep, setActiveStep, checklist, submitted, phase, close, skip, replay, submit, saveCase, requestReview, caseSaved, reviewRequested } = useDemo()
  const escalate = scenario.readiness === 'escalate'
  const items = scenario.reviewChecklist ?? []
  const allDone = items.every((i) => checklist[i.id])
  const statusText = submitted ? 'Submitted' : phase === 'running' ? 'Agent working…' : escalate ? 'Needs review' : 'Ready for approval'

  const exportSummary = () => {
    const lines = [
      `Case ${scenario.caseCard.id} — ${scenario.caseCard.customerName} (${scenario.caseCard.customerId})`,
      `Path: B — Controlled Prompt Chain`,
      `Readiness: ${scenario.readiness}`,
      `Required forms: ${(scenario.requiredForms ?? []).join('; ')}`,
      `Decision — why:`,
      ...((scenario.decisionWhy ?? scenario.escalationReasons ?? []).map((w) => `  - ${w}`)),
      `Draft:`,
      `  ${scenario.draft}`,
    ]
    downloadText(`${scenario.caseCard.id}-summary.txt`, lines.join('\n'))
    toast({ title: 'Summary exported', description: `${scenario.caseCard.id}-summary.txt`, variant: 'info' })
  }

  const onSave = () => { saveCase(); toast({ title: 'Case saved', variant: 'success' }) }
  const onRequestReview = () => { requestReview(); toast({ title: 'Sent to associate review queue', variant: 'info' }) }

  const canApprove = phase === 'result' && allDone && !escalate && !submitted

  return (
    <div className="flex h-full flex-col">
      {/* top bar */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-4 py-2.5">
        <button type="button" onClick={close} className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:bg-muted">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="mx-1 h-5 w-px bg-border" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">
            {scenario.caseCard.customerName} <span className="font-mono text-xs font-normal text-muted-foreground">· {scenario.caseCard.id}</span>
          </p>
          <p className="truncate text-[11px] text-muted-foreground">{scenario.caseCard.customerId} · {statusText}</p>
        </div>
        {phase === 'running' ? (
          <Button size="sm" variant="ghost" onClick={skip}><SkipForward className="h-4 w-4" /> Skip</Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={replay}><RotateCcw className="h-4 w-4" /> Replay</Button>
        )}
        <span className="rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider" style={{ background: PATH_B + '15', color: PATH_B, border: `1px solid ${PATH_B}33` }}>
          Path B · Controlled Prompt Chain
        </span>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* left step sidebar */}
        <nav className="hidden w-60 shrink-0 flex-col gap-1 border-r border-border bg-card/60 p-3 md:flex">
          <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Servicing workflow</p>
          {B_STEPS.map((step, i) => {
            const status = stepStatus[step]
            const locked = status === 'pending' && phase === 'running'
            const active = activeStep === step
            const Icon = STEP_META[step].icon
            const done = status === 'complete'
            const subtext = locked ? `unlocks after step ${i}` : status === 'needs_info' ? 'needs review' : status === 'pending' ? 'ready for approval' : status
            return (
              <button
                key={step}
                type="button"
                disabled={locked}
                onClick={() => !locked && setActiveStep(step)}
                title={locked ? 'Unlocks when the previous step completes' : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors',
                  active ? 'bg-accent' : 'hover:bg-muted',
                  locked && 'cursor-not-allowed opacity-55',
                )}
              >
                <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold', NODE[status])}>
                  {done ? <Check className="h-4 w-4" /> : locked ? <Lock className="h-3.5 w-3.5" /> : status === 'running' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
                </span>
                <span className="min-w-0">
                  <span className={cn('block truncate font-medium', active ? 'text-ink' : 'text-ink-soft')}>{STEP_META[step].label}</span>
                  <span className="block text-[10.5px] capitalize text-muted-foreground">{subtext}</span>
                </span>
              </button>
            )
          })}
        </nav>

        {/* center */}
        <main className="scrollbar-slim min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-5 pb-8">
            {/* Case Action Bar */}
            <div className="sticky top-0 z-10 -mx-5 mb-5 flex flex-wrap items-center gap-2 border-b border-border bg-card/95 px-5 py-3 backdrop-blur">
              <Button size="sm" variant="outline" onClick={onSave} disabled={caseSaved}>
                <Save className="h-3.5 w-3.5" /> {caseSaved ? 'Saved' : 'Save Case'}
              </Button>
              <Button size="sm" variant="outline" onClick={exportSummary}>
                <Download className="h-3.5 w-3.5" /> Export Summary
              </Button>
              <Button size="sm" variant="secondary" onClick={onRequestReview} disabled={reviewRequested || submitted}>
                <UserCheck className="h-3.5 w-3.5" /> {reviewRequested ? 'Review requested' : 'Request Associate Review'}
              </Button>
              <div className="ml-auto">
                <Button
                  size="sm"
                  disabled={!canApprove}
                  onClick={submit}
                  title={escalate ? 'Resolve the escalation before approving' : !allDone ? 'Complete the review queue first' : undefined}
                >
                  <BadgeCheck className="h-3.5 w-3.5" /> {submitted ? 'Case finished' : 'Approve / Finish Case'}
                </Button>
              </div>
            </div>

            <div className="space-y-5">
              <CaseSummaryCard scenario={scenario} statusText={statusText} />
              <NextBestActionCard scenario={scenario} />

              {/* active step */}
              <div className="rounded-xl border border-border bg-card p-4">
                {activeStep === 'context' && <CaseContext scenario={scenario} />}
                {activeStep === 'readiness' && <Readiness scenario={scenario} />}
                {activeStep === 'forms' && <Forms scenario={scenario} />}
                {activeStep === 'draft' && <DraftCompliance scenario={scenario} />}
                {activeStep === 'approval' && <Approval scenario={scenario} />}
              </div>

              <DecisionSummaryCard scenario={scenario} />
              <ReviewQueueCard scenario={scenario} />
            </div>
          </div>
        </main>

        <AgentEvidencePanel />
      </div>
    </div>
  )
}
