import { ShieldCheck } from 'lucide-react'

export function DraftGuardrailNotice() {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-secondary/20 bg-accent px-3 py-2.5">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
      <p className="text-xs leading-relaxed text-accent-foreground">
        Guardrails applied: no investment or tax advice, no money-movement
        instructions, and customer PII is kept out of the draft. Tax questions are
        deferred to a qualified professional.
      </p>
    </div>
  )
}
