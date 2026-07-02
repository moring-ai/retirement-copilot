import {
  Bell,
  ArrowLeftRight,
  Check,
  X,
  CheckCircle2,
  XCircle,
  SendHorizonal,
} from 'lucide-react'
import type { TransferRequest } from '@/types'
import { useWorkspace } from '@/state/WorkspaceContext'
import { CURRENT_ASSOCIATE } from '@/data/associates'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { timeAgo } from '@/lib/utils'

export function NotificationsMenu() {
  const { state, dispatch } = useWorkspace()
  const mine = state.transferRequests.filter(
    (r) => r.toAssociate === CURRENT_ASSOCIATE || r.fromAssociate === CURRENT_ASSOCIATE,
  )
  const pendingIncoming = mine.filter(
    (r) => r.toAssociate === CURRENT_ASSOCIATE && r.status === 'pending',
  )
  const rest = mine
    .filter((r) => !(r.toAssociate === CURRENT_ASSOCIATE && r.status === 'pending'))
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5)

  const unread = pendingIncoming.length

  return (
    <Popover>
      <PopoverTrigger
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
            {unread}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-ink">Notifications</p>
          {unread > 0 && (
            <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[10px] font-semibold text-danger">
              {unread} new
            </span>
          )}
        </div>

        <div className="scrollbar-slim max-h-[24rem] overflow-y-auto p-2">
          {mine.length === 0 && (
            <p className="px-2 py-8 text-center text-sm text-muted-foreground">
              You’re all caught up.
            </p>
          )}

          {pendingIncoming.map((r) => (
            <ActionableItem key={r.id} req={r} dispatch={dispatch} />
          ))}

          {rest.map((r) => (
            <InfoItem key={r.id} req={r} />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function ActionableItem({
  req,
  dispatch,
}: {
  req: TransferRequest
  dispatch: ReturnType<typeof useWorkspace>['dispatch']
}) {
  return (
    <div className="rounded-lg border border-warn/30 bg-warn-soft/40 p-3">
      <div className="flex items-start gap-2">
        <ArrowLeftRight className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
        <div className="min-w-0">
          <p className="text-sm text-ink">
            <span className="font-semibold">{req.fromAssociate}</span> wants to
            transfer <span className="font-medium">{req.caseId}</span> to you.
          </p>
          {req.note && (
            <p className="mt-0.5 text-xs text-muted-foreground">“{req.note}”</p>
          )}
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {timeAgo(req.createdAt)}
          </p>
        </div>
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            dispatch({ type: 'DECLINE_TRANSFER', requestId: req.id })
            toast({ variant: 'info', title: 'Transfer declined' })
          }}
        >
          <X />
          Decline
        </Button>
        <Button
          size="sm"
          onClick={() => {
            dispatch({ type: 'ACCEPT_TRANSFER', requestId: req.id })
            toast({
              variant: 'success',
              title: 'Transfer accepted',
              description: `${req.caseId} is now yours.`,
            })
          }}
        >
          <Check />
          Accept
        </Button>
      </div>
    </div>
  )
}

function InfoItem({ req }: { req: TransferRequest }) {
  const incoming = req.toAssociate === CURRENT_ASSOCIATE
  const Icon =
    req.status === 'accepted'
      ? CheckCircle2
      : req.status === 'declined'
        ? XCircle
        : SendHorizonal
  const text = incoming
    ? `Transfer of ${req.caseId} from ${req.fromAssociate}`
    : `You sent ${req.caseId} to ${req.toAssociate}`
  return (
    <div className="flex items-start gap-2 rounded-lg px-3 py-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-sm text-ink-soft">
          {text} · <span className="capitalize">{req.status}</span>
        </p>
        <p className="text-[11px] text-muted-foreground">{timeAgo(req.createdAt)}</p>
      </div>
    </div>
  )
}
