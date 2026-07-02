import { CaseStepSidebar } from '@/components/sidebar/CaseStepSidebar'
import { AgentEvidencePanel } from '@/components/evidence/AgentEvidencePanel'
import { StepPanel } from '@/components/steps/StepPanel'
import { AssociateReviewQueue } from '@/components/review-queue/AssociateReviewQueue'

export function AppShell() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1">
        {/* Left: case step navigation (desktop) */}
        <aside className="hidden w-[280px] shrink-0 border-r border-border bg-card lg:block">
          <div className="scrollbar-slim h-full overflow-y-auto">
            <CaseStepSidebar />
          </div>
        </aside>

        {/* Center: guided case workspace */}
        <main className="scrollbar-slim min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-4xl px-4 py-6 lg:px-8">
            <StepPanel />
          </div>
        </main>

        {/* Right: agent evidence panel (wide desktop) */}
        <aside className="hidden w-[360px] shrink-0 border-l border-border bg-card xl:block">
          <AgentEvidencePanel />
        </aside>
      </div>

      {/* Bottom: associate review queue (always visible) */}
      <AssociateReviewQueue />
    </div>
  )
}
