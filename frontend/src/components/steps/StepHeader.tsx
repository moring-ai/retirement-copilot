import type { ReactNode } from 'react'
import type { StepStatus } from '@/types'
import { StatusBadge } from '@/components/sidebar/StatusBadge'

export function StepHeader({
  eyebrow,
  title,
  description,
  status,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  status: StepStatus
  children?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {eyebrow}
        </p>
        <h2 className="mt-0.5 text-xl font-semibold text-ink">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {children}
        <StatusBadge status={status} />
      </div>
    </div>
  )
}
