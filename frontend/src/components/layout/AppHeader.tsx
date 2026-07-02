import { Save, FileDown, Send, Clock3, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { EvidenceDrawerToggle } from './EvidenceDrawerToggle'
import { CaseMenuToggle } from './CaseMenuToggle'
import { useWorkspace } from '@/state/WorkspaceContext'
import { CUSTOMERS } from '@/data/customers'

export function AppHeader() {
  const { state } = useWorkspace()
  const customer = CUSTOMERS[state.activeCustomerId]

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
        {/* Mobile: open case-step drawer */}
        <div className="lg:hidden">
          <CaseMenuToggle />
        </div>

        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <h1 className="text-base font-semibold text-ink lg:text-lg">
              Retirement Case Workspace
            </h1>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Agent-assisted rollover servicing for internal associates
            </p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 lg:gap-3">
          <div className="hidden items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 md:flex">
            <span className="text-xs text-muted-foreground">Case</span>
            <span className="text-xs font-semibold text-ink">
              {customer.customer_id}
            </span>
            <span className="h-3 w-px bg-border" />
            <Badge variant="warn">
              <Clock3 className="h-3 w-3" />
              In Review
            </Badge>
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast({
                  variant: 'info',
                  title: 'Case saved',
                  description: `${customer.customer_id} saved to your queue.`,
                })
              }
            >
              <Save />
              Save Case
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
              Export Summary
            </Button>
            <Button
              size="sm"
              onClick={() =>
                toast({
                  variant: 'success',
                  title: 'Submitted for review',
                  description: 'Sent to a retirement servicing reviewer.',
                })
              }
            >
              <Send />
              Submit for Review
            </Button>
          </div>

          {/* Tablet/mobile: evidence panel drawer */}
          <EvidenceDrawerToggle />
        </div>
      </div>
    </header>
  )
}
