// The cross-tab "agent bus" — a thin typed wrapper over BroadcastChannel.
//
// The demo runs two tabs of the same app (one Customer, one Associate). The
// CUSTOMER tab owns the real /chat call and broadcasts the result as an
// AGENT_RUN event; the ASSOCIATE tab consumes it and updates the matching case
// implicitly (never naming the router/paths). A reverse ASSOCIATE_STAMP channel
// lets the associate's review appear as a quiet stamp in the customer's margin.

import type { ChatResponse, RouterPath } from '@/lib/chatContract'

const CHANNEL = 'retirement-copilot'

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
  /** Which customer-side milestone triggered this run. */
  stage: 'eligibility' | 'forms' | 'compliance' | 'draft' | 'education'
  response: ChatResponse
  at: number
}

/** A lighter customer-side activity note (e.g. an upload) — implicit on the associate side. */
export interface CustomerActivityEvent {
  type: 'CUSTOMER_ACTIVITY'
  caseId: string
  customerId: string
  label: string
  at: number
}

/** Reverse channel: associate reviewed/accepted — shown as a stamp in the customer margin. */
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
const listeners = new Set<Listener>()

function ensureChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return null
  }
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL)
    channel.onmessage = (ev: MessageEvent<BusEvent>) => {
      for (const l of listeners) l(ev.data)
    }
  }
  return channel
}

/** Publish an event to the other tab(s). */
export function publish(event: BusEvent): void {
  ensureChannel()?.postMessage(event)
}

/** Subscribe to bus events. Returns an unsubscribe function. */
export function subscribe(listener: Listener): () => void {
  ensureChannel()
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Small helper for demo-stable, non-crypto ids (no Math.random dependency at import). */
let seq = 0
export function nextId(prefix = 'run'): string {
  seq += 1
  return `${prefix}-${Date.now().toString(36)}-${seq}`
}
