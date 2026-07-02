import { ClipboardList, CheckCircle2, CircleAlert } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function MissingInformationCard({
  items,
  hasRun,
}: {
  items: string[]
  hasRun: boolean
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Missing Information</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasRun ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ClipboardList className="h-4 w-4" />
            Run "Find Required Forms" to surface outstanding items.
          </div>
        ) : items.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-brand-dark">
            <CheckCircle2 className="h-4 w-4" />
            All required information is on file.
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2.5 rounded-lg border border-warn/20 bg-warn-soft px-3 py-2"
              >
                <CircleAlert className="h-4 w-4 shrink-0 text-warn" />
                <span className="text-sm font-medium text-ink">{item}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
