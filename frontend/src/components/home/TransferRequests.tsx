import {
  ArrowLeftRight,
  Check,
  X,
  Inbox,
  SendHorizonal,
  Clock3,
  type LucideIcon,
} from 'lucide-react'
import type { TransferRequest, TransferStatus } from '@/types'
import { useWorkspace } from '@/state/WorkspaceContext'
import { CURRENT_ASSOCIATE } from '@/data/associates'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { timeAgo } from '@/lib/utils'

const STATUS: Record<
  TransferStatus,
  { label: string; variant: BadgeProps['variant'] }
> = {
  pending: { label: 'Pending', variant: 'warn' },
  accepted: { label: 'Accepted', variant: 'default' },
  declined: { label: 'Declined', variant: 'danger' },
}

function TransferRow({
  req,
  direction,
  now,
}: {
  req: TransferRequest
  direction: 'incoming' | 'sent'
  now: number
}) {
  const { dispatch } = useWorkspace()
  const other = direction === 'incoming' ? req.fromAssociate : req.toAssociate

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-card animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">
            {req.caseId} · {req.customerName}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {direction === 'incoming' ? 'From' : 'To'}{' '}
            <span className="font-medium text-ink-soft">{other}</span> ·{' '}
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3 w-3" />
              {timeAgo(req.createdAt, now)}
            </span>
          </p>
        </div>
        <Badge variant={STATUS[req.status].variant}>{STATUS[req.status].label}</Badge>
      </div>

      {req.note && (
        <p className="mt-2 rounded-md border border-border bg-background/60 px-3 py-2 text-sm text-ink-soft">
          “{req.note}”
        </p>
      )}

      {direction === 'incoming' && req.status === 'pending' && (
        <div className="mt-3 flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              dispatch({ type: 'DECLINE_TRANSFER', requestId: req.id })
              toast({ variant: 'info', title: 'Transfer declined', description: `${req.caseId} declined.` })
            }}
          >
            <X />
            Decline
          </Button>
          <Button
            size="sm"
            onClick={() => {
              dispatch({ type: 'ACCEPT_TRANSFER', requestId: req.id })
              toast({ variant: 'success', title: 'Transfer accepted', description: `${req.caseId} is now assigned to you.` })
            }}
          >
            <Check />
            Accept
          </Button>
        </div>
      )}
    </div>
  )
}

function Section({
  icon: Icon,
  title,
  items,
  direction,
  now,
  empty,
}: {
  icon: LucideIcon
  title: string
  items: TransferRequest[]
  direction: 'incoming' | 'sent'
  now: number
  empty: string
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-secondary" />
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-ink-soft">
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          {empty}
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <TransferRow key={r.id} req={r} direction={direction} now={now} />
          ))}
        </div>
      )}
    </div>
  )
}

export function TransferRequests({ now }: { now: number }) {
  const { state } = useWorkspace()
  const incoming = state.transferRequests.filter(
    (r) => r.toAssociate === CURRENT_ASSOCIATE,
  )
  const sent = state.transferRequests.filter(
    (r) => r.fromAssociate === CURRENT_ASSOCIATE,
  )

  if (incoming.length === 0 && sent.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center animate-fade-in">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
        </span>
        <p className="text-sm font-medium text-ink">No transfer requests</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Section
        icon={Inbox}
        title="Incoming"
        items={incoming}
        direction="incoming"
        now={now}
        empty="No incoming transfer requests."
      />
      <Section
        icon={SendHorizonal}
        title="Sent"
        items={sent}
        direction="sent"
        now={now}
        empty="You haven’t sent any transfers."
      />
    </div>
  )
}
