import { Check, X, Terminal, CircleCheck, Ban } from 'lucide-react'
import type { ToolCalled } from '@/types'
import { cn } from '@/lib/utils'

export function ToolCallRow({
  call,
  onApprove,
  onDeny,
}: {
  call: ToolCalled
  onApprove: (tool: string) => void
  onDeny: (tool: string) => void
}) {
  const pending = call.approval === 'pending'
  const denied = call.approval === 'denied'

  return (
    <li
      className={cn(
        'animate-fade-in rounded-md border px-2.5 py-2 transition-colors',
        pending
          ? 'border-warn/30 bg-warn-soft/50'
          : denied
            ? 'border-danger/20 bg-danger-soft/40'
            : 'border-border bg-background/60',
      )}
    >
      <div className="flex items-start gap-2">
        <Terminal className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <code className="block truncate text-xs font-medium text-ink">
            {call.tool}()
          </code>
          {call.detail && (
            <span className="text-[11px] text-muted-foreground">
              {call.detail}
            </span>
          )}
        </div>
        {call.approval === 'approved' && (
          <span className="flex items-center gap-1 text-[11px] font-medium text-brand">
            <CircleCheck className="h-3.5 w-3.5" />
            Approved
          </span>
        )}
        {denied && (
          <span className="flex items-center gap-1 text-[11px] font-medium text-danger">
            <Ban className="h-3.5 w-3.5" />
            Denied
          </span>
        )}
      </div>

      {pending && (
        <div className="mt-2 flex items-center gap-2">
          <span className="mr-auto text-[11px] font-medium text-warn">
            Awaiting your approval
          </span>
          <button
            type="button"
            onClick={() => onDeny(call.tool)}
            className="flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[11px] font-medium text-ink-soft transition-colors hover:bg-muted"
          >
            <X className="h-3 w-3" />
            Deny
          </button>
          <button
            type="button"
            onClick={() => onApprove(call.tool)}
            className="flex items-center gap-1 rounded-md bg-brand px-2 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            <Check className="h-3 w-3" />
            Approve
          </button>
        </div>
      )}
    </li>
  )
}
