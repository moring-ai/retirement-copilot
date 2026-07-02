import { useState } from 'react'
import { ShieldQuestion, Lock, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import type { Customer } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type Method = 'dob' | 'email' | 'phone'

const METHODS: { id: Method; label: string; placeholder: string }[] = [
  { id: 'dob', label: 'Date of birth', placeholder: 'YYYY-MM-DD' },
  { id: 'email', label: 'Email', placeholder: 'name@example.com' },
  { id: 'phone', label: 'Phone', placeholder: '+1-555-…' },
]

const digits = (s: string) => s.replace(/\D/g, '')

function matches(customer: Customer, method: Method, value: string): boolean {
  const v = value.trim()
  if (!v) return false
  if (method === 'email')
    return v.toLowerCase() === customer.email.toLowerCase()
  if (method === 'dob') return digits(v) === digits(customer.date_of_birth)
  // phone — compare on the last 10 digits
  return digits(v).slice(-10) === digits(customer.phone).slice(-10)
}

export function IdentityGate({
  customer,
  onVerified,
}: {
  customer: Customer
  onVerified: () => void
}) {
  const [method, setMethod] = useState<Method>('dob')
  const [value, setValue] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState(false)

  const verify = () => {
    setError(false)
    setChecking(true)
    // brief "looking up" beat for realism
    window.setTimeout(() => {
      setChecking(false)
      if (matches(customer, method, value)) onVerified()
      else setError(true)
    }, 650)
  }

  const active = METHODS.find((m) => m.id === method)!

  return (
    <Card className="mx-auto max-w-lg animate-fade-in border-l-4 border-l-secondary">
      <CardContent className="p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-secondary">
            <ShieldQuestion className="h-6 w-6" />
          </span>
          <div>
            <h3 className="text-base font-semibold text-ink">
              Verify the customer first
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Confirm one identifier before the profile is revealed — so you’re
              certain you’re viewing the right person.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex gap-1 rounded-lg border border-border bg-muted p-1">
            {METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setMethod(m.id)
                  setValue('')
                  setError(false)
                }}
                className={cn(
                  'flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  method === m.id
                    ? 'bg-card text-ink shadow-sm'
                    : 'text-muted-foreground hover:text-ink',
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            <Input
              value={value}
              placeholder={active.placeholder}
              onChange={(e) => {
                setValue(e.target.value)
                setError(false)
              }}
              onKeyDown={(e) => e.key === 'Enter' && verify()}
              aria-label={`Customer ${active.label}`}
              className={cn(error && 'border-danger focus-visible:ring-danger')}
            />
            <Button onClick={verify} disabled={checking || !value.trim()}>
              {checking ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
              {checking ? 'Checking…' : 'Verify'}
            </Button>
          </div>

          {error && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-danger animate-fade-in">
              <AlertTriangle className="h-3.5 w-3.5" />
              That {active.label.toLowerCase()} doesn’t match our records. Please
              re-check with the customer.
            </p>
          )}

          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Lock className="h-3 w-3" />
            Identity checks are logged. Demo hint: DOB {customer.date_of_birth}.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
