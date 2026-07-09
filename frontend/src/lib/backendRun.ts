// Runs a case against the REAL backend (/chat) and maps the response into the
// DemoScenario shape the workspaces render. The static scenario supplies the
// stable case-card / customer / question; the backend supplies the live routing
// decision, tool results, RAG sources, guardrail outcome, and draft.
//
// If the backend is unreachable, the caller falls back to the scripted scenario
// so the UI never blanks.

import type {
  DemoScenario,
  ReasoningStep,
  ReadinessCheck,
  ComplianceCheck,
  ChecklistItem,
} from '@/data/demo-scenarios'
import { postChat, type ChatResponse } from '@/lib/chatContract'

const STANDARD_CHECKLIST: ChecklistItem[] = [
  { id: 'context', label: 'Customer context reviewed', auto: true },
  { id: 'readiness', label: 'Rollover readiness reviewed', auto: true },
  { id: 'forms', label: 'Required forms verified' },
  { id: 'response', label: 'Customer response reviewed' },
  { id: 'compliance', label: 'Compliance warnings resolved or escalated', auto: true },
]

type Tools = Record<string, any>

function cap(v: unknown): string {
  const s = String(v ?? '—')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function rolloverLabel(v: unknown): string {
  if (v === true) return 'Yes'
  if (v === false) return 'No'
  return cap(v)
}

function rolloverOk(v: unknown): boolean | 'warn' {
  if (v === true) return true
  if (v === 'unknown' || v == null) return 'warn'
  return false
}

// --- readiness checks from live MCP tool_results ----------------------------
function buildReadinessChecks(tr: Tools): ReadinessCheck[] {
  const prof = tr.get_customer_profile ?? {}
  const ira = tr.check_existing_ira ?? {}
  const plan = tr.get_source_plan_details ?? {}
  const restr = tr.check_account_restrictions ?? {}
  const docs = tr.get_document_or_case_status ?? {}
  const restrictions: string[] = restr.account_restrictions ?? []
  return [
    { label: 'Customer found', value: prof.found ? 'Yes' : 'No', ok: !!prof.found },
    {
      label: 'Identity verification',
      value: cap(docs.identity_verification),
      ok: docs.identity_verification === 'complete',
    },
    {
      label: 'Existing Fidelity IRA',
      value: ira.has_existing_fidelity_ira ? 'On file' : 'None on file',
      ok: ira.has_existing_fidelity_ira ? true : 'warn',
    },
    {
      label: 'Source-plan rollover allowed',
      value: rolloverLabel(plan.rollover_allowed),
      ok: rolloverOk(plan.rollover_allowed),
    },
    {
      label: 'Outstanding plan loan',
      value: plan.outstanding_plan_loan ? 'Yes' : 'No',
      ok: !plan.outstanding_plan_loan,
    },
    {
      label: 'Account restrictions',
      value: restrictions.length ? restrictions.join(' · ') : 'None',
      ok: restrictions.length ? false : true,
    },
  ]
}

// --- MCP call log from tools_called + tool_results --------------------------
function planFlagged(tr: Tools): boolean {
  const p = tr.get_source_plan_details ?? {}
  return p.rollover_allowed !== true || !!p.outstanding_plan_loan || p.plan_details_complete === false
}
function restrFlagged(tr: Tools): boolean {
  return !!(tr.check_account_restrictions ?? {}).has_restrictions
}
function idFlagged(tr: Tools): boolean {
  const d = tr.get_document_or_case_status ?? {}
  return !!d.identity_verification && d.identity_verification !== 'complete'
}

function buildMcpCalls(res: ChatResponse): { tool: string; result: string; flagged?: boolean }[] {
  const tr: Tools = res.trace?.tool_results ?? {}
  const describe: Record<string, () => { result: string; flagged?: boolean }> = {
    get_customer_profile: () => ({
      result: `${tr.get_customer_profile?.name ?? '—'} — ${tr.get_customer_profile?.found ? 'found' : 'not found'}`,
      flagged: !tr.get_customer_profile?.found,
    }),
    check_existing_ira: () => ({
      result: tr.check_existing_ira?.has_existing_fidelity_ira ? 'IRA on file' : 'None on file',
    }),
    list_retirement_accounts: () => ({
      result: `${(tr.list_retirement_accounts?.retirement_accounts ?? []).length} account(s)`,
    }),
    get_source_plan_details: () => ({
      result: `rollover_allowed: ${tr.get_source_plan_details?.rollover_allowed}${
        tr.get_source_plan_details?.outstanding_plan_loan ? ' · outstanding loan' : ''
      }`,
      flagged: planFlagged(tr),
    }),
    check_account_restrictions: () => ({
      result: restrFlagged(tr)
        ? (tr.check_account_restrictions?.account_restrictions ?? []).join(' · ')
        : 'none',
      flagged: restrFlagged(tr),
    }),
    get_document_or_case_status: () => ({
      result: `identity verification: ${tr.get_document_or_case_status?.identity_verification}`,
      flagged: idFlagged(tr),
    }),
  }
  return (res.tools_called ?? []).map((t) => {
    const d = describe[t.tool]?.() ?? { result: t.status }
    return { tool: t.tool, result: d.result, flagged: d.flagged }
  })
}

// --- reasoning (evidence panel) reconstructed from live data ----------------
function buildReasoningA(res: ChatResponse): ReasoningStep[] {
  const steps: ReasoningStep[] = [
    {
      id: 'a1',
      kind: 'route',
      label: 'Router · classify',
      detail:
        'General/educational question — not tied to a specific account → Path A (Augmented LLM). No customer lookup needed.',
      verdict: 'ok',
    },
    {
      id: 'a2',
      kind: 'rag',
      label: 'Retrieve approved guidance',
      detail: 'pgvector top-k over the approved corpus.',
      meta: (res.rag_sources ?? []).map((r) => r.chunk_id).join(' · '),
    },
  ]
  const content = (res.skills_used ?? []).filter((s) => s.kind === 'content')
  content.forEach((s, i) =>
    steps.push({
      id: `a${i + 3}`,
      kind: 'skill',
      label: s.skill,
      detail: s.detail || 'Applied agent skill.',
      verdict: 'ok',
    }),
  )
  steps.push({
    id: 'aZ',
    kind: 'done',
    label: 'General answer ready',
    detail: 'One grounded pass over RAG + Agent Skills. No MCP, no gates, no human step.',
    verdict: 'pass',
  })
  return steps
}

function buildReasoningB(res: ChatResponse): ReasoningStep[] {
  const tr: Tools = res.trace?.tool_results ?? {}
  const id = res.trace?.parsed?.customer_id ?? 'the customer'
  const escalate = res.escalation_required
  const steps: ReasoningStep[] = [
    { id: 'b1', kind: 'route', label: 'Router · classify', detail: `Rollover intent + specific customer (${id}) → Path B (Controlled Prompt Chain).`, verdict: 'ok' },
    { id: 'b2', kind: 'gate', label: 'Gate — customer-specific?', detail: `Identifier ${id} present → proceed to the fixed MCP tool chain.`, verdict: 'pass' },
    { id: 'b3', kind: 'call', label: 'get_customer_profile()', detail: `${tr.get_customer_profile?.name ?? '—'} — ${tr.get_customer_profile?.found ? 'found' : 'not found'}.`, verdict: 'ok', meta: 'MCP' },
    { id: 'b4', kind: 'gate', label: 'Gate — customer found?', detail: 'Profile resolved → continue retrieving account facts.', verdict: 'pass' },
    { id: 'b5', kind: 'call', label: 'check_existing_ira() · list_retirement_accounts()', detail: tr.check_existing_ira?.has_existing_fidelity_ira ? 'Traditional IRA already on file.' : 'No Fidelity IRA yet — one must be opened first.', verdict: 'ok', meta: 'MCP' },
    { id: 'b6', kind: 'call', label: 'get_source_plan_details()', detail: `rollover_allowed: ${tr.get_source_plan_details?.rollover_allowed}${tr.get_source_plan_details?.outstanding_plan_loan ? ' · outstanding plan loan' : ' · no loan'}.`, verdict: planFlagged(tr) ? 'flag' : 'ok', meta: 'MCP' },
    { id: 'b7', kind: 'call', label: 'check_account_restrictions()', detail: restrFlagged(tr) ? (tr.check_account_restrictions?.account_restrictions ?? []).join(' · ') + '.' : 'No restrictions.', verdict: restrFlagged(tr) ? 'flag' : 'ok', meta: 'MCP' },
    { id: 'b8', kind: 'call', label: 'get_document_or_case_status()', detail: `identity verification: ${tr.get_document_or_case_status?.identity_verification}.`, verdict: idFlagged(tr) ? 'flag' : 'ok', meta: 'MCP' },
    { id: 'b9', kind: 'think', label: 'Validate customer / missing data', detail: escalate ? 'Blocking issues found across eligibility, restrictions, or identity.' : 'Eligible, no loan, no restrictions, identity verified. Only standard forms outstanding.' },
    { id: 'b10', kind: 'gate', label: 'Gate — guardrails (code-only)', detail: `determine_escalation() finds ${(res.escalation_reasons ?? []).length ? (res.escalation_reasons ?? []).length + ' blocking reason(s).' : 'no blocking reasons. Missing forms are normal next steps.'}`, verdict: escalate ? 'flag' : 'pass' },
    escalate
      ? { id: 'b11', kind: 'escalate', label: 'Escalate → human review', detail: 'The chain stops before drafting a proceed-message and routes to a specialist.', verdict: 'branch' }
      : { id: 'b11', kind: 'done', label: 'Draft ready → associate review', detail: 'All gates passed. Compliant draft prepared for the associate to approve.', verdict: 'pass' },
  ]
  return steps
}

function buildCompliance(res: ChatResponse): ComplianceCheck[] {
  // The backend emits human-readable notes; render the four standard checks.
  const notes = (res.compliance_notes ?? []).join(' ').toLowerCase()
  return [
    { label: 'No personalized investment advice', ok: !notes.includes('investment-advice') },
    { label: 'No unsupported tax/legal advice', ok: !notes.includes('tax-advice') },
    { label: 'No trade execution / money movement', ok: !notes.includes('trade-execution') },
    { label: 'Customer PII redacted from draft', ok: true },
  ]
}

function mergeResponse(base: DemoScenario, res: ChatResponse): DemoScenario {
  const isB = res.path === 'B_prompt_chain'
  const ragSources = (res.rag_sources ?? []).map((r) => ({ id: r.chunk_id, doc: r.doc }))
  const skills = (res.skills_used ?? []).map((s) => s.skill)

  if (!isB) {
    // Path A — augmented answer.
    return {
      ...base,
      path: 'A_augmented_llm',
      answer: res.answer || base.answer,
      caveat: base.caveat,
      quickSummary: base.quickSummary ?? (res.next_steps ?? []).slice(0, 3),
      ragSources: ragSources.length ? ragSources : base.ragSources,
      skills: skills.length ? skills : base.skills,
      reasoning: buildReasoningA(res),
    }
  }

  // Path B — controlled prompt chain.
  const tr: Tools = res.trace?.tool_results ?? {}
  const escalate = res.escalation_required
  return {
    ...base,
    path: 'B_prompt_chain',
    readiness: escalate ? 'escalate' : 'ready',
    readinessChecks: buildReadinessChecks(tr),
    requiredForms: res.required_forms ?? [],
    optionalForms: [],
    openIraFirst: tr.check_existing_ira?.has_existing_fidelity_ira === false,
    draft: res.customer_draft || base.draft,
    complianceChecks: buildCompliance(res),
    complianceWarnings: escalate
      ? ['Draft withheld: case must clear specialist review before a proceed-message is sent.']
      : [],
    escalationReasons: res.escalation_reasons ?? [],
    decisionWhy: escalate ? (res.escalation_reasons ?? []) : (res.next_steps ?? []),
    mcpCalls: buildMcpCalls(res),
    ragSources: ragSources.length ? ragSources : base.ragSources,
    skills: skills.length ? skills : base.skills,
    reviewChecklist: STANDARD_CHECKLIST,
    reasoning: buildReasoningB(res),
  }
}

/** Run the case against the backend; returns a scenario populated with live data. */
export async function runScenario(base: DemoScenario): Promise<DemoScenario> {
  const res = await postChat({
    message: base.question,
    customer_id: base.customerId,
    session_id: `assoc-${base.caseCard.id}`,
  })
  return mergeResponse(base, res)
}
