import { useMemo, useState } from 'react'
import {
  Plus,
  Search,
  ShieldCheck,
  ChevronDown,
  SlidersHorizontal,
} from 'lucide-react'
import type { CasePriority, CaseStage, CaseSummary } from '@/types'
import { useWorkspace } from '@/state/WorkspaceContext'
import { useDemo } from '@/state/DemoContext'
import { getScenarioByCaseId } from '@/data/demo-scenarios'
import { CURRENT_ASSOCIATE } from '@/data/associates'
import { CaseCard } from './CaseCard'
import { NewCaseDialog } from './NewCaseDialog'
import { TransferCaseDialog } from './TransferCaseDialog'
import { TransferRequests } from './TransferRequests'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

type HomeTab = 'all' | 'attention' | 'pending' | 'in_review' | 'finished' | 'transfers'
type PriorityFilter = 'all' | CasePriority

const PRIORITY_RANK: Record<CasePriority, number> = { high: 0, medium: 1, low: 2 }

const needsAttention = (c: CaseSummary) =>
  c.assignee === CURRENT_ASSOCIATE &&
  c.stage !== 'submitted' &&
  (c.priority === 'high' || c.stage === 'escalated')

const stageIn = (c: CaseSummary, stages: CaseStage[]) => stages.includes(c.stage)

export function CaseHome() {
  const { state, dispatch } = useWorkspace()
  const demo = useDemo()
  const [query, setQuery] = useState('')

  // Opening a case hands it to the agent-assisted workspace.
  const openCase = (id: string) => {
    const scenario = getScenarioByCaseId(id)
    if (scenario) demo.start(scenario.id)
    else dispatch({ type: 'OPEN_CASE', caseId: id })
  }
  const [newCaseOpen, setNewCaseOpen] = useState(false)
  const [transferTarget, setTransferTarget] = useState<CaseSummary | null>(null)
  const [tab, setTab] = useState<HomeTab>('all')
  const [priority, setPriority] = useState<PriorityFilter>('all')
  const now = useMemo(() => Date.now(), [state.cases, state.transferRequests])

  const incomingPending = state.transferRequests.filter(
    (r) => r.toAssociate === CURRENT_ASSOCIATE && r.status === 'pending',
  ).length

  const counts = useMemo(
    () => ({
      all: state.cases.length,
      attention: state.cases.filter(needsAttention).length,
      pending: state.cases.filter((c) => c.stage === 'draft' || c.stage === 'pending')
        .length,
      in_review: state.cases.filter((c) => stageIn(c, ['in_review', 'escalated']))
        .length,
      finished: state.cases.filter((c) => c.stage === 'submitted').length,
      transfers: incomingPending,
    }),
    [state.cases, incomingPending],
  )

  const filtered = useMemo(() => {
    let list = [...state.cases]
    if (tab === 'attention') list = list.filter(needsAttention)
    else if (tab === 'pending')
      list = list.filter((c) => c.stage === 'draft' || c.stage === 'pending')
    else if (tab === 'in_review')
      list = list.filter((c) => stageIn(c, ['in_review', 'escalated']))
    else if (tab === 'finished') list = list.filter((c) => c.stage === 'submitted')

    if (priority !== 'all') list = list.filter((c) => c.priority === priority)

    const q = query.trim().toLowerCase()
    if (q)
      list = list.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.customerName.toLowerCase().includes(q) ||
          c.customerId.toLowerCase().includes(q),
      )

    return list.sort((a, b) => {
      if (tab === 'attention' && a.priority !== b.priority)
        return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
      return b.lastUpdatedAt - a.lastUpdatedAt
    })
  }, [state.cases, tab, priority, query])

  const TABS: { id: HomeTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'attention', label: 'Needs Attention' },
    { id: 'pending', label: 'Pending' },
    { id: 'in_review', label: 'In Review' },
    { id: 'finished', label: 'Finished' },
    { id: 'transfers', label: 'Transfers' },
  ]

  return (
    <div className="scrollbar-slim h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 lg:px-8">
        {/* Greeting + new case */}
        <div className="flex flex-wrap items-end justify-between gap-4 animate-fade-in">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Retirement Case Workspace
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-ink">
              Welcome back, {CURRENT_ASSOCIATE.split(' ')[0]}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick up an open case or start a new rollover servicing case.
            </p>
          </div>
          <Button size="lg" onClick={() => setNewCaseOpen(true)}>
            <Plus />
            New Case
          </Button>
        </div>

        {/* Stat strip */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Open cases" value={counts.all} />
          <StatTile label="Needs attention" value={counts.attention} tone="warn" />
          <StatTile label="Transfers" value={counts.transfers} tone="brand" />
          <StatTile
            label="Assigned to you"
            value={state.cases.filter((c) => c.assignee === CURRENT_ASSOCIATE).length}
          />
        </div>

        {/* Tabs */}
        <div className="scrollbar-slim mt-6 flex gap-1 overflow-x-auto border-b border-border">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'relative flex shrink-0 items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors',
                tab === t.id
                  ? 'text-brand-dark'
                  : 'text-muted-foreground hover:text-ink',
              )}
            >
              {t.label}
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                  t.id === 'transfers' && counts.transfers > 0
                    ? 'bg-danger-soft text-danger'
                    : 'bg-muted text-ink-soft',
                )}
              >
                {counts[t.id]}
              </span>
              {tab === t.id && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand" />
              )}
            </button>
          ))}
        </div>

        {tab === 'transfers' ? (
          <div className="mt-6">
            <TransferRequests now={now} />
          </div>
        ) : (
          <>
            {/* Search + priority filter */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="relative min-w-[220px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by case ID, customer name, or ID…"
                  className="pl-9"
                  aria-label="Search cases"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <SlidersHorizontal className="h-4 w-4 text-secondary" />
                  {priority === 'all' ? 'All priorities' : `${priority[0].toUpperCase()}${priority.slice(1)} priority`}
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter by priority</DropdownMenuLabel>
                  {(['all', 'high', 'medium', 'low'] as PriorityFilter[]).map((p) => (
                    <DropdownMenuItem
                      key={p}
                      selected={priority === p}
                      onSelect={() => setPriority(p)}
                    >
                      <span className="capitalize">
                        {p === 'all' ? 'All priorities' : p}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Case grid */}
            <div className="mt-5">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center animate-fade-in">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Search className="h-6 w-6 text-muted-foreground" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink">No cases here</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {query
                        ? `No case matches “${query}”.`
                        : 'Nothing in this view right now.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((c, i) => (
                    <div
                      key={c.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                    >
                      <CaseCard
                        summary={c}
                        now={now}
                        onOpen={openCase}
                        onTransfer={(s) => setTransferTarget(s)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <div className="mt-8 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          Associate-facing · human-in-the-loop · every action reviewed before it’s sent
        </div>
      </div>

      <NewCaseDialog open={newCaseOpen} onOpenChange={setNewCaseOpen} />
      <TransferCaseDialog
        summary={transferTarget}
        onOpenChange={(open) => !open && setTransferTarget(null)}
      />
    </div>
  )
}

function StatTile({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: number
  tone?: 'default' | 'warn' | 'brand'
}) {
  const toneClass =
    tone === 'warn'
      ? 'text-warn'
      : tone === 'brand'
        ? 'text-brand-dark'
        : 'text-ink'
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-card">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${toneClass}`}>
        {value}
      </p>
    </div>
  )
}
