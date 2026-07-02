import type { ReviewQueueItem } from '@/types'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

export function ReviewChecklistItem({
  item,
  onToggle,
}: {
  item: ReviewQueueItem
  onToggle: (id: string) => void
}) {
  return (
    <label
      htmlFor={item.id}
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
        item.checked
          ? 'border-brand/30 bg-brand-soft/50'
          : 'border-border bg-card hover:bg-muted',
      )}
    >
      <Checkbox
        id={item.id}
        checked={item.checked}
        onCheckedChange={() => onToggle(item.id)}
        className="mt-0.5"
      />
      <div className="min-w-0">
        <p
          className={cn(
            'text-sm font-medium',
            item.checked
              ? 'text-brand-dark line-through decoration-brand/40'
              : 'text-ink',
          )}
        >
          {item.label}
        </p>
        {item.hint && (
          <p className="mt-0.5 text-xs text-muted-foreground">{item.hint}</p>
        )}
      </div>
    </label>
  )
}
