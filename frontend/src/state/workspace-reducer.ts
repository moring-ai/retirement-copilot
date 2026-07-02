import type {
  AppView,
  CaseSummary,
  ComplianceIssue,
  ConfidenceLevel,
  CustomSource,
  EligibilityResult,
  Finding,
  FormVerifyStatus,
  RagSource,
  RolloverPath,
  RunningAction,
  StepId,
  StepStatus,
  TimelineEvent,
  ToolApprovalMode,
  ToolCalled,
  UploadedForm,
  WorkspaceState,
} from '@/types'
import { CUSTOMERS, DEFAULT_CUSTOMER_ID } from '@/data/customers'
import { CURRENT_ASSOCIATE, seedCases } from '@/data/cases'
import { ROLLOVER_GOALS, goalLabel } from '@/data/goals'

export const STEP_ORDER: StepId[] = [
  'customer_snapshot',
  'goal_eligibility',
  'required_forms',
  'compliance_review',
  'response',
  'review',
]

export const STEP_LABELS: Record<StepId, string> = {
  customer_snapshot: 'Customer Snapshot',
  goal_eligibility: 'Goal & Eligibility',
  required_forms: 'Required Forms',
  compliance_review: 'Compliance Review',
  response: 'Response',
  review: 'Review',
}

/** Short labels for the compact horizontal stepper. */
export const STEP_SHORT: Record<StepId, string> = {
  customer_snapshot: 'Snapshot',
  goal_eligibility: 'Goal & Eligibility',
  required_forms: 'Forms',
  compliance_review: 'Compliance',
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
    compliance_review: 'pending',
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
          customerName: CUSTOMERS[state.activeCustomerId].name,
          goalLabel: goalLabel(state.selectedGoalId),
          currentStep: state.activeStep,
          progressPct: progressPct(state.stepStatuses),
          stage: allComplete
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
  return {
    view: 'home',
    cases: seedCases(now()),
    activeCaseId: null,
    toolApprovalMode: 'ask_every_time',
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
      return { ...state, view: 'home' }

    case 'OPEN_CASE': {
      const summary = state.cases.find((c) => c.id === action.caseId)
      if (!summary) return state
      return {
        ...state,
        view: 'workspace',
        activeCaseId: summary.id,
        ...openCaseWorking(summary),
      }
    }

    case 'NEW_CASE': {
      const customerId = action.customerId ?? DEFAULT_CUSTOMER_ID
      const id = `CASE-${Math.floor(4000 + Math.random() * 5999)}`
      const t = now()
      const newCase: CaseSummary = {
        id,
        customerId,
        customerName: CUSTOMERS[customerId].name,
        goalLabel: 'Not yet selected',
        stage: 'draft',
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

    default:
      return state
  }
}
