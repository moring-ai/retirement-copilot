// Turn a REAL backend /chat response (which performs real MCP tool calls) into a
// DemoScenario, so the case-run experience shows live tool results, readiness
// checks, reasoning, forms, draft, and escalation instead of scripted mock data.
//
// The shape is kept identical to the scripted scenarios (same array lengths and
// order) so the DemoContext beat machine reveals it unchanged — only the data
// becomes real.

import type { ChatResponse } from '@/lib/chatContract'
import type {
  DemoScenario,
  ReadinessCheck,
  ReadinessResult,
  ReasoningStep,
} from '@/data/demo-scenarios'

/* eslint-disable @typescript-eslint/no-explicit-any */
type Dict = Record<string, any>

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

export function buildLiveScenario(base: DemoScenario, response: ChatResponse): DemoScenario {
  // --- Path A — general education (RAG + skills, no MCP) ---
  if (base.path === 'A_augmented_llm') {
    return {
      ...base,
      answer: response.answer || base.answer,
      ragSources: response.rag_sources.length
        ? response.rag_sources.map((s) => ({ id: s.chunk_id, doc: s.doc }))
        : base.ragSources,
      skills: response.skills_used.length
        ? response.skills_used.map((s) => s.skill)
        : base.skills,
      reasoning: base.reasoning.map((step) =>
        step.kind === 'rag'
          ? { ...step, meta: response.rag_sources.map((s) => s.chunk_id).join(' · ') || step.meta }
          : step,
      ),
    }
  }

  // --- Path B — customer-specific (real MCP tool chain) ---
  const t: Dict = (response.trace?.tool_results as Dict) ?? {}
  const profile: Dict = t.get_customer_profile ?? {}
  const iraR: Dict = t.check_existing_ira ?? {}
  const accountsR: Dict = t.list_retirement_accounts ?? {}
  const planR: Dict = (t.get_source_plan_details ?? {}).source_plan ?? {}
  const restrR: Dict = t.check_account_restrictions ?? {}
  const docsR: Dict = (t.get_document_or_case_status ?? {}).documents ?? {}

  const name: string = profile.name ?? base.persona.split(' · ')[0]
  const found = profile.found !== false
  const hasIra = Boolean(iraR.has_existing_fidelity_ira)
  const nAccounts = Array.isArray(accountsR.retirement_accounts)
    ? accountsR.retirement_accounts.length
    : 0
  const allowed = planR.rollover_allowed // true | false | 'unknown'
  const loan = Boolean(planR.outstanding_plan_loan)
  const hasRestr = Boolean(restrR.has_restrictions)
  const restrictions: string[] = restrR.account_restrictions ?? []
  const idv: string = docsR.identity_verification ?? 'unknown'

  const escalation = response.escalation_required
  const reasons = response.escalation_reasons
  const allowedLabel = allowed === true ? 'Yes' : allowed === false ? 'No' : 'Unknown'

  const mcpCalls: DemoScenario['mcpCalls'] = [
    { tool: 'get_customer_profile', result: `${name} — ${found ? 'found' : 'not found'}` },
    { tool: 'check_existing_ira', result: hasIra ? 'Traditional IRA on file' : 'None on file' },
    { tool: 'list_retirement_accounts', result: `${nAccounts} account${nAccounts === 1 ? '' : 's'}` },
    {
      tool: 'get_source_plan_details',
      result: `rollover_allowed: ${allowedLabel.toLowerCase()} · ${loan ? 'outstanding loan' : 'no loan'}`,
      flagged: allowed !== true || loan,
    },
    {
      tool: 'check_account_restrictions',
      result: hasRestr ? restrictions.join(' · ') : 'none',
      flagged: hasRestr,
    },
    {
      tool: 'get_document_or_case_status',
      result: `identity verification: ${idv}`,
      flagged: idv !== 'complete',
    },
  ]

  const readinessChecks: ReadinessCheck[] = [
    { label: 'Customer found', value: found ? 'Yes' : 'No', ok: found },
    { label: 'Identity verification', value: cap(idv), ok: idv === 'complete' },
    { label: 'Existing Fidelity IRA', value: hasIra ? 'On file' : 'None on file', ok: hasIra ? true : 'warn' },
    { label: 'Source-plan rollover allowed', value: allowedLabel, ok: allowed === true ? true : 'warn' },
    { label: 'Outstanding plan loan', value: loan ? 'Yes' : 'No', ok: !loan },
    { label: 'Account restrictions', value: hasRestr ? restrictions.join(' · ') : 'None', ok: !hasRestr },
  ]

  const reasoning: ReasoningStep[] = [
    { id: 'p1', kind: 'route', label: 'Router · classify', detail: `Rollover intent + specific customer (${base.customerId}) → Path B (Controlled Prompt Chain).`, verdict: 'ok' },
    { id: 'p2', kind: 'gate', label: 'Gate — customer-specific?', detail: `Identifier ${base.customerId} present → proceed to the fixed MCP tool chain.`, verdict: 'pass' },
    { id: 'p3', kind: 'call', label: 'get_customer_profile()', detail: `${name} — ${found ? 'found' : 'not found'}.`, verdict: found ? 'ok' : 'flag', meta: 'MCP' },
    { id: 'p4', kind: 'gate', label: 'Gate — customer found?', detail: found ? 'Profile resolved → continue retrieving account facts.' : 'Profile not found → clarification.', verdict: found ? 'pass' : 'flag' },
    { id: 'p5', kind: 'call', label: 'check_existing_ira() · list_retirement_accounts()', detail: hasIra ? 'Traditional IRA already on file.' : 'No Fidelity IRA yet — one must be opened first.', verdict: 'ok', meta: 'MCP' },
    { id: 'p6', kind: 'call', label: 'get_source_plan_details()', detail: `rollover_allowed: ${allowedLabel.toLowerCase()} · ${loan ? 'outstanding plan loan' : 'no outstanding loan'}.`, verdict: allowed !== true || loan ? 'flag' : 'ok', meta: 'MCP' },
    { id: 'p7', kind: 'call', label: 'check_account_restrictions()', detail: hasRestr ? `${restrictions.join(' · ')}.` : 'No restrictions.', verdict: hasRestr ? 'flag' : 'ok', meta: 'MCP' },
    { id: 'p8', kind: 'call', label: 'get_document_or_case_status()', detail: `identity verification: ${idv}.`, verdict: idv !== 'complete' ? 'flag' : 'ok', meta: 'MCP' },
    { id: 'p9', kind: 'think', label: 'Validate customer / missing data', detail: escalation ? 'Blocking items found — see the guardrail gate below.' : 'Eligible, no loan, no restrictions, identity verified. Only standard forms outstanding.' },
    { id: 'p10', kind: 'gate', label: 'Gate — guardrails (code-only)', detail: escalation ? `determine_escalation() finds ${reasons.length} blocking reason${reasons.length === 1 ? '' : 's'}.` : 'determine_escalation() finds no blocking reasons. Missing forms are normal next steps.', verdict: escalation ? 'flag' : 'pass' },
    escalation
      ? { id: 'p11', kind: 'escalate', label: 'Escalate → human review', detail: 'The chain stops before drafting a proceed-message and routes to a specialist.', verdict: 'branch' }
      : { id: 'p11', kind: 'done', label: 'Draft ready → associate review', detail: 'All gates passed. Compliant draft prepared for the associate to approve.', verdict: 'pass' },
  ]

  return {
    ...base,
    mcpCalls,
    readinessChecks,
    reasoning,
    readiness: (escalation ? 'escalate' : 'ready') as ReadinessResult,
    escalationReasons: reasons.length ? reasons : base.escalationReasons,
    requiredForms: response.required_forms.length ? response.required_forms : base.requiredForms,
    draft: response.customer_draft || base.draft,
    complianceWarnings: escalation
      ? ['Draft withheld: case must clear specialist review before a proceed-message is sent.']
      : [],
    ragSources: response.rag_sources.length
      ? response.rag_sources.map((s) => ({ id: s.chunk_id, doc: s.doc }))
      : base.ragSources,
    skills: response.skills_used.length ? response.skills_used.map((s) => s.skill) : base.skills,
    openIraFirst: !hasIra,
    outcome: escalation ? 'escalate_hitl' : 'clean_submit',
  }
}
