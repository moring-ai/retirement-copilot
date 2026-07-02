import { ShieldCheck, ShieldAlert, HelpCircle } from 'lucide-react'
import type { EligibilityResult } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function EligibilityResultCard({
  result,
}: {
  result: EligibilityResult | null
}) {
  return (
    <Card className={cn(result && result.eligible && 'border-l-4 border-l-brand')}>
      <CardHeader className="pb-2">
        <CardTitle>Eligibility Result</CardTitle>
      </CardHeader>
      <CardContent>
        {!result ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <HelpCircle className="h-4 w-4" />
            Run the eligibility check to populate this result.
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <span
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                result.eligible
                  ? 'bg-brand-soft text-brand-dark'
                  : 'bg-warn-soft text-warn',
              )}
            >
              {result.eligible ? (
                <ShieldCheck className="h-5 w-5" />
              ) : (
                <ShieldAlert className="h-5 w-5" />
              )}
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">
                {result.headline}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                {result.summary}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
