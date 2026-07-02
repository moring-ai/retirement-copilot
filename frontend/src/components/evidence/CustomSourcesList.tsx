import { useRef } from 'react'
import { HardDrive, Upload, FileText, X, Lock } from 'lucide-react'
import type { CustomSource } from '@/types'
import { useWorkspace } from '@/state/WorkspaceContext'

function sizeLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

let uploadSeq = 0

/**
 * Associate-uploaded context documents held in approved Fidelity storage. These
 * augment the agent's grounding alongside the RAG guidance corpus.
 */
export function CustomSourcesList() {
  const { state, dispatch } = useWorkspace()
  const inputRef = useRef<HTMLInputElement>(null)

  const onFiles = (files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach((file) => {
      uploadSeq += 1
      const source: CustomSource = {
        id: `src-${uploadSeq}-${file.name}`,
        name: file.name,
        sizeLabel: sizeLabel(file.size),
      }
      dispatch({ type: 'ADD_CUSTOM_SOURCE', source })
    })
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="mt-3">
      <div className="mb-2 flex items-center gap-1.5">
        <HardDrive className="h-3.5 w-3.5 text-secondary" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
          Fidelity Storage
        </span>
        <span className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground">
          <Lock className="h-3 w-3" />
          Approved
        </span>
      </div>

      {state.customSources.length > 0 && (
        <ul className="mb-2 space-y-1.5">
          {state.customSources.map((s) => (
            <li
              key={s.id}
              className="group flex items-center gap-2 rounded-md border border-border bg-background/60 px-2.5 py-1.5 animate-fade-in"
            >
              <FileText className="h-3.5 w-3.5 shrink-0 text-secondary" />
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink">
                {s.name}
              </span>
              <span className="shrink-0 text-[10px] text-muted-foreground">
                {s.sizeLabel}
              </span>
              <button
                type="button"
                aria-label={`Remove ${s.name}`}
                onClick={() =>
                  dispatch({ type: 'REMOVE_CUSTOM_SOURCE', id: s.id })
                }
                className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-card px-2 py-2 text-[11px] font-medium text-ink-soft transition-colors hover:border-secondary/40 hover:bg-muted"
      >
        <Upload className="h-3.5 w-3.5" />
        Upload document for context
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />
    </div>
  )
}
