import { CheckCircle2, XCircle, Terminal } from 'lucide-react'
import type { ToolCalled } from '@/types'
import { cn } from '@/lib/utils'

export function ToolCallRow({ call }: { call: ToolCalled }) {
  const ok = call.status === 'ok'
  return (
    <li className="flex items-start gap-2 rounded-md border border-border bg-background/60 px-2.5 py-2">
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
      <span
        className={cn(
          'flex items-center gap-1 text-[11px] font-medium',
          ok ? 'text-brand' : 'text-danger',
        )}
      >
        {ok ? (
          <CheckCircle2 className="h-3.5 w-3.5" />
        ) : (
          <XCircle className="h-3.5 w-3.5" />
        )}
        {call.status}
      </span>
    </li>
  )
}
