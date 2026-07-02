import type { LucideIcon } from 'lucide-react'

export function SectionHeading({
  icon: Icon,
  title,
  count,
}: {
  icon: LucideIcon
  title: string
  count?: number
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-secondary" />
      <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
        {title}
      </h3>
      {count !== undefined && count > 0 && (
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-ink-soft">
          {count}
        </span>
      )}
    </div>
  )
}
