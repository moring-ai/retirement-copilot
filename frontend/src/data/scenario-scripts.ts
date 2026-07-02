import type { Action } from '@/state/workspace-reducer'
import type {
  ComplianceIssue,
  Customer,
  RunningAction,
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

const isClean = (c: Customer) =>
  c.source_plan.rollover_allowed === true &&
  c.account_restrictions.length === 0 &&
  !c.source_plan.outstanding_plan_loan &&
  c.documents.identity_verification === 'complete'

// ---------------------------------------------------------------------------
// 1. Run Eligibility Check
// ---------------------------------------------------------------------------

function eligibilityScript(c: Customer): Beat[] {
  const clean = isClean(c)

  const findings: Action = {
    type: 'SET_FINDINGS',
    findings: [
      {
        label: 'Existing Fidelity IRA',
        value: c.has_existing_fidelity_ira ? 'On file' : 'None on file',
        source: 'check_existing_ira',
        tone: c.has_existing_fidelity_ira ? 'neutral' : 'warning',
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
    ],
  }

  return [
    {
      atMs: 0,
      actions: [
        { type: 'START_ACTION', action: 'eligibility' },
        { type: 'SET_STEP_STATUS', step: 'goal_eligibility', status: 'in_progress' },
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
          event: ev(
            1700,
            'Checked direct rollover requirements against source plan',
          ),
        },
        { type: 'ADD_SOURCE', source: source('distribution_guide') },
        findings,
      ],
    },
    {
      atMs: 2600,
      actions: clean
        ? [
            {
              type: 'SET_ELIGIBILITY',
              result: {
                eligible: true,
                headline: 'Eligible for a direct rollover',
                summary: `${c.name} has no existing Fidelity IRA, the source ${c.source_plan.plan_type} permits a rollover, and no account restrictions were found. A direct 401(k)-to-IRA rollover can proceed once the destination IRA is opened.`,
              },
            },
            {
              type: 'SET_ROLLOVER_PATH',
              path: {
                recommended: 'Direct rollover',
                detail:
                  'Funds move straight from the former employer plan to a new Fidelity Traditional IRA — the customer never takes receipt of the funds.',
                avoids: [
                  'Mandatory 20% withholding',
                  '60-day redeposit requirement',
                ],
              },
            },
            {
              type: 'SET_RECOMMENDED_ACTION',
              text: 'Open a Fidelity Traditional IRA first, then initiate the direct rollover request from the source plan.',
            },
            { type: 'SET_CONFIDENCE', level: 'High' },
            { type: 'ADD_RISK_TAG', tag: 'Low risk — no restrictions' },
            {
              type: 'ADD_TIMELINE',
              event: ev(
                2600,
                'Eligibility check complete — direct rollover recommended',
              ),
            },
            { type: 'SET_STEP_STATUS', step: 'goal_eligibility', status: 'complete' },
            { type: 'FINISH_ACTION' },
          ]
        : [
            {
              type: 'SET_ELIGIBILITY',
              result: {
                eligible: false,
                headline: 'Needs review before a rollover can proceed',
                summary: `Source-plan rollover eligibility is unconfirmed and account restrictions are present. This case cannot be treated as a standard rollover until the blocking items are resolved.`,
              },
            },
            {
              type: 'SET_ROLLOVER_PATH',
              path: {
                recommended: 'Hold — pending review',
                detail:
                  'A direct rollover is preferred in principle, but eligibility and identity items must be confirmed before any path is initiated.',
                avoids: [],
              },
            },
            {
              type: 'SET_RECOMMENDED_ACTION',
              text: 'Do not initiate the rollover. Escalate for review of the outstanding plan loan, restrictions, and identity verification.',
            },
            { type: 'SET_CONFIDENCE', level: 'Medium' },
            { type: 'ADD_RISK_TAG', tag: 'Outstanding plan loan' },
            { type: 'ADD_RISK_TAG', tag: 'Identity verification incomplete' },
            {
              type: 'ADD_TIMELINE',
              event: ev(
                2600,
                'Eligibility check complete — review required',
                'Rollover eligibility unknown; restrictions present',
              ),
            },
            { type: 'SET_STEP_STATUS', step: 'goal_eligibility', status: 'needs_info' },
            { type: 'FINISH_ACTION' },
          ],
    },
  ]
}

// ---------------------------------------------------------------------------
// 2. Find Required Forms
// ---------------------------------------------------------------------------

function formsScript(c: Customer): Beat[] {
  const missing: string[] = []
  if (c.documents.ira_application === 'missing')
    missing.push('Fidelity IRA application')
  if (c.documents.rollover_request_form === 'missing')
    missing.push('Fidelity rollover request form')
  if (c.documents.identity_verification !== 'complete')
    missing.push('Identity verification')

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
        {
          type: 'SET_REQUIRED_FORMS',
          forms: [
            'Fidelity IRA Application (IRA must be opened first)',
            'Source-plan rollover/distribution paperwork (from ' +
              c.source_plan.plan_provider +
              ')',
            'Fidelity Rollover Request Form',
          ],
        },
      ],
    },
    {
      atMs: 1800,
      actions: [
        { type: 'SET_MISSING_INFO', items: missing },
        {
          type: 'ADD_TIMELINE',
          event: ev(
            1800,
            missing.length
              ? `Flagged ${missing.length} missing item(s)`
              : 'All required documents already on file',
            missing.length ? missing.join(', ') : undefined,
          ),
        },
        {
          type: 'SET_STEP_STATUS',
          step: 'required_forms',
          status: missing.length ? 'needs_info' : 'complete',
        },
        { type: 'FINISH_ACTION' },
      ],
    },
  ]
}

// ---------------------------------------------------------------------------
// 3. Check Compliance
// ---------------------------------------------------------------------------

function buildComplianceIssues(c: Customer): ComplianceIssue[] {
  const issues: ComplianceIssue[] = []

  if (c.account_restrictions.some((r) => r.toLowerCase().includes('beneficiary'))) {
    issues.push({
      id: 'beneficiary-dispute',
      title: 'Unresolved beneficiary dispute on the account',
      detail:
        'An open beneficiary dispute is recorded against the customer account. Processing a rollover while ownership of the beneficiary designation is contested exposes Fidelity to downstream liability.',
      severity: 'critical',
      recommendation: 'escalate_supervisor',
      recommendationDetail:
        'Escalate to your supervisor and place the case on hold until the beneficiary dispute is formally resolved by the specialist team.',
    })
  }

  if (c.documents.identity_verification !== 'complete') {
    issues.push({
      id: 'identity-incomplete',
      title: 'Identity verification is incomplete',
      detail:
        'KYC identity verification has not been completed. No servicing action can proceed on the account until identity is fully verified per policy.',
      severity: 'critical',
      recommendation: 'reject_case',
      recommendationDetail:
        'Do not proceed. Return the case to intake to complete identity verification before any rollover work resumes.',
    })
  }

  if (c.source_plan.outstanding_plan_loan) {
    issues.push({
      id: 'plan-loan',
      title: 'Outstanding loan against the source 401(k)',
      detail:
        'The former-employer plan carries an outstanding participant loan. A rollover may trigger a deemed distribution of the loan balance with tax consequences.',
      severity: 'warning',
      recommendation: 'reassign_specialist',
      recommendationDetail:
        'Reassign to a rollover specialist to confirm loan-offset handling before initiating any transfer.',
    })
  }

  if (c.source_plan.rollover_allowed !== true) {
    issues.push({
      id: 'eligibility-unknown',
      title: 'Rollover eligibility is unconfirmed',
      detail:
        'The source plan has not confirmed that a rollover is permitted. Proceeding without confirmation risks an out-of-policy transfer.',
      severity: 'warning',
      recommendation: 'reassign_specialist',
      recommendationDetail:
        'Have a specialist confirm eligibility directly with the plan provider before drafting a customer response.',
    })
  }

  if (c.account_restrictions.some((r) => r.toLowerCase().includes('address'))) {
    issues.push({
      id: 'address-mismatch',
      title: 'Address mismatch flagged on file',
      detail:
        'The address on the account does not match recent records. This is a fraud-prevention signal that must be cleared before servicing.',
      severity: 'warning',
      recommendation: 'reassign_specialist',
      recommendationDetail:
        'Route to the fraud-prevention queue to reconcile the address before proceeding.',
    })
  }

  if (issues.length === 0) {
    issues.push({
      id: 'no-blockers',
      title: 'No compliance blockers detected',
      detail:
        'Identity is verified, no account restrictions are present, and the source plan permits the rollover. The case may proceed to a drafted customer response.',
      severity: 'info',
      recommendation: 'proceed',
      recommendationDetail:
        'Proceed to draft the customer response. Standard human review still applies before anything is sent.',
    })
  }

  return issues
}

function complianceScript(c: Customer): Beat[] {
  const clean = isClean(c)
  const issues = buildComplianceIssues(c)

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
        {
          type: 'ADD_TOOL_CALL',
          toolCall: {
            tool: 'create_or_update_service_case',
            status: 'ok',
            detail: 'dry-run — no case created',
          },
        },
        {
          type: 'ADD_COMPLIANCE_WARNING',
          warning:
            'Do not provide tax-treatment guidance — defer tax questions to a qualified professional.',
        },
        {
          type: 'ADD_COMPLIANCE_WARNING',
          warning: 'No investment recommendations or money-movement instructions in the customer draft.',
        },
      ],
    },
    {
      atMs: 2100,
      actions: clean
        ? [
            { type: 'SET_COMPLIANCE_ISSUES', issues },
            {
              type: 'ADD_TIMELINE',
              event: ev(
                2100,
                'No compliance blockers — case cleared for draft response',
              ),
            },
            { type: 'SET_STEP_STATUS', step: 'compliance_review', status: 'complete' },
            { type: 'FINISH_ACTION' },
          ]
        : [
            { type: 'SET_COMPLIANCE_ISSUES', issues },
            { type: 'ADD_SOURCE', source: source('tax_boundaries') },
            {
              type: 'ADD_COMPLIANCE_WARNING',
              warning:
                'Escalation required: beneficiary dispute and incomplete identity verification.',
            },
            { type: 'ADD_RISK_TAG', tag: 'Escalation recommended' },
            {
              type: 'ADD_TIMELINE',
              event: ev(
                2100,
                'Escalation flagged',
                'Beneficiary dispute + incomplete identity verification',
              ),
            },
            { type: 'SET_STEP_STATUS', step: 'compliance_review', status: 'needs_info' },
            { type: 'FINISH_ACTION' },
          ],
    },
  ]
}

// ---------------------------------------------------------------------------
// 4. Generate Draft Response
// ---------------------------------------------------------------------------

const CLEAN_DRAFT = (c: Customer) =>
  `Hi ${c.name.split(' ')[0]},

Thank you for reaching out about rolling over your former employer's 401(k) into a Fidelity IRA. Here is a summary of how this would work and what we'll need to move forward.

Because you don't currently hold a Fidelity IRA, the first step is to open a Fidelity Traditional IRA. Once that account exists, we can process this as a direct rollover — the funds move straight from your former plan to your new Fidelity IRA without being paid to you first, which avoids withholding and the 60-day redeposit window.

To proceed, we'll need the following completed:
  • A Fidelity IRA application (to open your destination IRA)
  • A Fidelity rollover request form
  • The source-plan distribution/rollover paperwork from ${c.source_plan.plan_provider}

For questions about how this rollover may affect your taxes, we recommend speaking with a qualified tax professional, since the answer depends on your individual circumstances.

An associate will confirm each step with you before anything is initiated.

— Draft prepared with AI assistance; reviewed and finalized by your associate before sending.`

const REVIEW_DRAFT = (c: Customer) =>
  `Hi ${c.name.split(' ')[0]},

Thank you for reaching out about rolling over your former employer's 401(k) into a Fidelity IRA. We want to make sure this is handled correctly, so a retirement servicing specialist will review a few items on your account before we begin.

Once that review is complete, we'll walk you through the required steps and paperwork together. In the meantime, no action is needed on your part.

For questions about how a rollover may affect your taxes, we recommend speaking with a qualified tax professional, since the answer depends on your individual circumstances.

— Draft prepared with AI assistance; reviewed and finalized by your associate before sending.`

function draftScript(c: Customer): Beat[] {
  const clean = isClean(c)
  return [
    {
      atMs: 0,
      actions: [
        { type: 'START_ACTION', action: 'draft' },
        { type: 'SET_STEP_STATUS', step: 'response', status: 'in_progress' },
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
        { type: 'SET_DRAFT_TEXT', text: clean ? CLEAN_DRAFT(c) : REVIEW_DRAFT(c) },
        {
          type: 'ADD_TIMELINE',
          event: ev(2400, 'Draft ready for associate review'),
        },
        { type: 'SET_STEP_STATUS', step: 'response', status: 'complete' },
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
