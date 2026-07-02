import { Route, HelpCircle, ShieldCheck } from 'lucide-react'
import type { RolloverPath } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function RolloverPathCard({ path }: { path: RolloverPath | null }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Rollover Path</CardTitle>
      </CardHeader>
      <CardContent>
        {!path ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <HelpCircle className="h-4 w-4" />
            The recommended rollover path appears after the eligibility check.
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2">
              <Route className="h-4 w-4 text-secondary" />
              <span className="text-sm font-semibold text-ink">
                {path.recommended}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {path.detail}
            </p>
            {path.avoids.length > 0 && (
              <div className="mt-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Avoids
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {path.avoids.map((a) => (
                    <Badge key={a} variant="default">
                      <ShieldCheck className="h-3 w-3" />
                      {a}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
