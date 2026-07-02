import type {
  ComplianceOutcome,
  ConfidenceLevel,
  EligibilityResult,
  Finding,
  RagSource,
  RolloverPath,
  RunningAction,
  StepId,
  StepStatus,
  TimelineEvent,
  ToolCalled,
  WorkspaceState,
} from '@/types'
import { CUSTOMERS, DEFAULT_CUSTOMER_ID } from '@/data/customers'

export const STEP_ORDER: StepId[] = [
  'customer_snapshot',
  'rollover_goal',
  'eligibility_check',
  'required_forms',
  'compliance_review',
  'draft_response',
  'final_approval',
]

export const STEP_LABELS: Record<StepId, string> = {
  customer_snapshot: 'Customer Snapshot',
  rollover_goal: 'Rollover Goal',
  eligibility_check: 'Eligibility Check',
  required_forms: 'Required Forms',
  compliance_review: 'Compliance Review',
  draft_response: 'Draft Response',
  final_approval: 'Final Associate Approval',
}

export type Action =
  | { type: 'SELECT_STEP'; step: StepId }
  | { type: 'SET_CUSTOMER'; customerId: string }
  | { type: 'START_ACTION'; action: Exclude<RunningAction, null> }
  | { type: 'FINISH_ACTION' }
  | { type: 'ADD_TIMELINE'; event: TimelineEvent }
  | { type: 'ADD_TOOL_CALL'; toolCall: ToolCalled }
  | { type: 'ADD_SOURCE'; source: RagSource }
  | { type: 'SET_CONFIDENCE'; level: ConfidenceLevel }
  | { type: 'ADD_RISK_TAG'; tag: string }
  | { type: 'ADD_COMPLIANCE_WARNING'; warning: string }
  | { type: 'SET_STEP_STATUS'; step: StepId; status: StepStatus }
  | { type: 'SET_FINDINGS'; findings: Finding[] }
  | { type: 'SET_ELIGIBILITY'; result: EligibilityResult }
  | { type: 'SET_ROLLOVER_PATH'; path: RolloverPath }
  | { type: 'SET_REQUIRED_FORMS'; forms: string[] }
  | { type: 'SET_MISSING_INFO'; items: string[] }
  | { type: 'SET_RECOMMENDED_ACTION'; text: string }
  | { type: 'SET_COMPLIANCE_OUTCOME'; outcome: ComplianceOutcome }
  | { type: 'SET_DRAFT_TEXT'; text: string }
  | { type: 'TOGGLE_REVIEW_ITEM'; id: string }
  | { type: 'RESET_DEMO' }

function uniquePush<T>(list: T[], item: T, key: (x: T) => string): T[] {
  if (list.some((x) => key(x) === key(item))) return list
  return [...list, item]
}

export function createInitialState(
  customerId: string = DEFAULT_CUSTOMER_ID,
): WorkspaceState {
  const customer = CUSTOMERS[customerId]
  return {
    activeCustomerId: customerId,
    activeStep: 'eligibility_check',
    stepStatuses: {
      customer_snapshot: 'complete',
      rollover_goal: 'complete',
      eligibility_check: 'in_progress',
      required_forms: 'pending',
      compliance_review: 'pending',
      draft_response: 'pending',
      final_approval: 'pending',
    },
    runningAction: null,
    evidence: {
      timeline: [],
      sources: [],
      toolCalls: [],
      confidence: null,
      riskTags: [],
      complianceWarnings: [],
    },
    findings: [],
    eligibilityResult: null,
    rolloverPath: null,
    requiredForms: [],
    missingInformation: [],
    recommendedAction: null,
    complianceOutcome: null,
    draftText: '',
    reviewQueue: [
      {
        id: 'confirm-provider',
        label: 'Confirm current 401(k) plan provider',
        hint: `On file: ${customer.source_plan.plan_provider}`,
        checked: false,
      },
      {
        id: 'confirm-rollover-type',
        label: 'Confirm direct vs. indirect rollover with customer',
        hint: 'Direct rollover recommended per SOP',
        checked: false,
      },
      {
        id: 'review-response',
        label: 'Review the AI-generated customer response',
        hint: 'Edit and approve before sending',
        checked: false,
      },
      {
        id: 'verify-forms',
        label: 'Verify all required forms before sending',
        hint: 'IRA application + rollover request form',
        checked: false,
      },
    ],
  }
}

export function workspaceReducer(
  state: WorkspaceState,
  action: Action,
): WorkspaceState {
  switch (action.type) {
    case 'SELECT_STEP':
      return { ...state, activeStep: action.step }

    case 'SET_CUSTOMER':
      return createInitialState(action.customerId)

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

    case 'ADD_TOOL_CALL':
      return {
        ...state,
        evidence: {
          ...state.evidence,
          toolCalls: uniquePush(
            state.evidence.toolCalls,
            action.toolCall,
            (t) => t.tool,
          ),
        },
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

    case 'SET_STEP_STATUS':
      return {
        ...state,
        stepStatuses: { ...state.stepStatuses, [action.step]: action.status },
      }

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

    case 'SET_COMPLIANCE_OUTCOME':
      return { ...state, complianceOutcome: action.outcome }

    case 'SET_DRAFT_TEXT':
      return { ...state, draftText: action.text }

    case 'TOGGLE_REVIEW_ITEM':
      return {
        ...state,
        reviewQueue: state.reviewQueue.map((item) =>
          item.id === action.id ? { ...item, checked: !item.checked } : item,
        ),
      }

    case 'RESET_DEMO':
      return createInitialState(state.activeCustomerId)

    default:
      return state
  }
}
