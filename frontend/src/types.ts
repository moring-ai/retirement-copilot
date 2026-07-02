// Shared types for the Retirement Case Workspace.
//
// These deliberately mirror the real backend contract so the mocked UI reads as
// authentic and could later be wired to the live `POST /chat` endpoint with
// minimal rework:
//   - Customer record shape  -> scripts/seed_mock_data.py / mock_customers.json
//   - Finding / RagSource / ToolCalled -> backend/app/schemas/api.py
//   - Tool names             -> mcp_server/server.py
//   - RAG doc / chunk ids    -> backend/app/rag/ingest.py (_DOC_PREFIX)

export type ToolStatus = 'ok' | 'error'
export type ConfidenceLevel = 'High' | 'Medium' | 'Low'

/** Case step statuses, styled distinctly in the sidebar. */
export type StepStatus = 'complete' | 'in_progress' | 'needs_info' | 'pending'

export type StepId =
  | 'customer_snapshot'
  | 'rollover_goal'
  | 'eligibility_check'
  | 'required_forms'
  | 'compliance_review'
  | 'draft_response'
  | 'final_approval'

/** Which of the four agent actions is currently simulating. */
export type RunningAction =
  | 'eligibility'
  | 'forms'
  | 'compliance'
  | 'draft'
  | null

// ---------------------------------------------------------------------------
// Customer record (mirrors mock_customers.json)
// ---------------------------------------------------------------------------

export interface RetirementAccount {
  account_id: string
  type: string
  provider: string
  balance_estimate: number
}

export interface SourcePlan {
  description: string
  plan_provider: string
  plan_type: string
  balance_estimate: number | null
  rollover_allowed: boolean | 'unknown'
  outstanding_plan_loan: boolean
}

export type DocumentState = 'missing' | 'incomplete' | 'complete'

export interface CustomerDocuments {
  ira_application: DocumentState
  rollover_request_form: DocumentState
  identity_verification: DocumentState
}

export interface CaseStatus {
  open_rollover_case: boolean
  notes: string
}

export interface Customer {
  customer_id: string
  name: string
  age: number
  employment_status: string
  veteran_status: string
  state: string
  contact_preference: string
  email: string
  phone: string
  ssn_last4: string
  risk_flags: string[]
  has_existing_fidelity_ira: boolean
  retirement_accounts: RetirementAccount[]
  source_plan: SourcePlan
  destination_account: string
  rollover_goal: string
  account_restrictions: string[]
  documents: CustomerDocuments
  case_status: CaseStatus
}

// ---------------------------------------------------------------------------
// Agent output (mirrors backend/app/schemas/api.py)
// ---------------------------------------------------------------------------

export interface Finding {
  label: string
  value: string
  source: string
  tone?: 'positive' | 'neutral' | 'warning'
}

export interface RagSource {
  chunk_id: string
  doc: string
  /** UI-facing display name (e.g. "IRA Rollover Policy"). */
  displayName: string
  score: number
}

export interface ToolCalled {
  tool: string
  status: ToolStatus
  detail?: string
}

export interface TimelineEvent {
  id: string
  /** Relative label, e.g. "+0.8s". */
  timestamp: string
  label: string
  detail?: string
}

export interface EvidenceState {
  timeline: TimelineEvent[]
  sources: RagSource[]
  toolCalls: ToolCalled[]
  confidence: ConfidenceLevel | null
  riskTags: string[]
  complianceWarnings: string[]
}

export interface ReviewQueueItem {
  id: string
  label: string
  hint?: string
  checked: boolean
}

export interface EligibilityResult {
  eligible: boolean
  headline: string
  summary: string
}

export interface RolloverPath {
  recommended: string
  detail: string
  avoids: string[]
}

export interface WorkspaceState {
  activeCustomerId: string
  activeStep: StepId
  stepStatuses: Record<StepId, StepStatus>
  runningAction: RunningAction
  evidence: EvidenceState
  findings: Finding[]
  eligibilityResult: EligibilityResult | null
  rolloverPath: RolloverPath | null
  requiredForms: string[]
  missingInformation: string[]
  recommendedAction: string | null
  draftText: string
  reviewQueue: ReviewQueueItem[]
}
