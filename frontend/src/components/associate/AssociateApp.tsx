import { WorkspaceProvider } from '@/state/WorkspaceContext'
import { AppHeader } from '@/components/layout/AppHeader'
import { AppShell } from '@/components/layout/AppShell'
import { CaseOutcomeDialog } from '@/components/layout/CaseOutcomeDialog'

/** The associate console (the existing feat/new-ui workspace), wrapped so it can
 *  be selected per-tab alongside the customer experience. */
export function AssociateApp() {
  return (
    <WorkspaceProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <AppHeader />
        <AppShell />
      </div>
      <CaseOutcomeDialog />
    </WorkspaceProvider>
  )
}
