import { useEffect, useRef } from 'react'
import { subscribe, type BusEvent } from '@/lib/agentBus'

/**
 * Subscribe to cross-tab agent-bus events. The handler is kept in a ref so
 * consumers can pass an inline closure without churning the subscription.
 */
export function useAgentBus(handler: (e: BusEvent) => void): void {
  const ref = useRef(handler)
  ref.current = handler
  useEffect(() => subscribe((e) => ref.current(e)), [])
}
