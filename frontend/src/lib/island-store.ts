import { useEffect, useState, type DependencyList } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { StepId } from '@/types'

// A tiny module-level store (same pub/sub shape as use-toast) that lets each
// step hand its submit/continue actions to the floating agent island. Every
// spec is tagged with its stepId; the island only renders the spec that
// matches the active step, so a stale spec from a just-unmounted step is
// ignored during transitions.

export interface IslandMenuItem {
  id: string
  label: string
  icon?: LucideIcon
  danger?: boolean
  onClick: () => void
}

export interface IslandAction {
  id: string
  label: string
  onClick: () => void
  disabled?: boolean
  variant?: 'default' | 'outline' | 'ghost'
  icon?: LucideIcon
  /** The one action shown inline on the collapsed pill. */
  primary?: boolean
  /** Optional caret menu attached to the button (split-button). */
  menu?: IslandMenuItem[]
}

export interface IslandSpec {
  stepId: StepId
  /** Short label for what this step is asking for (shown in the shelf). */
  title?: string
  hint?: string
  /** Overrides the pill status line (e.g. an autopilot countdown). */
  statusText?: string
  actions: IslandAction[]
}

let current: IslandSpec | null = null
const listeners = new Set<(s: IslandSpec | null) => void>()

function emit() {
  listeners.forEach((l) => l(current))
}

export function setIslandSpec(spec: IslandSpec | null) {
  current = spec
  emit()
}

export function useIslandSpec(): IslandSpec | null {
  const [spec, setSpec] = useState<IslandSpec | null>(current)
  useEffect(() => {
    listeners.add(setSpec)
    return () => {
      listeners.delete(setSpec)
    }
  }, [])
  return spec
}

/**
 * Register the current step's island actions. Re-runs (and re-publishes) when
 * `deps` change, so disabled/label changes stay fresh. Pass a builder that
 * returns the spec for the current render.
 */
export function useRegisterIslandActions(
  build: () => IslandSpec,
  deps: DependencyList,
) {
  useEffect(() => {
    setIslandSpec(build())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
