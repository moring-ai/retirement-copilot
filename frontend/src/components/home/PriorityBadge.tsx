import { ChevronsUp, ChevronUp, Minus, type LucideIcon } from 'lucide-react'
import type { CasePriority } from '@/types'
import { Badge, type BadgeProps } from '@/components/ui/badge'

const META: Record<
  CasePriority,
  { label: string; variant: BadgeProps['variant']; icon: LucideIcon }
> = {
  high: { label: 'High', variant: 'danger', icon: ChevronsUp },
  medium: { label: 'Medium', variant: 'warn', icon: ChevronUp },
  low: { label: 'Low', variant: 'neutral', icon: Minus },
}

export function PriorityBadge({ priority }: { priority: CasePriority }) {
  const meta = META[priority]
  const Icon = meta.icon
  return (
    <Badge variant={meta.variant}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </Badge>
  )
}
