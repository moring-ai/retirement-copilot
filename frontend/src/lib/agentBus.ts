// The cross-tab "agent bus" — a resilient typed wrapper over BroadcastChannel
// with a localStorage fallback.
//
// The demo runs two tabs of the same app (one Customer, one Associate). The
// CUSTOMER tab owns the real /chat call and broadcasts the result as an
// AGENT_RUN event; the ASSOCIATE tab consumes it and updates the matching case.
//
// BroadcastChannel has NO replay, so an associate tab that opens (or reloads)
// after a run would miss it. To make the demo order-independent we also persist
// AGENT_RUN events to localStorage: the associate tab replays them on mount
// (getPersistedRuns) and receives live cross-tab `storage` events. Ingest is
// idempotent (upsert by case id), so double delivery is harmless.

import type { ChatResponse, RouterPath } from '@/lib/chatContract'

const CHANNEL = 'retirement-copilot'
const LS_KEY = 'rc-agent-runs'

/** A customer action fired the real backend router; both tabs react to this. */
export interface AgentRunEvent {
  type: 'AGENT_RUN'
  runId: string
  caseId: string
  customerId: string
  customerName: string
  goalId: string | null
  goalLabel: string
  path: RouterPath
  stage: 'eligibility' | 'forms' | 'compliance' | 'draft' | 'education'
  response: ChatResponse
  at: number
}

export interface CustomerActivityEvent {
  type: 'CUSTOMER_ACTIVITY'
  caseId: string
  customerId: string
  label: string
  at: number
}

export interface AssociateStampEvent {
  type: 'ASSOCIATE_STAMP'
  caseId: string
  customerId: string
  label: string
  associate: string
  at: number
}

export type BusEvent = AgentRunEvent | CustomerActivityEvent | AssociateStampEvent

type Listener = (e: BusEvent) => void

let channel: BroadcastChannel | null = null
let storageWired = false
const listeners = new Set<Listener>()

function readRuns(): Record<string, AgentRunEvent> {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '{}') as Record<string, AgentRunEvent>
  } catch {
    return {}
  }
}

function persistRun(run: AgentRunEvent): void {
  if (!run.caseId) return
  try {
    const map = readRuns()
    map[run.caseId] = run
    localStorage.setItem(LS_KEY, JSON.stringify(map))
  } catch {
    /* storage may be unavailable */
  }
}

/** All persisted customer runs — replayed by the associate tab on mount. */
export function getPersistedRuns(): AgentRunEvent[] {
  return Object.values(readRuns())
}

function ensureWiring(): void {
  if (typeof window === 'undefined') return
  if (!channel && typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(CHANNEL)
    channel.onmessage = (ev: MessageEvent<BusEvent>) => {
      for (const l of listeners) l(ev.data)
    }
  }
  if (!storageWired) {
    storageWired = true
    // Cross-tab live fallback: fires in OTHER tabs when this key changes.
    window.addEventListener('storage', (e) => {
      if (e.key === LS_KEY && e.newValue) {
        try {
          const map = JSON.parse(e.newValue) as Record<string, AgentRunEvent>
          for (const run of Object.values(map)) {
            for (const l of listeners) l(run)
          }
        } catch {
          /* ignore */
        }
      }
    })
  }
}

/** Publish an event to the other tab(s). */
export function publish(event: BusEvent): void {
  ensureWiring()
  if (event.type === 'AGENT_RUN') persistRun(event)
  channel?.postMessage(event)
}

/** Subscribe to bus events. Returns an unsubscribe function. */
export function subscribe(listener: Listener): () => void {
  ensureWiring()
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Clear persisted runs (e.g. a "reset demo" affordance). */
export function clearPersistedRuns(): void {
  try {
    localStorage.removeItem(LS_KEY)
  } catch {
    /* ignore */
  }
}

let seq = 0
export function nextId(prefix = 'run'): string {
  seq += 1
  return `${prefix}-${Date.now().toString(36)}-${seq}`
}
