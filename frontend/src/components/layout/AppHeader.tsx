import { Save, FileDown, ArrowLeft, Clock3 } from 'lucide-react'
import { FidelityMark } from '@/components/brand/FidelityLogo'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { NotificationsMenu } from './NotificationsMenu'
import { ProfileMenu } from './ProfileMenu'
import { StageBadge } from '@/components/home/StageBadge'
import { useWorkspace } from '@/state/WorkspaceContext'
import { CUSTOMERS } from '@/data/customers'
import { timeAgo } from '@/lib/utils'

export function AppHeader() {
  const { state, dispatch } = useWorkspace()
  const inWorkspace = state.view === 'workspace'
  const customer = CUSTOMERS[state.activeCustomerId]
  const customerName = customer?.name ?? 'Customer'
  const customerIdLabel = customer?.customer_id ?? state.activeCustomerId ?? '—'
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
          <FidelityMark size={38} className="shrink-0" />
        )}

        <div className="min-w-0 leading-tight">
          <h1 className="truncate text-base font-semibold text-ink lg:text-lg">
            {inWorkspace ? (
              customerName
            ) : (
              <span>
                <span className="font-serif italic font-semibold text-brand">
                  Fidelity
                </span>{' '}
                <span className="text-ink">Retirement</span>
              </span>
            )}
          </h1>
          <p className="hidden truncate text-xs text-muted-foreground sm:block">
            {inWorkspace
              ? `${activeCase?.id ?? 'New case'} · ${customerIdLabel}`
              : 'Agent-assisted rollover servicing for internal associates'}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2 lg:gap-3">
          {inWorkspace && (
            <>
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
                      description: `${activeCase?.id ?? customerIdLabel} saved to your queue.`,
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

              <span className="mx-1 hidden h-6 w-px bg-border lg:block" />
            </>
          )}

          <NotificationsMenu />
          <ProfileMenu />
        </div>
      </div>
    </header>
  )
}
