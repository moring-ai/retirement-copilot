import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useWorkspace } from '@/state/WorkspaceContext'
import { STEP_ORDER, STEP_SHORT } from '@/state/workspace-reducer'
import { Button } from '@/components/ui/button'

/**
 * Back / Next navigation for a step, rendered inside a StickyActionBar. Any
 * step-specific actions passed as children sit between Back (far left) and
 * Next (far right). Back is disabled on the first step; Next is hidden on the
 * last step (where the step supplies its own submit action instead).
 */
export function StepNav({
  children,
  nextDisabled = false,
  nextHint,
}: {
  children?: ReactNode
  nextDisabled?: boolean
  /** Tooltip-style hint shown next to Next when it is disabled. */
  nextHint?: string
}) {
  const { state, dispatch } = useWorkspace()
  const idx = STEP_ORDER.indexOf(state.activeStep)
  const prev = idx > 0 ? STEP_ORDER[idx - 1] : null
  const next = idx < STEP_ORDER.length - 1 ? STEP_ORDER[idx + 1] : null

  return (
    <>
      <Button
        variant="ghost"
        disabled={!prev}
        onClick={() => prev && dispatch({ type: 'SELECT_STEP', step: prev })}
      >
        <ChevronLeft />
        Back
      </Button>

      <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
        {nextDisabled && nextHint && next && (
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {nextHint}
          </span>
        )}
        {children}
        {next && (
          <Button
            variant="outline"
            disabled={nextDisabled}
            onClick={() => dispatch({ type: 'SELECT_STEP', step: next })}
          >
            {STEP_SHORT[next]}
            <ChevronRight />
          </Button>
        )}
      </div>
    </>
  )
}
