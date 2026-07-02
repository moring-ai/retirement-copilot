import type { LucideIcon } from 'lucide-react'
import type { StepId, StepStatus } from '@/types'
import { STATUS_META } from './StatusBadge'
import { cn } from '@/lib/utils'

interface CaseStepItemProps {
  step: StepId
  index: number
  label: string
  status: StepStatus
  icon: LucideIcon
  active: boolean
  onSelect: (step: StepId) => void
}

const STATUS_ACCENT: Record<StepStatus, string> = {
  complete: 'text-brand',
  in_progress: 'text-secondary',
  needs_info: 'text-warn',
  pending: 'text-muted-foreground',
}

export function CaseStepItem({
  step,
  index,
  label,
  status,
  icon: Icon,
  active,
  onSelect,
}: CaseStepItemProps) {
  const meta = STATUS_META[status]
  const StatusIcon = meta.icon
  return (
    <button
      type="button"
      onClick={() => onSelect(step)}
      aria-current={active ? 'step' : undefined}
      className={cn(
        'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
        active
          ? 'bg-brand-soft ring-1 ring-brand/20'
          : 'hover:bg-muted',
      )}
    >
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-card',
          active ? 'border-brand/30' : 'border-border',
        )}
      >
        <Icon
          className={cn(
            'h-4 w-4',
            active ? 'text-brand-dark' : 'text-ink-soft',
          )}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-muted-foreground">
            Step {index + 1}
          </span>
          <StatusIcon
            className={cn(
              'h-3 w-3',
              STATUS_ACCENT[status],
              meta.spin && 'animate-spin',
            )}
          />
        </span>
        <span
          className={cn(
            'block truncate text-sm font-medium',
            active ? 'text-ink' : 'text-ink-soft',
          )}
        >
          {label}
        </span>
      </span>
    </button>
  )
}
