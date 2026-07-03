import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * In-content, scenario-specific confirmation card. Replaces the old sticky
 * action bar: each step renders one of these (text + accent tuned to the
 * outcome) with its primary action(s) inside.
 */
export function StepConfirm({
  tone = 'success',
  icon: Icon,
  title,
  description,
  children,
  actions,
}: {
  tone?: 'success' | 'warn' | 'danger' | 'info'
  icon: LucideIcon
  title: string
  description: ReactNode
  /** Optional extra content (lists, checkboxes) between text and actions. */
  children?: ReactNode
  actions?: ReactNode
}) {
  const accent = {
    success: 'border-l-brand',
    warn: 'border-l-warn',
    danger: 'border-l-danger',
    info: 'border-l-secondary',
  }[tone]
  const iconWrap = {
    success: 'bg-brand-soft text-brand-dark',
    warn: 'bg-warn-soft text-warn',
    danger: 'bg-danger-soft text-danger',
    info: 'bg-accent text-secondary',
  }[tone]

  return (
    <Card className={cn('border-l-4 animate-fade-in', accent)}>
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
              iconWrap,
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">{title}</p>
            <div className="mt-1 text-sm text-ink-soft">{description}</div>
            {children}
            {actions && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {actions}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
