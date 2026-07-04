import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toaster'
import { AssociateApp } from '@/components/associate/AssociateApp'

// Associate-only app. The customer-facing experience has been removed; this
// build serves the internal Fidelity associate exclusively.
export default function App() {
  return (
    <TooltipProvider delayDuration={200}>
      <AssociateApp />
      <Toaster />
    </TooltipProvider>
  )
}
