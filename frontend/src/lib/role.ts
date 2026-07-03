// Per-tab role resolution for the two-tab demo.
//
// The URL query param (?role=customer|associate) is the source of truth so each
// browser tab holds its own role. sessionStorage (per-tab, NOT shared like
// localStorage) preserves it across refreshes without letting one tab clobber
// the other. If neither is set, the RolePicker landing is shown.

export type AppRole = 'customer' | 'associate'

const KEY = 'rc-role'

export function resolveRole(): AppRole | null {
  if (typeof window === 'undefined') return null
  const q = new URL(window.location.href).searchParams.get('role')
  if (q === 'customer' || q === 'associate') {
    try {
      sessionStorage.setItem(KEY, q)
    } catch {
      /* ignore */
    }
    return q
  }
  try {
    const s = sessionStorage.getItem(KEY)
    if (s === 'customer' || s === 'associate') return s
  } catch {
    /* ignore */
  }
  return null
}

export function chooseRole(role: AppRole): void {
  try {
    sessionStorage.setItem(KEY, role)
  } catch {
    /* ignore */
  }
  const url = new URL(window.location.href)
  url.searchParams.set('role', role)
  // Full reload into the chosen role — keeps each tab's tree clean.
  window.location.href = url.toString()
}
