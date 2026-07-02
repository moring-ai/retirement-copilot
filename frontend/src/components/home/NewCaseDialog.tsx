import { useState } from 'react'
import {
  Search,
  UserCheck,
  Loader2,
  AlertTriangle,
  CalendarDays,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import type { Customer } from '@/types'
import { useWorkspace } from '@/state/WorkspaceContext'
import { CUSTOMERS } from '@/data/customers'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

const digits = (s: string) => s.replace(/\D/g, '')
const DEMO_IDS = Object.keys(CUSTOMERS)

export function NewCaseDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { dispatch } = useWorkspace()
  const [phase, setPhase] = useState<'lookup' | 'verify'>('lookup')
  const [customerId, setCustomerId] = useState('')
  const [found, setFound] = useState<Customer | null>(null)
  const [dob, setDob] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setPhase('lookup')
    setCustomerId('')
    setFound(null)
    setDob('')
    setBusy(false)
    setError(null)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const lookup = () => {
    setError(null)
    setBusy(true)
    window.setTimeout(() => {
      const c = CUSTOMERS[customerId.trim().toUpperCase()]
      setBusy(false)
      if (c) {
        setFound(c)
        setPhase('verify')
      } else {
        setError(`No customer found for “${customerId.trim()}”.`)
      }
    }, 550)
  }

  const verifyAndCreate = () => {
    if (!found) return
    setError(null)
    setBusy(true)
    window.setTimeout(() => {
      setBusy(false)
      if (digits(dob) === digits(found.date_of_birth)) {
        dispatch({ type: 'NEW_CASE', customerId: found.customer_id })
        dispatch({ type: 'VERIFY_IDENTITY' })
        toast({
          variant: 'success',
          title: 'Case created',
          description: `${found.name} verified — new case opened.`,
        })
        handleOpenChange(false)
      } else {
        setError('Date of birth does not match our records.')
      }
    }, 650)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New case</DialogTitle>
          <DialogDescription>
            {phase === 'lookup'
              ? 'Look up the customer by ID, then verify their identity.'
              : 'Confirm the customer’s date of birth to open the case.'}
          </DialogDescription>
        </DialogHeader>

        {/* Two-step indicator */}
        <div className="mb-4 flex items-center gap-2 text-[11px] font-medium">
          <span
            className={cn(
              'flex items-center gap-1.5 rounded-full px-2.5 py-1',
              phase === 'lookup'
                ? 'bg-secondary/10 text-secondary'
                : 'bg-brand-soft text-brand-dark',
            )}
          >
            {phase === 'verify' ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <Search className="h-3.5 w-3.5" />
            )}
            1 · Find customer
          </span>
          <span className="h-px w-4 bg-border" />
          <span
            className={cn(
              'flex items-center gap-1.5 rounded-full px-2.5 py-1',
              phase === 'verify'
                ? 'bg-secondary/10 text-secondary'
                : 'bg-muted text-muted-foreground',
            )}
          >
            <CalendarDays className="h-3.5 w-3.5" />2 · Verify DOB
          </span>
        </div>

        {phase === 'lookup' ? (
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-soft">
                Customer ID
              </label>
              <div className="flex gap-2">
                <Input
                  autoFocus
                  value={customerId}
                  placeholder="e.g. CUST-1001"
                  onChange={(e) => {
                    setCustomerId(e.target.value)
                    setError(null)
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && customerId.trim() && lookup()}
                  className={cn(error && 'border-danger focus-visible:ring-danger')}
                />
                <Button onClick={lookup} disabled={busy || !customerId.trim()}>
                  {busy ? <Loader2 className="animate-spin" /> : <Search />}
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
            <p className="text-[11px] text-muted-foreground">
              Demo customer IDs: {DEMO_IDS.join(', ')}
            </p>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in">
            {found && (
              <div className="flex items-center gap-3 rounded-lg border border-brand/20 bg-brand-soft/60 p-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white">
                  <UserCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{found.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {found.customer_id} · {found.state}
                  </p>
                </div>
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-soft">
                Date of birth
              </label>
              <Input
                autoFocus
                value={dob}
                placeholder="YYYY-MM-DD"
                onChange={(e) => {
                  setDob(e.target.value)
                  setError(null)
                }}
                onKeyDown={(e) => e.key === 'Enter' && dob.trim() && verifyAndCreate()}
                className={cn(error && 'border-danger focus-visible:ring-danger')}
              />
            </div>
            {error && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-danger animate-fade-in">
                <AlertTriangle className="h-3.5 w-3.5" />
                {error}
              </p>
            )}
            {found && (
              <p className="text-[11px] text-muted-foreground">
                Demo hint: {found.name}’s DOB is {found.date_of_birth}.
              </p>
            )}
            <div className="flex justify-between gap-2 pt-1">
              <Button
                variant="ghost"
                onClick={() => {
                  setPhase('lookup')
                  setError(null)
                }}
              >
                Back
              </Button>
              <Button onClick={verifyAndCreate} disabled={busy || !dob.trim()}>
                {busy ? <Loader2 className="animate-spin" /> : <ArrowRight />}
                Verify &amp; Create Case
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
