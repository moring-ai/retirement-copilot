import {
  PenLine,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  PauseCircle,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import type { CaseStage } from '@/types'
import { Badge, type BadgeProps } from '@/components/ui/badge'

const STAGE_META: Record<
  CaseStage,
  { label: string; variant: BadgeProps['variant']; icon: LucideIcon }
> = {
  draft: { label: 'Draft', variant: 'neutral', icon: PenLine },
  in_review: { label: 'In Review', variant: 'blue', icon: Clock3 },
  submitted: { label: 'Approved', variant: 'default', icon: CheckCircle2 },
  escalated: { label: 'Escalated', variant: 'warn', icon: AlertTriangle },
  pending: { label: 'Pending', variant: 'warn', icon: PauseCircle },
  rejected: { label: 'Rejected', variant: 'danger', icon: XCircle },
}

export function StageBadge({ stage }: { stage: CaseStage }) {
  const meta = STAGE_META[stage]
  const Icon = meta.icon
  return (
    <Badge variant={meta.variant}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </Badge>
  )
}
