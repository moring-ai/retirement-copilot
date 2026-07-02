import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { CaseStepSidebar } from '@/components/sidebar/CaseStepSidebar'
import { useWorkspace } from '@/state/WorkspaceContext'

/**
 * Mobile/tablet trigger that opens the case-step navigation in a left drawer.
 * Closes automatically when a step is selected so navigation feels immediate.
 */
export function CaseMenuToggle() {
  const [open, setOpen] = useState(false)
  const { state } = useWorkspace()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open case navigation">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader>
          <SheetTitle>Case Navigation</SheetTitle>
        </SheetHeader>
        {/* Selecting a step updates activeStep; close the drawer on change. */}
        <div onClick={() => setOpen(false)} key={state.activeStep}>
          <CaseStepSidebar />
        </div>
      </SheetContent>
    </Sheet>
  )
}
