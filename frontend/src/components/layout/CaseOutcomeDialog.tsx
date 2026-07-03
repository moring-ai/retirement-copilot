import { CheckCircle2, PauseCircle, XCircle, Home, type LucideIcon } from 'lucide-react'
import type { CaseStage } from '@/types'
import { useWorkspace } from '@/state/WorkspaceContext'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const META: Record<
  string,
  { title: string; body: string; icon: LucideIcon; tone: string }
> = {
  submitted: {
    title: 'Case approved',
    body: 'This case has been approved and finalised.',
    icon: CheckCircle2,
    tone: 'bg-brand-soft text-brand-dark',
  },
  pending: {
    title: 'Moved to pending',
    body: 'The case is on hold pending customer action.',
    icon: PauseCircle,
    tone: 'bg-warn-soft text-warn',
  },
  rejected: {
    title: 'Case rejected',
    body: 'The case has been rejected and closed.',
    icon: XCircle,
    tone: 'bg-danger-soft text-danger',
  },
}

/** After a terminal stage is applied, prompt the associate to return home. */
export function CaseOutcomeDialog() {
  const { state, dispatch } = useWorkspace()
  const outcome = state.pendingOutcome as CaseStage | null
  const meta = outcome ? META[outcome] : null

  return (
    <Dialog
      open={meta !== null}
      onOpenChange={(open) => {
        if (!open) dispatch({ type: 'SET_OUTCOME', outcome: null })
      }}
    >
      <DialogContent className="max-w-sm">
        {meta && (
          <>
            <DialogHeader>
              <span
                className={`mb-1 flex h-12 w-12 items-center justify-center rounded-full ${meta.tone}`}
              >
                <meta.icon className="h-6 w-6" />
              </span>
              <DialogTitle>{meta.title}</DialogTitle>
              <DialogDescription>{meta.body}</DialogDescription>
            </DialogHeader>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => dispatch({ type: 'SET_OUTCOME', outcome: null })}
              >
                Stay
              </Button>
              <Button onClick={() => dispatch({ type: 'GO_HOME' })}>
                <Home />
                Go to Home
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
