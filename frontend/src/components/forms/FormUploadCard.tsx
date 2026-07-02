import { useRef } from 'react'
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  X,
  Lock,
  Sparkles,
} from 'lucide-react'
import type { UploadedForm } from '@/types'
import { useWorkspace } from '@/state/WorkspaceContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function sizeLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

let formSeq = 0

/** Simulated AI review of a filled-in form. */
export function reviewComments(name: string): {
  status: 'verified' | 'issues'
  comments: string[]
} {
  const lower = name.toLowerCase()
  if (lower.includes('unsigned') || lower.includes('draft') || lower.includes('partial')) {
    return {
      status: 'issues',
      comments: [
        '✗ Customer signature missing on the authorization page.',
        '✗ Rollover amount field is blank.',
        '• Return to the customer to complete before submission.',
      ],
    }
  }
  return {
    status: 'verified',
    comments: [
      '✓ Signature and date present on the final page.',
      '✓ Destination IRA account number matches the case on file.',
      '• Advisory: confirm the rollover amount matches the source-plan balance.',
    ],
  }
}

export function FormUploadCard() {
  const { state, dispatch } = useWorkspace()
  const inputRef = useRef<HTMLInputElement>(null)

  const onFiles = (files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach((file) => {
      formSeq += 1
      const form: UploadedForm = {
        id: `form-${formSeq}-${file.name}`,
        name: file.name,
        sizeLabel: sizeLabel(file.size),
        status: 'unverified',
        comments: [],
      }
      dispatch({ type: 'ADD_UPLOADED_FORM', form })
    })
    if (inputRef.current) inputRef.current.value = ''
  }

  const verify = (form: UploadedForm) => {
    dispatch({ type: 'SET_FORM_STATUS', id: form.id, status: 'verifying' })
    window.setTimeout(() => {
      const { status, comments } = reviewComments(form.name)
      dispatch({ type: 'SET_FORM_STATUS', id: form.id, status, comments })
    }, 1300)
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-secondary" />
          <CardTitle className="normal-case tracking-normal text-ink">
            Filled-in Forms
          </CardTitle>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          Uploaded documents are read-only for the AI — it reviews and comments,
          it cannot edit or submit them.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {state.uploadedForms.length > 0 && (
          <ul className="space-y-2">
            {state.uploadedForms.map((f) => (
              <li
                key={f.id}
                className="rounded-lg border border-border bg-background/60 p-3 animate-fade-in"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="h-4 w-4 shrink-0 text-secondary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {f.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {f.sizeLabel}
                    </p>
                  </div>
                  <StatusPill status={f.status} />
                  {f.status === 'unverified' || f.status === 'issues' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => verify(f)}
                    >
                      <Sparkles />
                      Verify with AI
                    </Button>
                  ) : f.status === 'verifying' ? (
                    <Button size="sm" variant="outline" disabled>
                      <Loader2 className="animate-spin" />
                      Reviewing…
                    </Button>
                  ) : null}
                  <button
                    type="button"
                    aria-label={`Remove ${f.name}`}
                    onClick={() =>
                      dispatch({ type: 'REMOVE_UPLOADED_FORM', id: f.id })
                    }
                    className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:text-danger"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {f.comments.length > 0 && (
                  <div
                    className={cn(
                      'mt-2.5 rounded-md border p-2.5 animate-fade-in',
                      f.status === 'issues'
                        ? 'border-danger/20 bg-danger-soft/50'
                        : 'border-brand/20 bg-brand-soft/50',
                    )}
                  >
                    <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                      <Sparkles className="h-3 w-3" />
                      AI review
                    </p>
                    <ul className="space-y-0.5">
                      {f.comments.map((c) => (
                        <li
                          key={c}
                          className="text-xs leading-relaxed text-ink-soft"
                        >
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background/40 px-4 py-6 text-sm font-medium text-ink-soft transition-colors hover:border-secondary/40 hover:bg-muted"
        >
          <Upload className="h-4 w-4" />
          Upload filled-in forms (PDF, image)
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
      </CardContent>
    </Card>
  )
}

function StatusPill({ status }: { status: UploadedForm['status'] }) {
  if (status === 'verified')
    return (
      <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-brand">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Verified
      </span>
    )
  if (status === 'issues')
    return (
      <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-danger">
        <AlertTriangle className="h-3.5 w-3.5" />
        Issues
      </span>
    )
  return null
}
