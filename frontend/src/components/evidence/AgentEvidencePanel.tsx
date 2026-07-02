import { Sparkles, Loader2 } from 'lucide-react'
import { useWorkspace } from '@/state/WorkspaceContext'
import { ActivityTimeline } from './ActivityTimeline'
import { SourcesUsedList } from './SourcesUsedList'
import { CustomSourcesList } from './CustomSourcesList'
import { ConfidenceRiskPanel } from './ConfidenceRiskPanel'
import { ToolCallLog } from './ToolCallLog'
import { EvidenceEmptyState } from './EvidenceEmptyState'
import { Separator } from '@/components/ui/separator'

export function AgentEvidencePanel() {
  const { state } = useWorkspace()
  const { evidence, runningAction } = state
  const hasActivity =
    evidence.timeline.length > 0 ||
    evidence.toolCalls.length > 0 ||
    evidence.sources.length > 0
  const showConfidence =
    evidence.confidence !== null || evidence.riskTags.length > 0

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary/10">
            <Sparkles className="h-4 w-4 text-secondary" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-ink">Agent Evidence</p>
            <p className="text-[11px] text-muted-foreground">
              What the AI did — for your review
            </p>
          </div>
        </div>
        {runningAction && (
          <span className="flex items-center gap-1.5 rounded-full bg-secondary/10 px-2 py-1 text-[11px] font-medium text-secondary">
            <Loader2 className="h-3 w-3 animate-spin" />
            Working
          </span>
        )}
      </div>

      <div className="scrollbar-slim flex-1 overflow-y-auto px-4 pb-5">
        {!hasActivity ? (
          <div className="pt-4">
            <EvidenceEmptyState />
            {/* Even with no run yet, the associate can pre-load context. */}
            <div className="mt-4">
              <CustomSourcesList />
            </div>
          </div>
        ) : (
          <>
            {/* 1 — headline judgement, sticky + highlighted */}
            {showConfidence && (
              <ConfidenceRiskPanel
                confidence={evidence.confidence}
                riskTags={evidence.riskTags}
              />
            )}

            <div className="space-y-5 pt-4">
              {/* 2 — tool calls needing your approval */}
              {evidence.toolCalls.length > 0 && (
                <>
                  <ToolCallLog />
                  <Separator />
                </>
              )}

              {/* 3 — grounding: approved guidance + Fidelity storage */}
              <section>
                <SourcesUsedList sources={evidence.sources} />
                <CustomSourcesList />
              </section>
              <Separator />

              {/* 4 — audit trail, collapsed by default */}
              <ActivityTimeline
                events={evidence.timeline}
                running={runningAction !== null}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
