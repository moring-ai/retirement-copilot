import { useWorkspace } from '@/state/WorkspaceContext'
import { CaseHome } from '@/components/home/CaseHome'
import { WorkflowStepper } from '@/components/layout/WorkflowStepper'
import { AgentIsland } from '@/components/layout/AgentIsland'
import { ConfidenceShelf } from '@/components/layout/ConfidenceShelf'
import { StepPanel } from '@/components/steps/StepPanel'

export function AppShell() {
  const { state } = useWorkspace()

  if (state.view === 'home') {
    return (
      <div className="min-h-0 flex-1">
        <CaseHome />
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Case workflow progress — always visible below the navbar */}
      <WorkflowStepper />

      <main className="scrollbar-slim min-h-0 flex-1 overflow-y-auto">
        {/* extra bottom padding so content clears the floating agent island */}
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 pb-28 pt-6 lg:px-8">
          <StepPanel />
        </div>
      </main>

      {/* Constant confidence & risk shelf (after eligibility) */}
      <ConfidenceShelf />

      {/* Floating dynamic-island agent bar */}
      <AgentIsland />
    </div>
  )
}
