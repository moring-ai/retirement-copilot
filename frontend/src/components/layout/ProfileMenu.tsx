import { ChevronDown, Settings, LogOut, UserCircle2 } from 'lucide-react'
import { CURRENT_ASSOCIATE, CURRENT_ASSOCIATE_ID, associateById } from '@/data/associates'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { toast } from '@/components/ui/use-toast'
import { initials } from '@/lib/utils'

export function ProfileMenu() {
  const me = associateById(CURRENT_ASSOCIATE_ID)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
          {initials(CURRENT_ASSOCIATE)}
        </span>
        <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="flex items-center gap-3 px-2.5 py-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
            {initials(CURRENT_ASSOCIATE)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">
              {CURRENT_ASSOCIATE}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {me?.role ?? 'Associate'} · {CURRENT_ASSOCIATE_ID}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() =>
            toast({
              variant: 'info',
              title: 'Profile',
              description: `${CURRENT_ASSOCIATE} · ${CURRENT_ASSOCIATE_ID}`,
            })
          }
        >
          <span className="flex items-center gap-2 text-ink">
            <UserCircle2 className="h-4 w-4 text-secondary" />
            My profile
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() =>
            toast({ variant: 'info', title: 'Preferences', description: 'Preferences coming soon.' })
          }
        >
          <span className="flex items-center gap-2 text-ink">
            <Settings className="h-4 w-4 text-secondary" />
            Preferences
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() =>
            toast({ variant: 'info', title: 'Signed out', description: 'You have been signed out (demo).' })
          }
        >
          <span className="flex items-center gap-2 text-danger">
            <LogOut className="h-4 w-4" />
            Log out
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
