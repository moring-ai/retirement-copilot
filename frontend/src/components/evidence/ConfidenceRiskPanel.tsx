import { Gauge, ShieldAlert, AlertTriangle } from 'lucide-react'
import type { ConfidenceLevel } from '@/types'
import { SectionHeading } from './SectionHeading'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const CONFIDENCE_STYLE: Record<
  ConfidenceLevel,
  { bar: string; text: string; pct: number }
> = {
  High: { bar: 'bg-brand', text: 'text-brand-dark', pct: 90 },
  Medium: { bar: 'bg-warn', text: 'text-warn', pct: 60 },
  Low: { bar: 'bg-danger', text: 'text-danger', pct: 30 },
}

export function ConfidenceRiskPanel({
  confidence,
  riskTags,
  complianceWarnings,
}: {
  confidence: ConfidenceLevel | null
  riskTags: string[]
  complianceWarnings: string[]
}) {
  const style = confidence ? CONFIDENCE_STYLE[confidence] : null

  return (
    <section>
      <SectionHeading icon={Gauge} title="Confidence & Risk" />
      <div className="mt-3 space-y-3">
        <div className="rounded-lg border border-border bg-background/60 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Agent confidence
            </span>
            <span
              className={cn(
                'text-sm font-semibold',
                style ? style.text : 'text-muted-foreground',
              )}
            >
              {confidence ?? '—'}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                style?.bar,
              )}
              style={{ width: `${style?.pct ?? 0}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-ink-soft">
            <ShieldAlert className="h-3.5 w-3.5 text-warn" />
            Risk tags
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {riskTags.length ? (
              riskTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={
                    tag.toLowerCase().includes('low') ? 'default' : 'warn'
                  }
                >
                  {tag}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">
                None identified yet
              </span>
            )}
          </div>
        </div>

        {complianceWarnings.length > 0 && (
          <div className="rounded-lg border border-warn/20 bg-warn-soft p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-warn">
              <AlertTriangle className="h-3.5 w-3.5" />
              Compliance warnings
            </div>
            <ul className="mt-2 space-y-1.5">
              {complianceWarnings.map((w) => (
                <li key={w} className="text-xs leading-relaxed text-ink-soft">
                  • {w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
