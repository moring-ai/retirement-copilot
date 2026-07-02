import { useEffect, useState } from 'react'
import {
  Search,
  UserCheck,
  Loader2,
  AlertTriangle,
  Send,
} from 'lucide-react'
import type { CaseSummary } from '@/types'
import { useWorkspace } from '@/state/WorkspaceContext'
import {
  associateById,
  CURRENT_ASSOCIATE_ID,
  type Associate,
} from '@/data/associates'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

export function TransferCaseDialog({
  summary,
  onOpenChange,
}: {
  summary: CaseSummary | null
  onOpenChange: (open: boolean) => void
}) {
  const { dispatch } = useWorkspace()
  const [assocId, setAssocId] = useState('')
  const [target, setTarget] = useState<Associate | null>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset whenever the targeted case changes (dialog reopened).
  useEffect(() => {
    setAssocId('')
    setTarget(null)
    setNote('')
    setBusy(false)
    setError(null)
  }, [summary?.id])

  const lookup = () => {
    setError(null)
    const a = associateById(assocId)
    if (!a) {
      setTarget(null)
      setError(`No associate found for “${assocId.trim()}”.`)
      return
    }
    if (a.id === CURRENT_ASSOCIATE_ID) {
      setTarget(null)
      setError('That’s you — pick a different associate.')
      return
    }
    setTarget(a)
  }

  const transfer = () => {
    if (!summary || !target) return
    setBusy(true)
    window.setTimeout(() => {
      dispatch({
        type: 'TRANSFER_CASE',
        caseId: summary.id,
        toAssociate: target.name,
        note: note.trim() || undefined,
      })
      setBusy(false)
      toast({
        variant: 'info',
        title: 'Transfer requested',
        description: `${summary.id} sent to ${target.name} for acceptance.`,
      })
      onOpenChange(false)
    }, 500)
  }

  return (
    <Dialog open={summary !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer case</DialogTitle>
          <DialogDescription>
            {summary
              ? `Send ${summary.id} · ${summary.customerName} to another associate.`
              : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-soft">
              Associate ID
            </label>
            <div className="flex gap-2">
              <Input
                autoFocus
                value={assocId}
                placeholder="e.g. AS-1003"
                onChange={(e) => {
                  setAssocId(e.target.value)
                  setError(null)
                  setTarget(null)
                }}
                onKeyDown={(e) => e.key === 'Enter' && assocId.trim() && lookup()}
                className={cn(error && 'border-danger focus-visible:ring-danger')}
              />
              <Button variant="outline" onClick={lookup} disabled={!assocId.trim()}>
                <Search />
                Find
              </Button>
            </div>
          </div>

          {error && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-danger animate-fade-in">
              <AlertTriangle className="h-3.5 w-3.5" />
              {error}
            </p>
          )}

          {target && (
            <div className="flex items-center gap-3 rounded-lg border border-brand/20 bg-brand-soft/60 p-3 animate-fade-in">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white">
                <UserCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{target.name}</p>
                <p className="text-xs text-muted-foreground">
                  {target.id} · {target.role}
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-soft">
              Note (optional)
            </label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add context for the receiving associate…"
              className="min-h-[72px]"
            />
          </div>

          <p className="text-[11px] text-muted-foreground">
            Directory IDs: AS-1002 (Dana Rivera), AS-1003 (Marcus Lee), AS-1004
            (Priya Nair).
          </p>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={transfer} disabled={!target || busy}>
              {busy ? <Loader2 className="animate-spin" /> : <Send />}
              Send Transfer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
