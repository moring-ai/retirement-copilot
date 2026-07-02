import { ChevronsUpDown, Check } from 'lucide-react'
import type { ScenarioTone } from '@/types'
import { useWorkspace } from '@/state/WorkspaceContext'
import { CUSTOMER_LIST, CUSTOMERS } from '@/data/customers'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

const TONE_DOT: Record<ScenarioTone, string> = {
  positive: 'bg-brand',
  caution: 'bg-warn',
  critical: 'bg-danger',
}

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
}

export function CaseSwitcher() {
  const { state, dispatch } = useWorkspace()
  const active = CUSTOMERS[state.activeCustomerId]

  const select = (id: string) => {
    if (id === state.activeCustomerId) return
    dispatch({ type: 'SET_CUSTOMER', customerId: id })
    const c = CUSTOMERS[id]
    toast({
      variant: 'info',
      title: `Switched to ${c.name}`,
      description: `${c.customer_id} · ${c.scenarioLabel} — case reset for a fresh run.`,
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Switch demo customer"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-soft text-[11px] font-semibold text-brand-dark">
            {initials(active.name)}
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-ink">
                {active.name}
              </span>
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  TONE_DOT[active.scenarioTone],
                )}
              />
            </span>
            <span className="text-[11px] text-muted-foreground">
              {active.customer_id} · {active.scenarioLabel}
            </span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[300px]">
        <DropdownMenuLabel>Demo customers</DropdownMenuLabel>
        {CUSTOMER_LIST.map((c) => {
          const isActive = c.customer_id === state.activeCustomerId
          return (
            <DropdownMenuItem
              key={c.customer_id}
              onSelect={() => select(c.customer_id)}
              className="gap-2.5 py-2"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-semibold text-ink-soft">
                {initials(c.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink">
                  {c.name}
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      TONE_DOT[c.scenarioTone],
                    )}
                  />
                  {c.customer_id} · {c.scenarioLabel}
                </span>
              </span>
              {isActive && (
                <Check className="h-4 w-4 shrink-0 text-brand" />
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
