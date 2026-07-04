// Demo scenarios behind the associate's case queue.
//
// Two clearly different agent paths drive two different run experiences:
//   Path A — Augmented LLM        → a simple streaming answer workspace
//   Path B — Controlled Prompt Chain → a guided 5-step servicing workflow
//
// Each scenario also carries a scripted "reasoning stream" for the evidence
// panel. Path B streams are GATED (checkpoints that pass / branch / flag); Path A
// is a single augmented pass with NO gates — that contrast is the teaching point.

import type { CasePriority } from '@/types'

export type RouterPath = 'A_augmented_llm' | 'B_prompt_chain'

export type StepKind =
  | 'route'
  | 'gate'
  | 'call'
  | 'rag'
  | 'skill'
  | 'think'
  | 'escalate'
  | 'done'

export type Verdict = 'pass' | 'branch' | 'flag' | 'ok'

export interface ReasoningStep {
  id: string
  kind: StepKind
  label: string
  detail?: string
  verdict?: Verdict
  meta?: string
}

/** How this scenario presents as an ordinary, *unworked* request in the queue. */
export interface CaseCard {
  id: string
  customerName: string
  customerId: string
  goalLabel: string
  priority: CasePriority
  ageMinutes: number
}

export type Outcome = 'auto_draft' | 'escalate_hitl' | 'clean_submit'

// --- Path B step content ----------------------------------------------------
export interface ReadinessCheck {
  label: string
  value: string
  ok: boolean | 'warn'
}
export type ReadinessResult = 'ready' | 'review' | 'escalate'

export interface ComplianceCheck {
  label: string
  ok: boolean
}

export interface ChecklistItem {
  id: string
  label: string
  /** Auto-satisfied items tick themselves as the agent completes work; manual
   *  items require the associate to confirm. */
  auto?: boolean
}

export interface DemoScenario {
  id: string
  caseCard: CaseCard
  path: RouterPath
  patternLabel: string
  patternTag: string
  title: string
  persona: string
  customerId?: string
  question: string
  outcome: Outcome
  ragSources: { id: string; doc: string }[]
  mcpCalls?: { tool: string; result: string; flagged?: boolean }[]
  skills: string[]
  reasoning: ReasoningStep[]

  // Path A ------------------------------------------------------------------
  answer?: string
  caveat?: string
  quickSummary?: string[]

  // Path B ------------------------------------------------------------------
  readiness?: ReadinessResult
  decisionWhy?: string[]
  nextAction?: string
  readinessChecks?: ReadinessCheck[]
  requiredForms?: string[]
  optionalForms?: string[]
  openIraFirst?: boolean
  draft?: string
  complianceChecks?: ComplianceCheck[]
  complianceWarnings?: string[]
  escalationReasons?: string[]
  reviewChecklist?: ChecklistItem[]
}

// ---------------------------------------------------------------------------

const PATH_A_ANSWER = `A 401(k)-to-IRA rollover moves retirement savings from a former employer's plan into an IRA. There are two ways to do it:

• Direct rollover — the funds move straight from the plan to the IRA without being paid to the customer. This is the standard operational path: it avoids mandatory 20% withholding and the 60-day re-deposit requirement.

• Indirect rollover — the plan pays the funds to the customer, who then has 60 days to deposit them into the IRA. It carries more timing and tax risk and is routed for closer review.

Standard paperwork for a direct rollover is typically: a Fidelity IRA application (if a suitable IRA isn't already open), the source plan's rollover/distribution forms, and a Fidelity rollover request form. Identity verification must be complete before servicing proceeds.`

const PATH_A_CAVEAT =
  'This is general guidance drawn from approved policy — not customer-specific advice. For a particular customer, open their case so the copilot can check eligibility, restrictions, and required forms against their account.'

const PATRICIA_DRAFT =
  'Hello Patricia, thank you for reaching out about a rollover into a Fidelity IRA. ' +
  'Before we can proceed, a few items on your account need review by a specialist. ' +
  'We’ll follow up shortly with the next steps — no action is needed from you right now.'

const ROBERT_DRAFT =
  'Hello Robert, thank you for reaching out about rolling over your former employer’s ' +
  '401(k) into a Fidelity IRA. Based on our records, the next step would be to open a ' +
  'Fidelity IRA, since one is not currently on file. A direct rollover moves the funds ' +
  'without them being paid to you first. To proceed, we’ll need to complete the IRA ' +
  'application and the rollover request form. For questions about how this affects your ' +
  'taxes, we recommend speaking with a qualified tax professional.'

const STANDARD_CHECKLIST: ChecklistItem[] = [
  { id: 'context', label: 'Customer context reviewed', auto: true },
  { id: 'readiness', label: 'Rollover readiness reviewed', auto: true },
  { id: 'forms', label: 'Required forms verified' },
  { id: 'response', label: 'Customer response reviewed' },
  { id: 'compliance', label: 'Compliance warnings resolved or escalated', auto: true },
]

export const DEMO_SCENARIOS: DemoScenario[] = [
  // 1 ─ Path A · Augmented LLM · general question ---------------------------
  {
    id: 'a-general',
    caseCard: {
      id: 'RC-4471',
      customerName: 'Marcus Bell',
      customerId: 'CUST-3310',
      goalLabel: 'General question about rolling over a 401(k)',
      priority: 'low',
      ageMinutes: 42,
    },
    path: 'A_augmented_llm',
    patternLabel: 'Augmented LLM',
    patternTag: 'RAG + Agent Skills · no customer data · general guidance',
    title: 'Rollover options — general question',
    persona: 'Marcus Bell · CUST-3310',
    question:
      'What’s the difference between a direct and indirect 401(k)-to-IRA rollover, and what forms are generally needed?',
    outcome: 'auto_draft',
    ragSources: [
      { id: 'ROLLOVER-SOP-01', doc: 'rollover_sop.md' },
      { id: 'FORMS-01', doc: 'required_forms_guidance.md' },
      { id: 'IRA-OPEN-02', doc: 'ira_opening_guidance.md' },
    ],
    skills: ['clarification_detector', 'rollover_response_style', 'customer_language_policy'],
    answer: PATH_A_ANSWER,
    caveat: PATH_A_CAVEAT,
    quickSummary: [
      'Direct rollover — funds move plan → IRA; the standard path (no withholding, no 60-day clock).',
      'Indirect rollover — paid to the customer first; 60-day re-deposit window and more tax risk.',
      'Typical forms — Fidelity IRA application (if none on file), the plan’s distribution paperwork, and a Fidelity rollover request form.',
    ],
    reasoning: [
      { id: 'a1', kind: 'route', label: 'Router · classify', detail: 'General/educational question — not tied to a specific account → Path A (Augmented LLM). No customer lookup needed.', verdict: 'ok' },
      { id: 'a2', kind: 'rag', label: 'Retrieve approved guidance', detail: 'pgvector top-k over the approved corpus.', meta: 'ROLLOVER-SOP-01 · FORMS-01 · IRA-OPEN-02' },
      { id: 'a3', kind: 'skill', label: 'clarification_detector', detail: 'Question has enough detail to answer — no clarification needed.', verdict: 'ok' },
      { id: 'a4', kind: 'skill', label: 'rollover_response_style', detail: 'Compose a clear, plainly-worded, cited explanation of direct vs. indirect.' },
      { id: 'a5', kind: 'skill', label: 'customer_language_policy', detail: 'Enforce approved, customer-safe tone — no advice, no guarantees.', verdict: 'ok' },
      { id: 'a6', kind: 'done', label: 'General answer ready', detail: 'One grounded pass over RAG + Agent Skills. No MCP, no gates, no human step.', verdict: 'pass' },
    ],
  },

  // 2 ─ Path B · Controlled Prompt Chain · Patricia · escalate --------------
  {
    id: 'b-patricia',
    caseCard: {
      id: 'RC-4460',
      customerName: 'Patricia Donovan',
      customerId: 'CUST-2002',
      goalLabel: 'Roll over a 401(k) into a Fidelity IRA',
      priority: 'high',
      ageMinutes: 12,
    },
    path: 'B_prompt_chain',
    patternLabel: 'Controlled Prompt Chain',
    patternTag: 'RAG + MCP customer data · gated checkpoints · human review',
    title: 'Patricia Donovan — rollover servicing',
    persona: 'Patricia Donovan · CUST-2002',
    customerId: 'CUST-2002',
    question:
      'Customer Patricia Donovan (CUST-2002) wants to roll over a 401(k) into a Fidelity IRA. Check eligibility, restrictions, and forms, and draft a response.',
    outcome: 'escalate_hitl',
    ragSources: [
      { id: 'ROLLOVER-SOP-01', doc: 'rollover_sop.md' },
      { id: 'ESCALATION-01', doc: 'escalation_policy.md' },
    ],
    mcpCalls: [
      { tool: 'get_customer_profile', result: 'Patricia Donovan — found' },
      { tool: 'check_existing_ira', result: 'Traditional IRA on file' },
      { tool: 'list_retirement_accounts', result: '1 account' },
      { tool: 'get_source_plan_details', result: 'rollover_allowed: unknown · outstanding loan', flagged: true },
      { tool: 'check_account_restrictions', result: 'beneficiary dispute · address mismatch', flagged: true },
      { tool: 'get_document_or_case_status', result: 'identity verification: incomplete', flagged: true },
    ],
    skills: ['pii_redaction', 'advice_boundary_check', 'escalation_detection'],
    readiness: 'escalate',
    readinessChecks: [
      { label: 'Customer found', value: 'Yes', ok: true },
      { label: 'Identity verification', value: 'Incomplete', ok: false },
      { label: 'Existing Fidelity IRA', value: 'On file', ok: true },
      { label: 'Source-plan rollover allowed', value: 'Unknown', ok: 'warn' },
      { label: 'Outstanding plan loan', value: 'Yes', ok: false },
      { label: 'Account restrictions', value: 'Beneficiary dispute · address mismatch', ok: false },
    ],
    requiredForms: ['Fidelity rollover request form'],
    optionalForms: [],
    openIraFirst: false,
    draft: PATRICIA_DRAFT,
    complianceChecks: [
      { label: 'No personalized investment advice', ok: true },
      { label: 'No unsupported tax/legal advice', ok: true },
      { label: 'No trade execution / money movement', ok: true },
      { label: 'Customer PII redacted from draft', ok: true },
    ],
    complianceWarnings: [
      'Draft withheld: case must clear specialist review before a proceed-message is sent.',
    ],
    escalationReasons: [
      'Account restriction: beneficiary dispute',
      'Account restriction: address mismatch',
      'Outstanding loan against the source 401(k) plan',
      'Rollover eligibility is ‘unknown’ (not confirmed allowed)',
      'Identity verification is ‘incomplete’',
    ],
    reviewChecklist: STANDARD_CHECKLIST,
    reasoning: [
      { id: 'p1', kind: 'route', label: 'Router · classify', detail: 'Rollover intent + specific customer (CUST-2002) → Path B (Controlled Prompt Chain).', verdict: 'ok' },
      { id: 'p2', kind: 'gate', label: 'Gate — customer-specific?', detail: 'Identifier CUST-2002 present → proceed to the fixed MCP tool chain.', verdict: 'pass' },
      { id: 'p3', kind: 'call', label: 'get_customer_profile()', detail: 'Patricia Donovan — found.', verdict: 'ok', meta: 'MCP' },
      { id: 'p4', kind: 'gate', label: 'Gate — customer found?', detail: 'Profile resolved → continue retrieving account facts.', verdict: 'pass' },
      { id: 'p5', kind: 'call', label: 'check_existing_ira() · list_retirement_accounts()', detail: 'Traditional IRA already on file.', verdict: 'ok', meta: 'MCP' },
      { id: 'p6', kind: 'call', label: 'get_source_plan_details()', detail: 'rollover_allowed: unknown · outstanding plan loan.', verdict: 'flag', meta: 'MCP' },
      { id: 'p7', kind: 'call', label: 'check_account_restrictions()', detail: 'beneficiary dispute · address mismatch.', verdict: 'flag', meta: 'MCP' },
      { id: 'p8', kind: 'call', label: 'get_document_or_case_status()', detail: 'identity verification: incomplete.', verdict: 'flag', meta: 'MCP' },
      { id: 'p9', kind: 'think', label: 'Validate customer / missing data', detail: 'Eligibility unknown, an active loan, two restrictions, and identity not verified.' },
      { id: 'p10', kind: 'gate', label: 'Gate — guardrails (code-only)', detail: 'determine_escalation() finds 5 blocking reasons.', verdict: 'flag' },
      { id: 'p11', kind: 'escalate', label: 'Escalate → human review', detail: 'The chain stops before drafting a proceed-message and routes to a specialist.', verdict: 'branch' },
    ],
  },

  // 3 ─ Path B · Controlled Prompt Chain · Robert · clean -------------------
  {
    id: 'b-robert',
    caseCard: {
      id: 'RC-4468',
      customerName: 'Robert Miller',
      customerId: 'CUST-1001',
      goalLabel: 'Roll over an old 401(k) into a Fidelity IRA',
      priority: 'medium',
      ageMinutes: 27,
    },
    path: 'B_prompt_chain',
    patternLabel: 'Controlled Prompt Chain',
    patternTag: 'RAG + MCP customer data · gated checkpoints · clean pass',
    title: 'Robert Miller — rollover servicing',
    persona: 'Robert Miller · CUST-1001',
    customerId: 'CUST-1001',
    question:
      'Customer Robert Miller (CUST-1001) wants to roll over an old 401(k) into a Fidelity IRA. Check eligibility, restrictions, and forms, and draft a response.',
    outcome: 'clean_submit',
    ragSources: [
      { id: 'IRA-OPEN-02', doc: 'ira_opening_guidance.md' },
      { id: 'ROLLOVER-SOP-01', doc: 'rollover_sop.md' },
      { id: 'FORMS-03', doc: 'required_forms_guidance.md' },
    ],
    mcpCalls: [
      { tool: 'get_customer_profile', result: 'Robert Miller — found' },
      { tool: 'check_existing_ira', result: 'None on file' },
      { tool: 'list_retirement_accounts', result: '1 brokerage account' },
      { tool: 'get_source_plan_details', result: 'rollover_allowed: yes · no loan' },
      { tool: 'check_account_restrictions', result: 'none' },
      { tool: 'get_document_or_case_status', result: 'identity verification: complete' },
    ],
    skills: ['pii_redaction', 'advice_boundary_check', 'escalation_detection'],
    readiness: 'ready',
    decisionWhy: [
      'Source plan confirms the rollover is allowed.',
      'No account restrictions or beneficiary disputes.',
      'No outstanding loan against the source 401(k).',
      'Identity verification is complete.',
      'Only standard forms remain — a normal next step, not an escalation.',
    ],
    readinessChecks: [
      { label: 'Customer found', value: 'Yes', ok: true },
      { label: 'Identity verification', value: 'Complete', ok: true },
      { label: 'Existing Fidelity IRA', value: 'None on file', ok: 'warn' },
      { label: 'Source-plan rollover allowed', value: 'Yes', ok: true },
      { label: 'Outstanding plan loan', value: 'No', ok: true },
      { label: 'Account restrictions', value: 'None', ok: true },
    ],
    requiredForms: [
      'Fidelity IRA application (open the destination IRA first)',
      'Source-plan rollover/distribution paperwork',
      'Fidelity rollover request form',
    ],
    optionalForms: [],
    openIraFirst: true,
    draft: ROBERT_DRAFT,
    complianceChecks: [
      { label: 'No personalized investment advice', ok: true },
      { label: 'No unsupported tax/legal advice', ok: true },
      { label: 'No trade execution / money movement', ok: true },
      { label: 'Customer PII redacted from draft', ok: true },
    ],
    complianceWarnings: [],
    reviewChecklist: STANDARD_CHECKLIST,
    reasoning: [
      { id: 'r1', kind: 'route', label: 'Router · classify', detail: 'Rollover intent + specific customer (CUST-1001) → Path B (Controlled Prompt Chain).', verdict: 'ok' },
      { id: 'r2', kind: 'gate', label: 'Gate — customer-specific?', detail: 'Identifier CUST-1001 present → proceed to the fixed MCP tool chain.', verdict: 'pass' },
      { id: 'r3', kind: 'call', label: 'get_customer_profile()', detail: 'Robert Miller — found.', verdict: 'ok', meta: 'MCP' },
      { id: 'r4', kind: 'gate', label: 'Gate — customer found?', detail: 'Profile resolved → continue retrieving account facts.', verdict: 'pass' },
      { id: 'r5', kind: 'call', label: 'check_existing_ira() · list_retirement_accounts()', detail: 'No Fidelity IRA yet — one must be opened first.', verdict: 'ok', meta: 'MCP' },
      { id: 'r6', kind: 'call', label: 'get_source_plan_details()', detail: 'rollover_allowed: yes · no outstanding loan.', verdict: 'ok', meta: 'MCP' },
      { id: 'r7', kind: 'call', label: 'check_account_restrictions()', detail: 'No restrictions.', verdict: 'ok', meta: 'MCP' },
      { id: 'r8', kind: 'call', label: 'get_document_or_case_status()', detail: 'identity verification: complete.', verdict: 'ok', meta: 'MCP' },
      { id: 'r9', kind: 'think', label: 'Validate customer / missing data', detail: 'Eligible, no loan, no restrictions, identity verified. Only standard forms outstanding.' },
      { id: 'r10', kind: 'gate', label: 'Gate — guardrails (code-only)', detail: 'determine_escalation() finds no blocking reasons. Missing forms are normal next steps.', verdict: 'pass' },
      { id: 'r11', kind: 'done', label: 'Draft ready → associate review', detail: 'All gates passed. Compliant draft prepared for the associate to approve.', verdict: 'pass' },
    ],
  },
]

export function getScenario(id: string): DemoScenario | undefined {
  return DEMO_SCENARIOS.find((s) => s.id === id)
}

export function getScenarioByCaseId(caseId: string): DemoScenario | undefined {
  return DEMO_SCENARIOS.find((s) => s.caseCard.id === caseId)
}
