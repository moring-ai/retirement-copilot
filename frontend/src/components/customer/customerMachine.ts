// State machine for the customer "Rollover Dossier" experience.
//
// The customer never types free text — every action is a tile, a checkpoint
// confirmation, a choice, or an upload. Those actions drive real POST /chat
// calls whose router path is determined by whether the message is
// customer-specific (Path A) or general (Path B).

import type { ChatResponse } from '@/lib/chatContract'
import type { AgentRunEvent } from '@/lib/agentBus'

export type CustomerScreen = 'cover' | 'dossier' | 'guide'
export type RunStatus = 'idle' | 'running' | 'ready' | 'error'
export type MovementChoice = 'direct' | 'indirect'

export interface AssociateStamp {
  label: string
  associate: string
  at: number
}

export interface CustomerState {
  screen: CustomerScreen
  customerId: string | null
  customerName: string
  caseId: string
  goalId: string
  goalLabel: string
  status: RunStatus
  response: ChatResponse | null
  lastRun: AgentRunEvent | null
  planConfirmed: boolean
  movementChoice: MovementChoice | null
  receivedForms: string[]
  formsAcknowledged: boolean
  saved: boolean
  stamps: AssociateStamp[]
  guideTopic: GuideTopic | null
}

export type GuideTopic = 'how_it_works' | 'direct_vs_indirect' | 'forms'

export type CustomerAction =
  | { type: 'START_PATH_A'; customerId: string; customerName: string; caseId: string }
  | { type: 'START_GUIDE'; topic: GuideTopic }
  | { type: 'RUN_STARTED' }
  | { type: 'RUN_READY'; response: ChatResponse; run: AgentRunEvent }
  | { type: 'RUN_ERROR' }
  | { type: 'CONFIRM_PLAN' }
  | { type: 'CHOOSE_MOVEMENT'; choice: MovementChoice }
  | { type: 'RECEIVE_FORM'; form: string }
  | { type: 'ACK_FORMS' }
  | { type: 'SAVE_DOSSIER' }
  | { type: 'ADD_STAMP'; stamp: AssociateStamp }
  | { type: 'RESET' }

export const DEFAULT_GOAL_ID = 'direct_traditional'
export const DEFAULT_GOAL_LABEL = 'Direct rollover to a Traditional IRA'

export function initialCustomerState(): CustomerState {
  return {
    screen: 'cover',
    customerId: null,
    customerName: '',
    caseId: '',
    goalId: DEFAULT_GOAL_ID,
    goalLabel: DEFAULT_GOAL_LABEL,
    status: 'idle',
    response: null,
    lastRun: null,
    planConfirmed: false,
    movementChoice: null,
    receivedForms: [],
    formsAcknowledged: false,
    saved: false,
    stamps: [],
    guideTopic: null,
  }
}

export function customerReducer(
  state: CustomerState,
  action: CustomerAction,
): CustomerState {
  switch (action.type) {
    case 'START_PATH_A':
      return {
        ...initialCustomerState(),
        screen: 'dossier',
        customerId: action.customerId,
        customerName: action.customerName,
        caseId: action.caseId,
        status: 'running',
      }
    case 'START_GUIDE':
      return {
        ...initialCustomerState(),
        screen: 'guide',
        guideTopic: action.topic,
        status: 'running',
      }
    case 'RUN_STARTED':
      return { ...state, status: 'running' }
    case 'RUN_READY':
      return { ...state, status: 'ready', response: action.response, lastRun: action.run }
    case 'RUN_ERROR':
      return { ...state, status: 'error' }
    case 'CONFIRM_PLAN':
      return { ...state, planConfirmed: true }
    case 'CHOOSE_MOVEMENT':
      return { ...state, movementChoice: action.choice }
    case 'RECEIVE_FORM':
      return state.receivedForms.includes(action.form)
        ? state
        : { ...state, receivedForms: [...state.receivedForms, action.form] }
    case 'ACK_FORMS':
      return { ...state, formsAcknowledged: true }
    case 'SAVE_DOSSIER':
      return { ...state, saved: true }
    case 'ADD_STAMP':
      return { ...state, stamps: [...state.stamps, action.stamp] }
    case 'RESET':
      return initialCustomerState()
    default:
      return state
  }
}

// --- message construction (this is what determines the router path) ---------

/** Customer-specific rollover ask → router picks Path A (RAG + MCP). */
export function pathAMessage(): string {
  return (
    "I'd like to roll over my old 401(k) into a Fidelity IRA. Please review my " +
    'accounts, confirm whether I am eligible, note any restrictions, and tell me ' +
    'which forms I will need.'
  )
}

/** General education question, no customer identity → router picks Path B (RAG + skills). */
export function guideMessage(topic: GuideTopic): string {
  switch (topic) {
    case 'direct_vs_indirect':
      return 'Explain the difference between a direct and an indirect 401(k) to IRA rollover.'
    case 'forms':
      return 'What forms are needed for a 401(k) to IRA rollover?'
    case 'how_it_works':
    default:
      return 'Explain how a 401(k) to IRA rollover works and what forms are needed.'
  }
}

export const GUIDE_TOPICS: { id: GuideTopic; label: string }[] = [
  { id: 'how_it_works', label: 'How a rollover works' },
  { id: 'direct_vs_indirect', label: 'Direct vs. paying me first' },
  { id: 'forms', label: 'Which forms are needed' },
]

/** A web-initiated case id, stable per customer so re-runs update the same case. */
export function webCaseId(customerId: string): string {
  return `WEB-${customerId}`
}
