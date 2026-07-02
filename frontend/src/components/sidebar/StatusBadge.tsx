import {
  CheckCircle2,
  CircleDashed,
  Loader2,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react'
import type { StepStatus } from '@/types'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatusMeta {
  label: string
  variant: BadgeProps['variant']
  icon: LucideIcon
  spin?: boolean
}

export const STATUS_META: Record<StepStatus, StatusMeta> = {
  complete: { label: 'Complete', variant: 'default', icon: CheckCircle2 },
  in_progress: {
    label: 'In Progress',
    variant: 'blue',
    icon: Loader2,
    spin: true,
  },
  needs_info: { label: 'Needs Info', variant: 'warn', icon: AlertCircle },
  pending: { label: 'Pending', variant: 'neutral', icon: CircleDashed },
}

export function StatusBadge({
  status,
  className,
}: {
  status: StepStatus
  className?: string
}) {
  const meta = STATUS_META[status]
  const Icon = meta.icon
  return (
    <Badge variant={meta.variant} className={className}>
      <Icon className={cn('h-3 w-3', meta.spin && 'animate-spin')} />
      {meta.label}
    </Badge>
  )
}
