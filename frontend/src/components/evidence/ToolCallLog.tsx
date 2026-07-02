import { Wrench, ChevronDown, ShieldCheck, HandHelping } from 'lucide-react'
import type { ToolApprovalMode } from '@/types'
import { useWorkspace } from '@/state/WorkspaceContext'
import { SectionHeading } from './SectionHeading'
import { ToolCallRow } from './ToolCallRow'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

const MODE_LABEL: Record<ToolApprovalMode, string> = {
  ask_every_time: 'Ask every time',
  full_control: 'Full control',
}

export function ToolCallLog() {
  const { state, dispatch } = useWorkspace()
  const calls = state.evidence.toolCalls
  const mode = state.toolApprovalMode
  const pending = calls.filter((c) => c.approval === 'pending')

  return (
    <section>
      <div className="flex items-center justify-between">
        <SectionHeading icon={Wrench} title="Tool Calls" count={calls.length} />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[11px] font-medium text-ink-soft transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {mode === 'full_control' ? (
              <ShieldCheck className="h-3.5 w-3.5 text-brand" />
            ) : (
              <HandHelping className="h-3.5 w-3.5 text-secondary" />
            )}
            {MODE_LABEL[mode]}
            <ChevronDown className="h-3 w-3 opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Tool approval</DropdownMenuLabel>
            <DropdownMenuItem
              selected={mode === 'ask_every_time'}
              onSelect={() =>
                dispatch({
                  type: 'SET_TOOL_APPROVAL_MODE',
                  mode: 'ask_every_time',
                })
              }
            >
              <span className="font-medium text-ink">Ask every time</span>
              <span className="mt-0.5 block text-[11px] text-muted-foreground">
                Approve each tool call before the agent uses its result.
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              selected={mode === 'full_control'}
              onSelect={() =>
                dispatch({ type: 'SET_TOOL_APPROVAL_MODE', mode: 'full_control' })
              }
            >
              <span className="font-medium text-ink">Full control</span>
              <span className="mt-0.5 block text-[11px] text-muted-foreground">
                Let the agent run all read-only tools automatically.
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {mode === 'ask_every_time' && pending.length > 0 && (
        <button
          type="button"
          onClick={() => dispatch({ type: 'APPROVE_ALL_TOOLS' })}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-brand/30 bg-brand-soft px-2 py-1.5 text-[11px] font-semibold text-brand-dark transition-colors hover:bg-brand-soft/70"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Approve all {pending.length} pending call{pending.length > 1 ? 's' : ''}
        </button>
      )}

      <ul className="mt-3 space-y-1.5">
        {calls.map((call) => (
          <ToolCallRow
            key={call.tool}
            call={call}
            onApprove={(tool) => dispatch({ type: 'APPROVE_TOOL', tool })}
            onDeny={(tool) => dispatch({ type: 'DENY_TOOL', tool })}
          />
        ))}
      </ul>
    </section>
  )
}
