import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Sticky footer for a step's primary "submit" action. Renders pinned to the
 * bottom of the scrolling workspace column with a soft backdrop so the action
 * is always reachable without scrolling.
 */
export function StickyActionBar({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-6 lg:-mx-8">
      <div className="border-t border-border bg-card/90 px-4 py-3 backdrop-blur lg:px-8">
        <div
          className={cn(
            'mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3',
            className,
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
