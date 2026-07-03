import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toaster'
import { resolveRole } from '@/lib/role'
import { RolePicker } from '@/components/role/RolePicker'
import { AssociateApp } from '@/components/associate/AssociateApp'
import { CustomerApp } from '@/components/customer/CustomerApp'

export default function App() {
  const role = resolveRole()
  return (
    <TooltipProvider delayDuration={200}>
      {role === 'associate' ? (
        <AssociateApp />
      ) : role === 'customer' ? (
        <CustomerApp />
      ) : (
        <RolePicker />
      )}
      <Toaster />
    </TooltipProvider>
  )
}
