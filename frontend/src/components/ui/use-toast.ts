import * as React from 'react'

// Compact toast store (module-level pub/sub) — enough for the demo's
// "Save Case" / "Export Summary" / "Submit for Review" confirmations.

export interface ToastItem {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'success' | 'info'
}

type Listener = (toasts: ToastItem[]) => void

let toasts: ToastItem[] = []
const listeners = new Set<Listener>()
let counter = 0

function emit() {
  listeners.forEach((l) => l(toasts))
}

export function toast(item: Omit<ToastItem, 'id'>) {
  counter += 1
  const id = `toast-${counter}`
  toasts = [...toasts, { id, ...item }]
  emit()
  setTimeout(() => dismiss(id), 4200)
  return id
}

export function dismiss(id: string) {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

export function useToast() {
  const [items, setItems] = React.useState<ToastItem[]>(toasts)
  React.useEffect(() => {
    listeners.add(setItems)
    return () => {
      listeners.delete(setItems)
    }
  }, [])
  return { toasts: items, toast, dismiss }
}
