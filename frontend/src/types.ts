// Shared types for the Retirement Case Workspace.
//
// These deliberately mirror the real backend contract so the mocked UI reads as
// authentic and could later be wired to the live `POST /chat` endpoint with
// minimal rework:
//   - Customer record shape  -> scripts/seed_mock_data.py / mock_customers.json
//   - Finding / RagSource / ToolCalled -> backend/app/schemas/api.py
//   - Tool names             -> mcp_server/server.py
//   - RAG doc / chunk ids    -> backend/app/rag/ingest.py (_DOC_PREFIX)

import type { ChatResponse } from '@/lib/chatContract'

export type ToolStatus = 'ok' | 'error'
export type ConfidenceLevel = 'High' | 'Medium' | 'Low'

/** Case step statuses, styled distinctly across the workspace. */
export type StepStatus = 'complete' | 'in_progress' | 'needs_info' | 'pending'

/** Top-level app view. */
export type AppView = 'home' | 'workspace'

export type StepId =
  | 'customer_snapshot'
  | 'goal_eligibility'
  | 'required_forms'
  | 'compliance_review'
  | 'response'
  | 'review'

/** Which of the agent actions is currently simulating. */
export type RunningAction = 'eligibility' | 'forms' | 'compliance' | 'draft' | null

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
  date_of_birth: string
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
// Rollover goals (associate-selectable)
// ---------------------------------------------------------------------------

export interface RolloverGoalOption {
  id: string
  label: string
  description: string
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

/** An associate-uploaded document held in approved Fidelity storage. */
export interface CustomSource {
  id: string
  name: string
  sizeLabel: string
}

export type ToolApprovalMode = 'ask_every_time' | 'full_control'
export type ToolApproval = 'pending' | 'approved' | 'denied'

export interface ToolCalled {
  tool: string
  status: ToolStatus
  detail?: string
  approval: ToolApproval
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

// ---------------------------------------------------------------------------
// Compliance
// ---------------------------------------------------------------------------

export type IssueSeverity = 'critical' | 'warning' | 'info'
export type IssueRecommendation =
  | 'escalate_supervisor'
  | 'reassign_specialist'
  | 'reject_case'
  | 'proceed'

export interface ComplianceIssue {
  id: string
  title: string
  detail: string
  severity: IssueSeverity
  recommendation: IssueRecommendation
  recommendationDetail: string
}

// ---------------------------------------------------------------------------
// Uploaded / filled forms
// ---------------------------------------------------------------------------

export type FormVerifyStatus = 'unverified' | 'verifying' | 'verified' | 'issues'

export interface UploadedForm {
  id: string
  name: string
  sizeLabel: string
  status: FormVerifyStatus
  comments: string[]
}

// ---------------------------------------------------------------------------
// Case list (home screen)
// ---------------------------------------------------------------------------

export type CaseStage = 'draft' | 'in_review' | 'submitted' | 'escalated'
export type CasePriority = 'high' | 'medium' | 'low'

export interface CaseSummary {
  id: string
  customerId: string
  customerName: string
  goalLabel: string
  stage: CaseStage
  priority: CasePriority
  assignee: string
  currentStep: StepId
  progressPct: number
  lastUpdatedBy: string
  lastUpdatedAt: number
  createdAt: number
}

// ---------------------------------------------------------------------------
// Case transfers
// ---------------------------------------------------------------------------

export type TransferStatus = 'pending' | 'accepted' | 'declined'

export interface TransferRequest {
  id: string
  caseId: string
  customerName: string
  fromAssociate: string
  toAssociate: string
  note?: string
  status: TransferStatus
  createdAt: number
}

// ---------------------------------------------------------------------------
// Workspace state
// ---------------------------------------------------------------------------

export interface WorkspaceState {
  view: AppView
  cases: CaseSummary[]
  transferRequests: TransferRequest[]
  /** Real /chat responses from customer-initiated (web) cases, keyed by case id. */
  webRuns: Record<string, ChatResponse>
  activeCaseId: string | null
  activeCustomerId: string
  activeStep: StepId
  stepStatuses: Record<StepId, StepStatus>
  runningAction: RunningAction
  evidence: EvidenceState

  identityVerified: boolean
  selectedGoalId: string | null
  toolApprovalMode: ToolApprovalMode

  customSources: CustomSource[]
  uploadedForms: UploadedForm[]
  complianceIssues: ComplianceIssue[]
  responseApproved: boolean
  complianceDocApproved: boolean

  findings: Finding[]
  eligibilityResult: EligibilityResult | null
  rolloverPath: RolloverPath | null
  requiredForms: string[]
  missingInformation: string[]
  recommendedAction: string | null
  draftText: string
}
