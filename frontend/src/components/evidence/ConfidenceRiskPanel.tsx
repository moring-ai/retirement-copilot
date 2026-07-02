import { Gauge, ShieldAlert } from 'lucide-react'
import type { ConfidenceLevel } from '@/types'
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

/**
 * The headline agent judgement. Rendered as the first, highlighted, sticky
 * block of the evidence panel so it stays in view while the rest scrolls.
 */
export function ConfidenceRiskPanel({
  confidence,
  riskTags,
}: {
  confidence: ConfidenceLevel | null
  riskTags: string[]
}) {
  const style = confidence ? CONFIDENCE_STYLE[confidence] : null

  return (
    <div className="sticky top-0 z-10 -mx-4 border-b border-border bg-card/95 px-4 pb-3 pt-4 backdrop-blur">
      <div
        className={cn(
          'rounded-xl border p-3 shadow-soft',
          confidence
            ? 'border-brand/20 bg-gradient-to-br from-brand-soft/70 to-card'
            : 'border-border bg-background/60',
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-soft">
            <Gauge className="h-4 w-4 text-brand-dark" />
            Confidence &amp; Risk
          </div>
          <span
            className={cn(
              'text-sm font-bold tabular-nums',
              style ? style.text : 'text-muted-foreground',
            )}
          >
            {confidence ?? '—'}
          </span>
        </div>

        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-700 ease-out',
              style?.bar,
            )}
            style={{ width: `${style?.pct ?? 0}%` }}
          />
        </div>

        <div className="mt-3 flex items-start gap-1.5">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warn" />
          <div className="flex flex-wrap gap-1.5">
            {riskTags.length ? (
              riskTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={tag.toLowerCase().includes('low') ? 'default' : 'warn'}
                >
                  {tag}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">
                No risk flags yet
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
