import { WorkspaceProvider } from '@/state/WorkspaceContext'
import { DemoProvider } from '@/state/DemoContext'
import { AppHeader } from '@/components/layout/AppHeader'
import { AppShell } from '@/components/layout/AppShell'
import { CaseOutcomeDialog } from '@/components/layout/CaseOutcomeDialog'
import { RunWorkspace } from '@/components/demo/RunWorkspace'

/** The associate console. The demo-scenario experience (launcher + right-docked
 *  Agent panel) is layered on top via DemoProvider. */
export function AssociateApp() {
  return (
    <DemoProvider>
      <WorkspaceProvider>
        <div className="flex h-screen flex-col overflow-hidden bg-background">
          <AppHeader />
          <AppShell />
        </div>
        <CaseOutcomeDialog />
        {/* Full-screen case overlay: the agent works the request when opened,
            branching into the Path A or Path B experience. Inside
            WorkspaceProvider so it can update the case in the queue. */}
        <RunWorkspace />
      </WorkspaceProvider>
    </DemoProvider>
  )
}
