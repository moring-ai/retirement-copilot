import { WorkspaceProvider } from '@/state/WorkspaceContext'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toaster'
import { AppHeader } from '@/components/layout/AppHeader'
import { AppShell } from '@/components/layout/AppShell'

export default function App() {
  return (
    <WorkspaceProvider>
      <TooltipProvider delayDuration={200}>
        <div className="flex h-screen flex-col overflow-hidden bg-background">
          <AppHeader />
          <AppShell />
        </div>
        <Toaster />
      </TooltipProvider>
    </WorkspaceProvider>
  )
}
