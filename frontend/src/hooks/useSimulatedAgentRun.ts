import { useCallback, useEffect, useRef } from 'react'
import type { Customer, RunningAction } from '@/types'
import { useWorkspace } from '@/state/WorkspaceContext'
import { buildScript } from '@/data/scenario-scripts'
import { CUSTOMERS } from '@/data/customers'

/**
 * Centralizes the "fake latency" pattern behind all four agent actions.
 * Given an action name, it looks up the scripted beats for the active customer
 * and dispatches each beat's reducer actions at its relative time offset — so
 * the Evidence Panel, findings cards, and sidebar statuses fill in as a live,
 * staggered agent trace instead of all at once.
 */
export function useSimulatedAgentRun() {
  const { state, dispatch } = useWorkspace()
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  // Clear any pending timers on unmount so a navigation mid-run can't dispatch
  // into an unmounted tree.
  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach(clearTimeout)
    }
  }, [])

  const run = useCallback(
    (action: Exclude<RunningAction, null>) => {
      if (state.runningAction) return // one action at a time
      const customer: Customer = CUSTOMERS[state.activeCustomerId]
      const beats = buildScript(action, customer)
      beats.forEach((beat) => {
        const timer = setTimeout(() => {
          beat.actions.forEach((a) => dispatch(a))
        }, beat.atMs)
        timers.current.push(timer)
      })
    },
    [state.runningAction, state.activeCustomerId, dispatch],
  )

  return { run, runningAction: state.runningAction }
}
