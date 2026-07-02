import type { Action } from '@/state/workspace-reducer'
import type {
  ComplianceOutcome,
  ConfidenceLevel,
  Customer,
  EligibilityResult,
  Finding,
  RagSource,
  RolloverPath,
  RunningAction,
  StepStatus,
  TimelineEvent,
} from '@/types'
import { source } from '@/data/rag-sources'

// A "beat" is a set of reducer actions dispatched at a relative time offset.
// The simulated-agent-run hook schedules each beat's actions at `atMs`, so a
// sequence of beats plays out as a realistic, staggered agent trace.
export interface Beat {
  atMs: number
  actions: Action[]
}

function tLabel(atMs: number): string {
  return `+${(atMs / 1000).toFixed(1)}s`
}

let timelineSeq = 0
function ev(atMs: number, label: string, detail?: string): TimelineEvent {
  timelineSeq += 1
  return { id: `tl-${timelineSeq}`, timestamp: tLabel(atMs), label, detail }
}

const firstName = (c: Customer) => c.name.split(' ')[0]

// ---------------------------------------------------------------------------
// Per-archetype outcome (the heart of the demo's divergence)
// ---------------------------------------------------------------------------

interface Outcome {
  eligibility: EligibilityResult
  path: RolloverPath
  recommendedAction: string
  confidence: ConfidenceLevel
  riskTags: string[]
  eligibilityStatus: StepStatus
  requiredForms: string[]
  missingInfo: string[]
  formsStatus: StepStatus
  complianceOutcome: ComplianceOutcome
  complianceStatus: StepStatus
  complianceWarnings: string[]
  complianceSources: RagSource[]
  complianceTimeline: { label: string; detail?: string }
  draft: string
}

function getOutcome(c: Customer): Outcome {
  const provider = c.source_plan.plan_provider
  const baseWarnings = [
    'Do not provide tax-treatment guidance — defer tax questions to a qualified professional.',
    'No investment recommendations or money-movement instructions in the customer draft.',
  ]

  switch (c.caseType) {
    case 'clean_new_ira':
      return {
        eligibility: {
          eligible: true,
          headline: 'Eligible for a direct rollover',
          summary: `${c.name} has no existing Fidelity IRA, the source ${c.source_plan.plan_type} permits a rollover, and no account restrictions were found. A direct rollover can proceed once the destination IRA is opened.`,
        },
        path: {
          recommended: 'Direct rollover',
          detail:
            'Funds move straight from the former employer plan to a new Fidelity Traditional IRA — the customer never takes receipt of the funds.',
          avoids: ['Mandatory 20% withholding', '60-day redeposit requirement'],
        },
        recommendedAction:
          'Open a Fidelity Traditional IRA first, then initiate the direct rollover request from the source plan.',
        confidence: 'High',
        riskTags: ['Low risk — no restrictions'],
        eligibilityStatus: 'complete',
        requiredForms: [
          'Fidelity IRA Application (IRA must be opened first)',
          `Source-plan rollover/distribution paperwork (from ${provider})`,
          'Fidelity Rollover Request Form',
        ],
        missingInfo: [
          'Fidelity IRA application',
          'Fidelity rollover request form',
        ],
        formsStatus: 'needs_info',
        complianceOutcome: 'cleared',
        complianceStatus: 'complete',
        complianceWarnings: baseWarnings,
        complianceSources: [],
        complianceTimeline: {
          label: 'No compliance blockers — case cleared for draft response',
        },
        draft: `Hi ${firstName(c)},

Thank you for reaching out about rolling over your former employer's 401(k) into a Fidelity IRA. Here is a summary of how this would work and what we'll need to move forward.

Because you don't currently hold a Fidelity IRA, the first step is to open a Fidelity Traditional IRA. Once that account exists, we can process this as a direct rollover — the funds move straight from your former plan to your new Fidelity IRA without being paid to you first, which avoids withholding and the 60-day redeposit window.

To proceed, we'll need the following completed:
  • A Fidelity IRA application (to open your destination IRA)
  • A Fidelity rollover request form
  • The source-plan distribution/rollover paperwork from ${provider}

For questions about how this rollover may affect your taxes, we recommend speaking with a qualified tax professional, since the answer depends on your individual circumstances.

An associate will confirm each step with you before anything is initiated.

— Draft prepared with AI assistance; reviewed and finalized by your associate before sending.`,
      }

    case 'clean_existing_ira':
      return {
        eligibility: {
          eligible: true,
          headline: 'Eligible — destination IRA already on file',
          summary: `${c.name} already holds a Fidelity Traditional IRA, the source ${c.source_plan.plan_type} permits a rollover, and no account restrictions were found. The rollover can go directly into the existing IRA — no new account needs to be opened.`,
        },
        path: {
          recommended: 'Direct rollover into existing IRA',
          detail:
            "Funds move straight from the former employer plan into the customer's existing Fidelity Traditional IRA. No account-opening step is required.",
          avoids: [
            'Mandatory 20% withholding',
            '60-day redeposit requirement',
            'Opening a duplicate IRA',
          ],
        },
        recommendedAction:
          'Confirm the existing IRA is suitable, then submit the direct rollover request from the source plan into it.',
        confidence: 'High',
        riskTags: ['Low risk — no restrictions'],
        eligibilityStatus: 'complete',
        requiredForms: [
          `Source-plan rollover/distribution paperwork (from ${provider})`,
          'Fidelity Rollover Request Form',
        ],
        missingInfo: ['Fidelity rollover request form'],
        formsStatus: 'needs_info',
        complianceOutcome: 'cleared',
        complianceStatus: 'complete',
        complianceWarnings: baseWarnings,
        complianceSources: [],
        complianceTimeline: {
          label: 'No compliance blockers — case cleared for draft response',
        },
        draft: `Hi ${firstName(c)},

Thank you for reaching out about rolling over your former employer's 401(k) into your Fidelity IRA.

Because you already hold a Fidelity Traditional IRA, we can process this as a direct rollover straight into that existing account — there's no need to open a new one. The funds move directly between institutions, so you won't take receipt of them, which avoids withholding and the 60-day redeposit window.

To proceed, we'll need a Fidelity rollover request form, and we'll coordinate with your former plan provider, ${provider}, for the source-plan distribution paperwork.

For questions about how this rollover may affect your taxes, we recommend speaking with a qualified tax professional, since the answer depends on your individual circumstances.

An associate will confirm each step with you before anything is initiated.

— Draft prepared with AI assistance; reviewed and finalized by your associate before sending.`,
      }

    case 'indirect_caution':
      return {
        eligibility: {
          eligible: true,
          headline: 'Eligible — but time-sensitive (indirect rollover)',
          summary: `An indirect rollover is already in progress: the source plan issued the distribution to ${firstName(c)} directly. It can still be completed, but the funds must be redeposited into a Fidelity IRA within the 60-day window, and mandatory withholding applies. Treat as time-sensitive.`,
        },
        path: {
          recommended: 'Indirect rollover — 60-day redeposit',
          detail:
            'The customer received the distribution directly, so the full amount (including any tax withheld) must be redeposited into a Fidelity IRA within 60 days of the distribution date to keep it non-taxable.',
          avoids: [],
        },
        recommendedAction:
          'Confirm the distribution date, then complete the rollover request promptly to stay within the 60-day window. Refer tax questions to a professional.',
        confidence: 'Medium',
        riskTags: ['60-day redeposit deadline', '20% withholding applied'],
        eligibilityStatus: 'needs_info',
        requiredForms: [
          'Source-plan distribution statement (proof of distribution date)',
          'Fidelity Rollover Request Form',
        ],
        missingInfo: [
          'Distribution date confirmation',
          'Fidelity rollover request form',
        ],
        formsStatus: 'needs_info',
        complianceOutcome: 'caution',
        complianceStatus: 'needs_info',
        complianceWarnings: [
          ...baseWarnings,
          'Time-sensitive: confirm the 60-day redeposit window has not lapsed before proceeding.',
          'Describe the withholding as a factual operational point only — do not advise on the tax outcome.',
        ],
        complianceSources: [source('tax_boundaries')],
        complianceTimeline: {
          label: 'Compliance caution — time-sensitive 60-day window',
          detail: 'Indirect rollover; withholding applied',
        },
        draft: `Hi ${firstName(c)},

Thank you for following up on the rollover of your former employer's 401(k).

Because the plan already issued the distribution to you directly, this is an indirect rollover. To keep it non-taxable, the full amount — including any tax that was withheld — needs to be deposited into your Fidelity IRA within 60 days of the distribution date. Because of that time limit, we'd like to complete the rollover request promptly.

We'll confirm the distribution date with you and coordinate the deposit into your existing Fidelity Traditional IRA.

Please note we can't advise on the tax impact — for questions about the withholding or your specific tax situation, we recommend speaking with a qualified tax professional.

— Draft prepared with AI assistance; reviewed and finalized by your associate before sending.`,
      }

    case 'escalation':
      return {
        eligibility: {
          eligible: false,
          headline: 'Needs review before a rollover can proceed',
          summary:
            'Source-plan rollover eligibility is unconfirmed and account restrictions are present. This case cannot be treated as a standard rollover until the blocking items are resolved.',
        },
        path: {
          recommended: 'Hold — pending review',
          detail:
            'A direct rollover is preferred in principle, but eligibility, restrictions, and identity items must be confirmed before any path is initiated.',
          avoids: [],
        },
        recommendedAction:
          'Do not initiate the rollover. Escalate for review of the outstanding plan loan, restrictions, and identity verification.',
        confidence: 'Medium',
        riskTags: [
          'Outstanding plan loan',
          'Identity verification incomplete',
          'Beneficiary dispute',
        ],
        eligibilityStatus: 'needs_info',
        requiredForms: [
          'Fidelity IRA Application (if a suitable IRA is not confirmed)',
          `Source-plan rollover/distribution paperwork (from ${provider})`,
          'Fidelity Rollover Request Form',
        ],
        missingInfo: [
          'Identity verification',
          'Source-plan provider confirmation',
          'Fidelity rollover request form',
        ],
        formsStatus: 'needs_info',
        complianceOutcome: 'escalation',
        complianceStatus: 'needs_info',
        complianceWarnings: [
          ...baseWarnings,
          'Escalation required: beneficiary dispute and incomplete identity verification.',
        ],
        complianceSources: [source('tax_boundaries')],
        complianceTimeline: {
          label: 'Escalation flagged',
          detail: 'Beneficiary dispute + incomplete identity verification',
        },
        draft: `Hi ${firstName(c)},

Thank you for reaching out about rolling over your former employer's 401(k) into a Fidelity IRA. We want to make sure this is handled correctly, so a retirement servicing specialist will review a few items on your account before we begin.

Once that review is complete, we'll walk you through the required steps and paperwork together. In the meantime, no action is needed on your part.

For questions about how a rollover may affect your taxes, we recommend speaking with a qualified tax professional, since the answer depends on your individual circumstances.

— Draft prepared with AI assistance; reviewed and finalized by your associate before sending.`,
      }
  }
}

// ---------------------------------------------------------------------------
// Findings — data-driven, shown as the Case Findings table
// ---------------------------------------------------------------------------

function buildFindings(c: Customer): Finding[] {
  const findings: Finding[] = [
    {
      label: 'Existing Fidelity IRA',
      value: c.has_existing_fidelity_ira ? 'On file' : 'None on file',
      source: 'check_existing_ira',
      tone: c.has_existing_fidelity_ira ? 'positive' : 'neutral',
    },
    {
      label: 'Source-plan rollover allowed',
      value:
        c.source_plan.rollover_allowed === true
          ? 'Yes'
          : c.source_plan.rollover_allowed === false
            ? 'No'
            : 'Unknown',
      source: 'get_source_plan_details',
      tone: c.source_plan.rollover_allowed === true ? 'positive' : 'warning',
    },
    {
      label: 'Outstanding plan loan',
      value: c.source_plan.outstanding_plan_loan ? 'Yes' : 'No',
      source: 'get_source_plan_details',
      tone: c.source_plan.outstanding_plan_loan ? 'warning' : 'positive',
    },
    {
      label: 'Account restrictions',
      value:
        c.account_restrictions.length === 0
          ? 'None found'
          : c.account_restrictions.join(', '),
      source: 'check_account_restrictions',
      tone: c.account_restrictions.length === 0 ? 'positive' : 'warning',
    },
    {
      label: 'Identity verification',
      value:
        c.documents.identity_verification.charAt(0).toUpperCase() +
        c.documents.identity_verification.slice(1),
      source: 'get_document_or_case_status',
      tone:
        c.documents.identity_verification === 'complete'
          ? 'positive'
          : 'warning',
    },
  ]

  if (c.distribution_status === 'indirect_in_progress') {
    findings.push({
      label: 'Distribution status',
      value: 'Indirect rollover in progress',
      source: 'get_source_plan_details',
      tone: 'warning',
    })
  }

  return findings
}

// ---------------------------------------------------------------------------
// 1. Run Eligibility Check
// ---------------------------------------------------------------------------

function eligibilityScript(c: Customer): Beat[] {
  const o = getOutcome(c)
  return [
    {
      atMs: 0,
      actions: [
        { type: 'START_ACTION', action: 'eligibility' },
        { type: 'SET_STEP_STATUS', step: 'eligibility_check', status: 'in_progress' },
        {
          type: 'ADD_TIMELINE',
          event: ev(
            0,
            'Analyzed customer rollover goal',
            `${c.rollover_goal} — ${c.source_plan.plan_type} → ${c.destination_account}`,
          ),
        },
      ],
    },
    {
      atMs: 800,
      actions: [
        { type: 'ADD_TOOL_CALL', toolCall: { tool: 'get_customer_profile', status: 'ok' } },
        { type: 'ADD_TOOL_CALL', toolCall: { tool: 'list_retirement_accounts', status: 'ok' } },
        { type: 'ADD_TOOL_CALL', toolCall: { tool: 'check_existing_ira', status: 'ok' } },
        {
          type: 'ADD_TIMELINE',
          event: ev(800, 'Retrieved customer profile and existing accounts'),
        },
        { type: 'ADD_SOURCE', source: source('rollover_policy') },
      ],
    },
    {
      atMs: 1700,
      actions: [
        { type: 'ADD_TOOL_CALL', toolCall: { tool: 'get_source_plan_details', status: 'ok' } },
        { type: 'ADD_TOOL_CALL', toolCall: { tool: 'check_account_restrictions', status: 'ok' } },
        {
          type: 'ADD_TIMELINE',
          event: ev(1700, 'Checked direct rollover requirements against source plan'),
        },
        { type: 'ADD_SOURCE', source: source('distribution_guide') },
        { type: 'SET_FINDINGS', findings: buildFindings(c) },
      ],
    },
    {
      atMs: 2600,
      actions: [
        { type: 'SET_ELIGIBILITY', result: o.eligibility },
        { type: 'SET_ROLLOVER_PATH', path: o.path },
        { type: 'SET_RECOMMENDED_ACTION', text: o.recommendedAction },
        { type: 'SET_CONFIDENCE', level: o.confidence },
        ...o.riskTags.map((tag): Action => ({ type: 'ADD_RISK_TAG', tag })),
        {
          type: 'ADD_TIMELINE',
          event: ev(
            2600,
            o.eligibility.eligible
              ? 'Eligibility check complete — ' + o.path.recommended.toLowerCase()
              : 'Eligibility check complete — review required',
          ),
        },
        { type: 'SET_STEP_STATUS', step: 'eligibility_check', status: o.eligibilityStatus },
        { type: 'FINISH_ACTION' },
      ],
    },
  ]
}

// ---------------------------------------------------------------------------
// 2. Find Required Forms
// ---------------------------------------------------------------------------

function formsScript(c: Customer): Beat[] {
  const o = getOutcome(c)
  return [
    {
      atMs: 0,
      actions: [
        { type: 'START_ACTION', action: 'forms' },
        { type: 'SET_STEP_STATUS', step: 'required_forms', status: 'in_progress' },
        {
          type: 'ADD_TIMELINE',
          event: ev(0, 'Identified required forms for the rollover'),
        },
      ],
    },
    {
      atMs: 900,
      actions: [
        { type: 'ADD_TOOL_CALL', toolCall: { tool: 'get_document_or_case_status', status: 'ok' } },
        { type: 'ADD_SOURCE', source: source('forms_catalog') },
        { type: 'SET_REQUIRED_FORMS', forms: o.requiredForms },
      ],
    },
    {
      atMs: 1800,
      actions: [
        { type: 'SET_MISSING_INFO', items: o.missingInfo },
        {
          type: 'ADD_TIMELINE',
          event: ev(
            1800,
            o.missingInfo.length
              ? `Flagged ${o.missingInfo.length} missing item(s)`
              : 'All required documents already on file',
            o.missingInfo.length ? o.missingInfo.join(', ') : undefined,
          ),
        },
        { type: 'SET_STEP_STATUS', step: 'required_forms', status: o.formsStatus },
        { type: 'FINISH_ACTION' },
      ],
    },
  ]
}

// ---------------------------------------------------------------------------
// 3. Check Compliance
// ---------------------------------------------------------------------------

function complianceScript(c: Customer): Beat[] {
  const o = getOutcome(c)
  return [
    {
      atMs: 0,
      actions: [
        { type: 'START_ACTION', action: 'compliance' },
        { type: 'SET_STEP_STATUS', step: 'compliance_review', status: 'in_progress' },
        {
          type: 'ADD_TIMELINE',
          event: ev(0, 'Reviewing case against compliance and escalation policy'),
        },
      ],
    },
    {
      atMs: 1000,
      actions: [
        { type: 'ADD_SOURCE', source: source('compliance_language') },
        { type: 'ADD_SOURCE', source: source('escalation_policy') },
        ...o.complianceSources.map((s): Action => ({ type: 'ADD_SOURCE', source: s })),
        {
          type: 'ADD_TOOL_CALL',
          toolCall: {
            tool: 'create_or_update_service_case',
            status: 'ok',
            detail: 'dry-run — no case created',
          },
        },
        ...o.complianceWarnings.map(
          (warning): Action => ({ type: 'ADD_COMPLIANCE_WARNING', warning }),
        ),
      ],
    },
    {
      atMs: 2100,
      actions: [
        { type: 'SET_COMPLIANCE_OUTCOME', outcome: o.complianceOutcome },
        ...(o.complianceOutcome === 'escalation'
          ? [{ type: 'ADD_RISK_TAG', tag: 'Escalation recommended' } as Action]
          : []),
        {
          type: 'ADD_TIMELINE',
          event: ev(2100, o.complianceTimeline.label, o.complianceTimeline.detail),
        },
        { type: 'SET_STEP_STATUS', step: 'compliance_review', status: o.complianceStatus },
        { type: 'FINISH_ACTION' },
      ],
    },
  ]
}

// ---------------------------------------------------------------------------
// 4. Generate Draft Response
// ---------------------------------------------------------------------------

function draftScript(c: Customer): Beat[] {
  const o = getOutcome(c)
  return [
    {
      atMs: 0,
      actions: [
        { type: 'START_ACTION', action: 'draft' },
        { type: 'SET_STEP_STATUS', step: 'draft_response', status: 'in_progress' },
        {
          type: 'ADD_TIMELINE',
          event: ev(0, 'Drafting associate-facing customer response'),
        },
      ],
    },
    {
      atMs: 1200,
      actions: [
        { type: 'ADD_SOURCE', source: source('compliance_language') },
        {
          type: 'ADD_TIMELINE',
          event: ev(1200, 'Applied approved customer-language guidelines'),
        },
      ],
    },
    {
      atMs: 2400,
      actions: [
        { type: 'SET_DRAFT_TEXT', text: o.draft },
        { type: 'ADD_TIMELINE', event: ev(2400, 'Draft ready for associate review') },
        { type: 'SET_STEP_STATUS', step: 'draft_response', status: 'complete' },
        { type: 'FINISH_ACTION' },
      ],
    },
  ]
}

export function buildScript(
  action: Exclude<RunningAction, null>,
  customer: Customer,
): Beat[] {
  switch (action) {
    case 'eligibility':
      return eligibilityScript(customer)
    case 'forms':
      return formsScript(customer)
    case 'compliance':
      return complianceScript(customer)
    case 'draft':
      return draftScript(customer)
  }
}

export const ACTION_DURATION: Record<Exclude<RunningAction, null>, number> = {
  eligibility: 2600,
  forms: 1800,
  compliance: 2100,
  draft: 2400,
}
