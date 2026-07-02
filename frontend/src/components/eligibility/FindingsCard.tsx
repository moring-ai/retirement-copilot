import { Database } from 'lucide-react'
import type { Finding } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const TONE: Record<NonNullable<Finding['tone']>, string> = {
  positive: 'text-brand-dark',
  neutral: 'text-ink',
  warning: 'text-warn',
}

export function FindingsCard({ findings }: { findings: Finding[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-secondary" />
          <CardTitle className="normal-case tracking-normal text-ink">
            Case Findings
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">
          Live customer-system data pulled by the agent's MCP tools.
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <tbody>
              {findings.map((f, i) => (
                <tr
                  key={f.label}
                  className={cn(
                    i !== findings.length - 1 && 'border-b border-border',
                  )}
                >
                  <td className="w-1/2 px-3 py-2.5 text-ink-soft">{f.label}</td>
                  <td
                    className={cn(
                      'px-3 py-2.5 font-medium',
                      TONE[f.tone ?? 'neutral'],
                    )}
                  >
                    {f.value}
                  </td>
                  <td className="hidden px-3 py-2.5 text-right sm:table-cell">
                    <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                      {f.source}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
