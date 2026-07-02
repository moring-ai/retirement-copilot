import { ListChecks } from 'lucide-react'
import { ReviewChecklistItem } from './ReviewChecklistItem'
import { Badge } from '@/components/ui/badge'
import { useWorkspace } from '@/state/WorkspaceContext'

export function AssociateReviewQueue() {
  const { state, dispatch } = useWorkspace()
  const done = state.reviewQueue.filter((i) => i.checked).length
  const total = state.reviewQueue.length

  return (
    <section className="border-t border-border bg-card">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-4 lg:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-secondary" />
            <h2 className="text-sm font-semibold text-ink">
              Associate Review Queue
            </h2>
            <span className="text-xs text-muted-foreground">
              Human-in-the-loop steps before anything is sent
            </span>
          </div>
          <Badge variant={done === total ? 'default' : 'neutral'}>
            {done}/{total} done
          </Badge>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {state.reviewQueue.map((item) => (
            <ReviewChecklistItem
              key={item.id}
              item={item}
              onToggle={(id) => dispatch({ type: 'TOGGLE_REVIEW_ITEM', id })}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
