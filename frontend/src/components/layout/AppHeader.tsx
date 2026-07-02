import { Save, FileDown, ShieldCheck, ArrowLeft, Clock3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { EvidenceDrawerToggle } from './EvidenceDrawerToggle'
import { StageBadge } from '@/components/home/StageBadge'
import { useWorkspace } from '@/state/WorkspaceContext'
import { CUSTOMERS } from '@/data/customers'
import { timeAgo } from '@/lib/utils'

export function AppHeader() {
  const { state, dispatch } = useWorkspace()
  const inWorkspace = state.view === 'workspace'
  const customer = CUSTOMERS[state.activeCustomerId]
  const activeCase = state.cases.find((c) => c.id === state.activeCaseId)

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
        {inWorkspace ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dispatch({ type: 'GO_HOME' })}
            className="shrink-0"
          >
            <ArrowLeft />
            <span className="hidden sm:inline">Cases</span>
          </Button>
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </span>
        )}

        <div className="min-w-0 leading-tight">
          <h1 className="truncate text-base font-semibold text-ink lg:text-lg">
            {inWorkspace ? customer.name : 'Retirement Case Workspace'}
          </h1>
          <p className="hidden truncate text-xs text-muted-foreground sm:block">
            {inWorkspace
              ? `${activeCase?.id ?? 'New case'} · ${customer.customer_id}`
              : 'Agent-assisted rollover servicing for internal associates'}
          </p>
        </div>

        {inWorkspace && (
          <div className="ml-auto flex items-center gap-2 lg:gap-3">
            {activeCase && (
              <div className="hidden items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 md:flex">
                <StageBadge stage={activeCase.stage} />
                <span className="h-3 w-px bg-border" />
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock3 className="h-3 w-3" />
                  {timeAgo(activeCase.lastUpdatedAt)} · {activeCase.lastUpdatedBy}
                </span>
              </div>
            )}

            <div className="hidden items-center gap-2 lg:flex">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  toast({
                    variant: 'info',
                    title: 'Case saved',
                    description: `${activeCase?.id ?? customer.customer_id} saved to your queue.`,
                  })
                }
              >
                <Save />
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  toast({
                    variant: 'info',
                    title: 'Summary exported',
                    description: 'Case summary prepared for download.',
                  })
                }
              >
                <FileDown />
                Export
              </Button>
            </div>

            <EvidenceDrawerToggle />
          </div>
        )}
      </div>
    </header>
  )
}
