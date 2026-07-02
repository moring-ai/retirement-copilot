import { PanelRightOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { AgentEvidencePanel } from '@/components/evidence/AgentEvidencePanel'
import { useWorkspace } from '@/state/WorkspaceContext'

export function EvidenceDrawerToggle() {
  const { state } = useWorkspace()
  const count = state.evidence.timeline.length

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative xl:hidden"
          aria-label="Open agent evidence panel"
        >
          <PanelRightOpen />
          <span className="hidden sm:inline">Evidence</span>
          {count > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-semibold text-secondary-foreground">
              {count}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full p-0 sm:max-w-md">
        <SheetHeader className="sr-only">
          <SheetTitle>Agent Evidence</SheetTitle>
        </SheetHeader>
        <AgentEvidencePanel />
      </SheetContent>
    </Sheet>
  )
}
