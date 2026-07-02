import { Lightbulb, HelpCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function RecommendedActionCard({ text }: { text: string | null }) {
  return (
    <Card className={text ? 'border-l-4 border-l-secondary' : undefined}>
      <CardHeader className="pb-2">
        <CardTitle>Recommended Next Action</CardTitle>
      </CardHeader>
      <CardContent>
        {!text ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <HelpCircle className="h-4 w-4" />
            The agent's recommended next action will appear here.
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Lightbulb className="h-4 w-4" />
            </span>
            <p className="text-sm leading-relaxed text-ink">{text}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
