import { Wrench } from 'lucide-react'
import type { ToolCalled } from '@/types'
import { ToolCallRow } from './ToolCallRow'
import { SectionHeading } from './SectionHeading'

export function ToolCallLog({ calls }: { calls: ToolCalled[] }) {
  return (
    <section>
      <SectionHeading icon={Wrench} title="Tool Calls" count={calls.length} />
      <ul className="mt-3 space-y-1.5">
        {calls.map((call) => (
          <ToolCallRow key={call.tool} call={call} />
        ))}
      </ul>
    </section>
  )
}
