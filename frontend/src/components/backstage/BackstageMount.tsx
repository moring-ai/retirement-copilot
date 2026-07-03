import { useEffect, useState } from 'react'
import { Activity } from 'lucide-react'
import type { AgentRunEvent } from '@/lib/agentBus'
import { useAgentBus } from '@/hooks/useAgentBus'
import { Backstage } from './Backstage'

/**
 * Mounts the toggleable router backstage in either tab.
 *  - Customer tab passes `run` (its own last run — BroadcastChannel does not
 *    echo to the sender).
 *  - Associate tab omits `run`; the mount captures AGENT_RUN off the bus.
 * Toggle with the floating chip or ⌥/Alt + T.
 */
export function BackstageMount({ run }: { run?: AgentRunEvent | null }) {
  const [open, setOpen] = useState(false)
  const [busRun, setBusRun] = useState<AgentRunEvent | null>(null)

  useAgentBus((e) => {
    if (e.type === 'AGENT_RUN') setBusRun(e)
  })

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.altKey && ev.code === 'KeyT') {
        ev.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const effectiveRun = run ?? busRun

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-30 inline-flex items-center gap-1.5 rounded-full border border-[#d9ddd4] bg-white/95 px-3 py-1.5 text-[11px] font-medium text-[#51605a] shadow-sm backdrop-blur transition-colors hover:bg-white"
        title="Agent trace (⌥T)"
      >
        <Activity className="h-3.5 w-3.5" /> Agent trace
      </button>
      <Backstage run={effectiveRun} open={open} onClose={() => setOpen(false)} />
    </>
  )
}
