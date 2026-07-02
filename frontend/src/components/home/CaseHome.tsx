import { useMemo, useState } from 'react'
import { Plus, Search, FolderOpen, ShieldCheck } from 'lucide-react'
import { useWorkspace } from '@/state/WorkspaceContext'
import { CURRENT_ASSOCIATE } from '@/data/cases'
import { CaseCard } from './CaseCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function CaseHome() {
  const { state, dispatch } = useWorkspace()
  const [query, setQuery] = useState('')
  // Stable "now" for this render pass so every relative time lines up.
  const now = useMemo(() => Date.now(), [state.cases])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = [...state.cases].sort(
      (a, b) => b.lastUpdatedAt - a.lastUpdatedAt,
    )
    if (!q) return list
    return list.filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q) ||
        c.customerId.toLowerCase().includes(q),
    )
  }, [state.cases, query])

  const mine = filtered.filter((c) => c.lastUpdatedBy === CURRENT_ASSOCIATE)

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
          <Button size="lg" onClick={() => dispatch({ type: 'NEW_CASE' })}>
            <Plus />
            New Case
          </Button>
        </div>

        {/* Stat strip */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Open cases" value={state.cases.length} />
          <StatTile label="Assigned to you" value={mine.length} />
          <StatTile
            label="Escalated"
            value={state.cases.filter((c) => c.stage === 'escalated').length}
            tone="warn"
          />
          <StatTile
            label="Submitted"
            value={state.cases.filter((c) => c.stage === 'submitted').length}
            tone="brand"
          />
        </div>

        {/* Search */}
        <div className="relative mt-6 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by case ID, customer name, or ID…"
            className="pl-9"
            aria-label="Search cases"
          />
        </div>

        {/* Case grid */}
        <div className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-secondary" />
            <h2 className="text-sm font-semibold text-ink">
              {query ? `Results (${filtered.length})` : 'All cases'}
            </h2>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center animate-fade-in">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Search className="h-6 w-6 text-muted-foreground" />
              </span>
              <div>
                <p className="text-sm font-medium text-ink">No cases found</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  No case matches “{query}”. Check the ID or start a new case.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => dispatch({ type: 'NEW_CASE' })}
              >
                <Plus />
                New Case
              </Button>
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
                    onOpen={(id) => dispatch({ type: 'OPEN_CASE', caseId: id })}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          Associate-facing · human-in-the-loop · mock data only
        </div>
      </div>
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
