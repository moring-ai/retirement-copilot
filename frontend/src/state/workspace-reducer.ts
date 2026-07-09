import type {
  AppView,
  CasePriority,
  CaseStage,
  CaseSummary,
  ComplianceIssue,
  ConfidenceLevel,
  CustomSource,
  EligibilityResult,
  Finding,
  FormVerifyStatus,
  IssueRecommendation,
  IssueSeverity,
  RagSource,
  RolloverPath,
  RunningAction,
  StepId,
  StepStatus,
  TimelineEvent,
  ToolApprovalMode,
  ToolCalled,
  TransferRequest,
  UploadedForm,
  WorkspaceState,
} from '@/types'
import type { AgentRunEvent } from '@/lib/agentBus'
import type { ChatResponse } from '@/lib/chatContract'
import { CUSTOMERS, DEFAULT_CUSTOMER_ID } from '@/data/customers'
import { CURRENT_ASSOCIATE, seedCases, seedTransfers } from '@/data/cases'
import { ROLLOVER_GOALS, goalLabel } from '@/data/goals'

export const STEP_ORDER: StepId[] = [
  'customer_snapshot',
  'goal_eligibility',
  'required_forms',
  'response',
  'review',
]

export const STEP_LABELS: Record<StepId, string> = {
  customer_snapshot: 'Customer Snapshot',
  goal_eligibility: 'Goal & Eligibility',
  required_forms: 'Required Forms',
  response: 'Response',
  review: 'Review',
}

/** Short labels for the compact horizontal stepper. */
export const STEP_SHORT: Record<StepId, string> = {
  customer_snapshot: 'Snapshot',
  goal_eligibility: 'Goal & Eligibility',
  required_forms: 'Forms',
  response: 'Response',
  review: 'Review',
}

export type Action =
  | { type: 'SET_VIEW'; view: AppView }
  | { type: 'GO_HOME' }
  | { type: 'OPEN_CASE'; caseId: string }
  | { type: 'NEW_CASE'; customerId?: string }
  | { type: 'SELECT_STEP'; step: StepId }
  | { type: 'START_ACTION'; action: Exclude<RunningAction, null> }
  | { type: 'FINISH_ACTION' }
  | { type: 'ADD_TIMELINE'; event: TimelineEvent }
  | { type: 'ADD_TOOL_CALL'; toolCall: Omit<ToolCalled, 'approval'> }
  | { type: 'APPROVE_TOOL'; tool: string }
  | { type: 'DENY_TOOL'; tool: string }
  | { type: 'APPROVE_ALL_TOOLS' }
  | { type: 'SET_TOOL_APPROVAL_MODE'; mode: ToolApprovalMode }
  | { type: 'ADD_SOURCE'; source: RagSource }
  | { type: 'ADD_CUSTOM_SOURCE'; source: CustomSource }
  | { type: 'REMOVE_CUSTOM_SOURCE'; id: string }
  | { type: 'SET_CONFIDENCE'; level: ConfidenceLevel }
  | { type: 'ADD_RISK_TAG'; tag: string }
  | { type: 'ADD_COMPLIANCE_WARNING'; warning: string }
  | { type: 'SET_COMPLIANCE_ISSUES'; issues: ComplianceIssue[] }
  | { type: 'SET_STEP_STATUS'; step: StepId; status: StepStatus }
  | { type: 'SET_FINDINGS'; findings: Finding[] }
  | { type: 'SET_ELIGIBILITY'; result: EligibilityResult }
  | { type: 'SET_ROLLOVER_PATH'; path: RolloverPath }
  | { type: 'SET_REQUIRED_FORMS'; forms: string[] }
  | { type: 'SET_MISSING_INFO'; items: string[] }
  | { type: 'SET_RECOMMENDED_ACTION'; text: string }
  | { type: 'SET_DRAFT_TEXT'; text: string }
  | { type: 'VERIFY_IDENTITY' }
  | { type: 'SELECT_GOAL'; goalId: string }
  | { type: 'ADD_UPLOADED_FORM'; form: UploadedForm }
  | { type: 'SET_FORM_STATUS'; id: string; status: FormVerifyStatus; comments?: string[] }
  | { type: 'REMOVE_UPLOADED_FORM'; id: string }
  | { type: 'SET_RESPONSE_APPROVED'; approved: boolean }
  | { type: 'SET_COMPLIANCE_DOC_APPROVED'; approved: boolean }
  | { type: 'SET_CASE_PRIORITY'; caseId: string; priority: CasePriority }
  | { type: 'SET_CASE_STAGE'; caseId: string; stage: CaseStage; progressPct?: number; currentStep?: StepId }
  | { type: 'SET_OUTCOME'; outcome: CaseStage | null }
  | { type: 'TRANSFER_CASE'; caseId: string; toAssociate: string; note?: string }
  | { type: 'ACCEPT_TRANSFER'; requestId: string }
  | { type: 'DECLINE_TRANSFER'; requestId: string }
  | { type: 'INGEST_AGENT_RUN'; run: AgentRunEvent }

function uniquePush<T>(list: T[], item: T, key: (x: T) => string): T[] {
  if (list.some((x) => key(x) === key(item))) return list
  return [...list, item]
}

function now(): number {
  return Date.now()
}

// ---------------------------------------------------------------------------
// Per-case working state
// ---------------------------------------------------------------------------

type WorkingState = Pick<
  WorkspaceState,
  | 'activeCustomerId'
  | 'activeStep'
  | 'stepStatuses'
  | 'runningAction'
  | 'evidence'
  | 'identityVerified'
  | 'selectedGoalId'
  | 'customSources'
  | 'uploadedForms'
  | 'complianceIssues'
  | 'responseApproved'
  | 'complianceDocApproved'
  | 'findings'
  | 'eligibilityResult'
  | 'rolloverPath'
  | 'requiredForms'
  | 'missingInformation'
  | 'recommendedAction'
  | 'draftText'
>

function emptyStatuses(): Record<StepId, StepStatus> {
  return {
    customer_snapshot: 'pending',
    goal_eligibility: 'pending',
    required_forms: 'pending',
    response: 'pending',
    review: 'pending',
  }
}

function freshWorking(customerId: string): WorkingState {
  const statuses = emptyStatuses()
  statuses.customer_snapshot = 'in_progress'
  return {
    activeCustomerId: customerId,
    activeStep: 'customer_snapshot',
    stepStatuses: statuses,
    runningAction: null,
    evidence: {
      timeline: [],
      sources: [],
      toolCalls: [],
      confidence: null,
      riskTags: [],
      complianceWarnings: [],
    },
    identityVerified: false,
    selectedGoalId: null,
    customSources: [],
    uploadedForms: [],
    complianceIssues: [],
    responseApproved: false,
    complianceDocApproved: false,
    findings: [],
    eligibilityResult: null,
    rolloverPath: null,
    requiredForms: [],
    missingInformation: [],
    recommendedAction: null,
    draftText: '',
  }
}

/** Reconstruct believable working state when re-opening an existing case. */
function openCaseWorking(summary: CaseSummary): WorkingState {
  const base = freshWorking(summary.customerId)
  const currentIdx = STEP_ORDER.indexOf(summary.currentStep)
  const statuses = emptyStatuses()
  STEP_ORDER.forEach((step, i) => {
    if (i < currentIdx) statuses[step] = 'complete'
    else if (i === currentIdx)
      statuses[step] = summary.stage === 'escalated' ? 'needs_info' : 'in_progress'
    else statuses[step] = 'pending'
  })
  return {
    ...base,
    activeStep: summary.currentStep,
    stepStatuses: statuses,
    identityVerified: currentIdx > 0,
    selectedGoalId:
      currentIdx >= 1
        ? (ROLLOVER_GOALS.find((g) => g.label === summary.goalLabel)?.id ?? null)
        : null,
  }
}

function progressPct(statuses: Record<StepId, StepStatus>): number {
  const done = STEP_ORDER.filter((s) => statuses[s] === 'complete').length
  return Math.round((done / STEP_ORDER.length) * 100)
}

// ---------------------------------------------------------------------------
// Hydrate the associate working state from a REAL customer /chat run.
// This is how "the associate undergoes the corresponding agent actions": a
// customer-initiated run fills the case's evidence panel, findings, eligibility,
// forms, compliance, and draft — from the same ChatResponse the customer saw.
// ---------------------------------------------------------------------------

const DOC_DISPLAY: Record<string, string> = {
  'rollover_sop.md': 'IRA Rollover Policy',
  'ira_opening_guidance.md': 'IRA Opening Guidance',
  'required_forms_guidance.md': 'Required Forms Guidance',
  'approved_customer_language.md': 'Approved Customer Language',
  'escalation_policy.md': 'Escalation Policy',
  'tax_advice_boundaries.md': 'Tax Advice Boundaries',
}

function ragToSources(r: ChatResponse): RagSource[] {
  return r.rag_sources.map((s) => ({
    chunk_id: s.chunk_id,
    doc: s.doc,
    displayName: DOC_DISPLAY[s.doc] ?? s.doc,
    score: s.score ?? 0,
  }))
}

function runToFindings(r: ChatResponse): Finding[] {
  return r.findings.map((f) => {
    const v = f.value.trim().toLowerCase()
    const good = ['none', 'no', 'allowed', 'true', 'complete', 'none on file']
    const bad = ['unknown', 'incomplete', 'yes', 'false']
    let tone: Finding['tone'] = 'neutral'
    if (good.includes(v)) tone = 'positive'
    else if (bad.includes(v)) tone = 'warning'
    // context tweaks: "Outstanding plan loan: No" is positive; "Rollover eligibility: allowed" positive
    if (/loan/i.test(f.label) && v === 'no') tone = 'positive'
    if (/restrictions/i.test(f.label) && v === 'none') tone = 'positive'
    return { label: f.label, value: f.value, source: f.source, tone }
  })
}

function runToIssues(r: ChatResponse): ComplianceIssue[] {
  if (!r.escalation_required) {
    return [
      {
        id: 'no-blockers',
        title: 'No compliance blockers detected',
        detail:
          'Identity is verified, no account restrictions are present, and the source plan permits the rollover. The case may proceed to a drafted customer response.',
        severity: 'info',
        recommendation: 'proceed',
        recommendationDetail:
          'Proceed to draft the customer response. Standard human review still applies before anything is sent.',
      },
    ]
  }
  return r.escalation_reasons.map((reason, i) => {
    const low = reason.toLowerCase()
    let severity: IssueSeverity = 'warning'
    let recommendation: IssueRecommendation = 'reassign_specialist'
    let recDetail =
      'Reassign to a specialist to resolve this item before initiating any transfer.'
    if (low.includes('beneficiary')) {
      severity = 'critical'
      recommendation = 'escalate_supervisor'
      recDetail =
        'Escalate to your supervisor and hold the case until the beneficiary dispute is resolved.'
    } else if (low.includes('identity')) {
      severity = 'critical'
      recommendation = 'reject_case'
      recDetail =
        'Do not proceed. Return the case to intake to complete identity verification.'
    }
    return {
      id: `esc-${i}`,
      title: reason.replace(/\.$/, ''),
      detail: reason,
      severity,
      recommendation,
      recommendationDetail: recDetail,
    }
  })
}

function hydrateFromRun(customerId: string, r: ChatResponse): Partial<WorkingState> {
  const escalation = r.escalation_required
  const statuses: Record<StepId, StepStatus> = {
    customer_snapshot: 'complete',
    goal_eligibility: escalation ? 'needs_info' : 'complete',
    required_forms: 'complete',
    // Clean run stops at the drafted response for the associate's final approval.
    response: escalation ? 'pending' : 'in_progress',
    review: 'pending',
  }
  return {
    activeCustomerId: customerId,
    activeStep: escalation ? 'goal_eligibility' : 'response',
    stepStatuses: statuses,
    identityVerified: true,
    selectedGoalId: 'direct_traditional',
    evidence: {
      timeline: [
        { id: 'wr-1', timestamp: '+0.0s', label: 'Customer started a rollover online' },
        {
          id: 'wr-2',
          timestamp: '+1.2s',
          label: 'Agent checked accounts against approved policy',
          detail: `${r.tools_called.length} system lookups · ${r.rag_sources.length} sources`,
        },
        {
          id: 'wr-3',
          timestamp: '+2.4s',
          label: escalation
            ? 'Escalation flagged — routed for specialist review'
            : 'Eligibility confirmed — draft prepared',
        },
      ],
      sources: ragToSources(r),
      toolCalls: r.tools_called.map((t) => ({
        tool: t.tool,
        status: t.status,
        approval: 'approved' as const,
      })),
      confidence: escalation ? 'Medium' : 'High',
      riskTags: escalation
        ? r.escalation_reasons.slice(0, 3).map((x) => x.replace(/\.$/, ''))
        : [],
      complianceWarnings: r.compliance_notes
        .filter((n) => /advice|tax|money|movement|pii/i.test(n))
        .slice(0, 3),
    },
    findings: runToFindings(r),
    eligibilityResult: {
      eligible: !escalation,
      headline: escalation
        ? 'Needs review before a rollover can proceed'
        : 'Eligible for a direct rollover',
      summary: r.case_summary || r.answer.slice(0, 240),
    },
    rolloverPath: {
      recommended: escalation ? 'Hold — pending review' : 'Direct rollover',
      detail: escalation
        ? 'Confirm the flagged items before any path is initiated.'
        : 'Funds move straight from the former employer plan to the Fidelity IRA — the customer never takes receipt.',
      avoids: escalation ? [] : ['Mandatory 20% withholding', '60-day redeposit requirement'],
    },
    requiredForms: r.required_forms,
    // A clean online run means the customer uploaded and we verified their
    // paperwork — surface it in the associate's Required Forms step.
    uploadedForms: escalation
      ? []
      : r.required_forms.map((f, i) => ({
          id: `web-form-${i}`,
          name: f,
          sizeLabel: 'from customer',
          status: 'verified' as const,
          comments: [
            '✓ Uploaded by the customer online.',
            '✓ AI completeness check passed.',
          ],
        })),
    missingInformation: [],
    recommendedAction: escalation
      ? 'Do not initiate the rollover. Escalate for review of the flagged items.'
      : 'Proceed to draft the customer response for review.',
    complianceIssues: runToIssues(r),
    draftText: r.customer_draft,
  }
}

/** Stamp the active case summary with the latest working-state snapshot. */
function touchCase(state: WorkspaceState): WorkspaceState {
  if (!state.activeCaseId) return state
  const escalated = STEP_ORDER.some(
    (s) => state.stepStatuses[s] === 'needs_info',
  )
  const allComplete = STEP_ORDER.every(
    (s) => state.stepStatuses[s] === 'complete',
  )
  const cases = state.cases.map((c) =>
    c.id === state.activeCaseId
      ? {
          ...c,
          customerId: state.activeCustomerId,
          customerName: CUSTOMERS[state.activeCustomerId]?.name ?? c.customerName,
          goalLabel: goalLabel(state.selectedGoalId),
          currentStep: state.activeStep,
          progressPct: progressPct(state.stepStatuses),
          // Preserve associate-set terminal stages; otherwise derive from progress.
          stage:
            c.stage === 'pending' || c.stage === 'rejected'
              ? c.stage
              : allComplete
                ? ('submitted' as const)
                : escalated
                  ? ('escalated' as const)
                  : c.stage === 'draft' && state.identityVerified
                    ? ('in_review' as const)
                    : c.stage,
          lastUpdatedBy: CURRENT_ASSOCIATE,
          lastUpdatedAt: now(),
        }
      : c,
  )
  return { ...state, cases }
}

// ---------------------------------------------------------------------------

export function createInitialState(): WorkspaceState {
  const t = now()
  return {
    view: 'home',
    cases: seedCases(t),
    transferRequests: seedTransfers(t),
    webRuns: {},
    activeCaseId: null,
    pendingOutcome: null,
    toolApprovalMode: 'full_control',
    ...freshWorking(DEFAULT_CUSTOMER_ID),
  }
}

export function workspaceReducer(
  state: WorkspaceState,
  action: Action,
): WorkspaceState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, view: action.view }

    case 'GO_HOME':
      return { ...state, view: 'home', pendingOutcome: null }

    case 'SET_OUTCOME':
      return { ...state, pendingOutcome: action.outcome }

    case 'OPEN_CASE': {
      const summary = state.cases.find((c) => c.id === action.caseId)
      if (!summary) return state
      const web = state.webRuns[summary.id]
      const working = web
        ? { ...openCaseWorking(summary), ...hydrateFromRun(summary.customerId, web) }
        : openCaseWorking(summary)
      return {
        ...state,
        view: 'workspace',
        activeCaseId: summary.id,
        pendingOutcome: null,
        ...working,
      }
    }

    case 'NEW_CASE': {
      const customerId = action.customerId ?? DEFAULT_CUSTOMER_ID
      const id = `CASE-${Math.floor(4000 + Math.random() * 5999)}`
      const t = now()
      const newCase: CaseSummary = {
        id,
        customerId,
        customerName: CUSTOMERS[customerId]?.name ?? 'Customer',
        goalLabel: 'Not yet selected',
        stage: 'draft',
        priority: 'medium',
        assignee: CURRENT_ASSOCIATE,
        currentStep: 'customer_snapshot',
        progressPct: 0,
        lastUpdatedBy: CURRENT_ASSOCIATE,
        lastUpdatedAt: t,
        createdAt: t,
      }
      return {
        ...state,
        view: 'workspace',
        cases: [newCase, ...state.cases],
        activeCaseId: id,
        pendingOutcome: null,
        ...freshWorking(customerId),
      }
    }

    case 'SELECT_STEP':
      return touchCase({ ...state, activeStep: action.step })

    case 'START_ACTION':
      return { ...state, runningAction: action.action }

    case 'FINISH_ACTION':
      return { ...state, runningAction: null }

    case 'ADD_TIMELINE':
      return {
        ...state,
        evidence: {
          ...state.evidence,
          timeline: [...state.evidence.timeline, action.event],
        },
      }

    case 'ADD_TOOL_CALL': {
      const approval =
        state.toolApprovalMode === 'full_control' ? 'approved' : 'pending'
      return {
        ...state,
        evidence: {
          ...state.evidence,
          toolCalls: uniquePush(
            state.evidence.toolCalls,
            { ...action.toolCall, approval },
            (t) => t.tool,
          ),
        },
      }
    }

    case 'APPROVE_TOOL':
      return {
        ...state,
        evidence: {
          ...state.evidence,
          toolCalls: state.evidence.toolCalls.map((t) =>
            t.tool === action.tool ? { ...t, approval: 'approved' } : t,
          ),
        },
      }

    case 'DENY_TOOL':
      return {
        ...state,
        evidence: {
          ...state.evidence,
          toolCalls: state.evidence.toolCalls.map((t) =>
            t.tool === action.tool ? { ...t, approval: 'denied' } : t,
          ),
        },
      }

    case 'APPROVE_ALL_TOOLS':
      return {
        ...state,
        evidence: {
          ...state.evidence,
          toolCalls: state.evidence.toolCalls.map((t) =>
            t.approval === 'pending' ? { ...t, approval: 'approved' } : t,
          ),
        },
      }

    case 'SET_TOOL_APPROVAL_MODE':
      return {
        ...state,
        toolApprovalMode: action.mode,
        // Switching to full control auto-approves anything still pending.
        evidence:
          action.mode === 'full_control'
            ? {
                ...state.evidence,
                toolCalls: state.evidence.toolCalls.map((t) =>
                  t.approval === 'pending' ? { ...t, approval: 'approved' } : t,
                ),
              }
            : state.evidence,
      }

    case 'ADD_SOURCE':
      return {
        ...state,
        evidence: {
          ...state.evidence,
          sources: uniquePush(
            state.evidence.sources,
            action.source,
            (s) => s.chunk_id,
          ),
        },
      }

    case 'ADD_CUSTOM_SOURCE':
      return {
        ...state,
        customSources: uniquePush(
          state.customSources,
          action.source,
          (s) => s.id,
        ),
      }

    case 'REMOVE_CUSTOM_SOURCE':
      return {
        ...state,
        customSources: state.customSources.filter((s) => s.id !== action.id),
      }

    case 'SET_CONFIDENCE':
      return {
        ...state,
        evidence: { ...state.evidence, confidence: action.level },
      }

    case 'ADD_RISK_TAG':
      return {
        ...state,
        evidence: {
          ...state.evidence,
          riskTags: state.evidence.riskTags.includes(action.tag)
            ? state.evidence.riskTags
            : [...state.evidence.riskTags, action.tag],
        },
      }

    case 'ADD_COMPLIANCE_WARNING':
      return {
        ...state,
        evidence: {
          ...state.evidence,
          complianceWarnings: state.evidence.complianceWarnings.includes(
            action.warning,
          )
            ? state.evidence.complianceWarnings
            : [...state.evidence.complianceWarnings, action.warning],
        },
      }

    case 'SET_COMPLIANCE_ISSUES':
      return { ...state, complianceIssues: action.issues }

    case 'SET_STEP_STATUS':
      return touchCase({
        ...state,
        stepStatuses: { ...state.stepStatuses, [action.step]: action.status },
      })

    case 'SET_FINDINGS':
      return { ...state, findings: action.findings }

    case 'SET_ELIGIBILITY':
      return { ...state, eligibilityResult: action.result }

    case 'SET_ROLLOVER_PATH':
      return { ...state, rolloverPath: action.path }

    case 'SET_REQUIRED_FORMS':
      return { ...state, requiredForms: action.forms }

    case 'SET_MISSING_INFO':
      return { ...state, missingInformation: action.items }

    case 'SET_RECOMMENDED_ACTION':
      return { ...state, recommendedAction: action.text }

    case 'SET_DRAFT_TEXT':
      return { ...state, draftText: action.text }

    case 'VERIFY_IDENTITY':
      return touchCase({
        ...state,
        identityVerified: true,
        stepStatuses: {
          ...state.stepStatuses,
          customer_snapshot: 'complete',
          goal_eligibility:
            state.stepStatuses.goal_eligibility === 'pending'
              ? 'in_progress'
              : state.stepStatuses.goal_eligibility,
        },
      })

    case 'SELECT_GOAL':
      return touchCase({ ...state, selectedGoalId: action.goalId })

    case 'ADD_UPLOADED_FORM':
      return {
        ...state,
        uploadedForms: [...state.uploadedForms, action.form],
      }

    case 'SET_FORM_STATUS':
      return {
        ...state,
        uploadedForms: state.uploadedForms.map((f) =>
          f.id === action.id
            ? {
                ...f,
                status: action.status,
                comments: action.comments ?? f.comments,
              }
            : f,
        ),
      }

    case 'REMOVE_UPLOADED_FORM':
      return {
        ...state,
        uploadedForms: state.uploadedForms.filter((f) => f.id !== action.id),
      }

    case 'SET_RESPONSE_APPROVED':
      return { ...state, responseApproved: action.approved }

    case 'SET_COMPLIANCE_DOC_APPROVED':
      return { ...state, complianceDocApproved: action.approved }

    case 'SET_CASE_PRIORITY':
      return {
        ...state,
        cases: state.cases.map((c) =>
          c.id === action.caseId ? { ...c, priority: action.priority } : c,
        ),
      }

    case 'SET_CASE_STAGE':
      return {
        ...state,
        cases: state.cases.map((c) =>
          c.id === action.caseId
            ? {
                ...c,
                stage: action.stage,
                ...(action.progressPct !== undefined ? { progressPct: action.progressPct } : {}),
                ...(action.currentStep ? { currentStep: action.currentStep } : {}),
                lastUpdatedBy: CURRENT_ASSOCIATE,
                lastUpdatedAt: now(),
              }
            : c,
        ),
      }

    case 'TRANSFER_CASE': {
      const c = state.cases.find((x) => x.id === action.caseId)
      if (!c) return state
      const request: TransferRequest = {
        id: `TR-${Math.floor(1000 + Math.random() * 8999)}`,
        caseId: c.id,
        customerName: c.customerName,
        fromAssociate: CURRENT_ASSOCIATE,
        toAssociate: action.toAssociate,
        note: action.note,
        status: 'pending',
        createdAt: now(),
      }
      return { ...state, transferRequests: [request, ...state.transferRequests] }
    }

    case 'ACCEPT_TRANSFER': {
      const req = state.transferRequests.find((r) => r.id === action.requestId)
      if (!req) return state
      return {
        ...state,
        transferRequests: state.transferRequests.map((r) =>
          r.id === action.requestId ? { ...r, status: 'accepted' } : r,
        ),
        cases: state.cases.map((c) =>
          c.id === req.caseId
            ? {
                ...c,
                assignee: req.toAssociate,
                lastUpdatedBy: req.toAssociate,
                lastUpdatedAt: now(),
              }
            : c,
        ),
      }
    }

    case 'DECLINE_TRANSFER':
      return {
        ...state,
        transferRequests: state.transferRequests.map((r) =>
          r.id === action.requestId ? { ...r, status: 'declined' } : r,
        ),
      }

    case 'INGEST_AGENT_RUN': {
      const { run } = action
      // Path A (general education) and non-customer runs never create an associate
      // case — only Path B (customer-specific, MCP-backed) opens a servicing case.
      if (run.path !== 'B_prompt_chain' || !run.caseId) return state

      const response = run.response
      const escalation = response.escalation_required
      const existing = state.cases.find((c) => c.id === run.caseId)
      const t = now()

      const summary: CaseSummary = {
        id: run.caseId,
        customerId: run.customerId,
        customerName: run.customerName,
        goalLabel: run.goalLabel || 'Direct rollover to a Traditional IRA',
        stage: escalation ? 'escalated' : 'in_review',
        priority: escalation ? 'high' : 'medium',
        assignee: CURRENT_ASSOCIATE,
        currentStep: escalation ? 'goal_eligibility' : 'response',
        progressPct: escalation ? 66 : 83,
        lastUpdatedBy: `${run.customerName} (online)`,
        lastUpdatedAt: t,
        createdAt: existing?.createdAt ?? t,
      }

      const cases = existing
        ? state.cases.map((c) => (c.id === run.caseId ? summary : c))
        : [summary, ...state.cases]
      const webRuns = { ...state.webRuns, [run.caseId]: response }

      // If the associate is already viewing this case, fill it live.
      const live =
        state.activeCaseId === run.caseId
          ? hydrateFromRun(run.customerId, response)
          : {}

      return { ...state, cases, webRuns, ...live }
    }

    default:
      return state
  }
}
