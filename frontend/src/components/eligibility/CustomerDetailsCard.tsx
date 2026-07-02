import {
  CalendarDays,
  Briefcase,
  Landmark,
  Target,
  Medal,
  ArrowRight,
} from 'lucide-react'
import type { Customer } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="h-4 w-4 text-ink-soft" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-sm font-medium text-ink">{value}</p>
      </div>
    </div>
  )
}

export function CustomerDetailsCard({ customer }: { customer: Customer }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-base font-semibold text-brand-dark">
              {customer.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </span>
            <div>
              <h3 className="text-base font-semibold text-ink">
                {customer.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {customer.customer_id} · {customer.state}
              </p>
            </div>
          </div>
          {customer.veteran_status.toLowerCase().includes('veteran') &&
            !customer.veteran_status.toLowerCase().includes('not') && (
              <Badge variant="blue">
                <Medal className="h-3 w-3" />
                {customer.veteran_status}
              </Badge>
            )}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DetailItem
            icon={CalendarDays}
            label="Age"
            value={`${customer.age}`}
          />
          <DetailItem
            icon={Briefcase}
            label="Employment"
            value={customer.employment_status}
          />
          <DetailItem
            icon={Landmark}
            label="Current account"
            value={`${customer.source_plan.description} (${customer.source_plan.plan_provider})`}
          />
          <DetailItem
            icon={Target}
            label="Destination account"
            value={customer.destination_account}
          />
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-background/60 p-3">
          <Target className="h-4 w-4 shrink-0 text-secondary" />
          <p className="text-sm text-ink-soft">
            <span className="font-medium text-ink">Goal:</span>{' '}
            {customer.rollover_goal}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-md bg-muted px-2 py-1 font-medium text-ink-soft">
            {customer.source_plan.plan_type}
          </span>
          <ArrowRight className="h-3.5 w-3.5" />
          <span className="rounded-md bg-brand-soft px-2 py-1 font-medium text-brand-dark">
            {customer.destination_account}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
