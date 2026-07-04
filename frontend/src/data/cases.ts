import type { CaseSummary, TransferRequest } from '@/types'
import { CURRENT_ASSOCIATE, CURRENT_ASSOCIATE_ID } from '@/data/associates'
import { DEMO_SCENARIOS } from '@/data/demo-scenarios'

export { CURRENT_ASSOCIATE, CURRENT_ASSOCIATE_ID }

// The associate's incoming request queue. Every case starts as a fresh,
// UNWORKED request ("Pending", 0%) — the copilot does the work (tool calls,
// draft, escalation) only when the associate opens the case. Nothing about the
// outcome is precomputed here.
export function seedCases(now: number): CaseSummary[] {
  return DEMO_SCENARIOS.map((s) => {
    const c = s.caseCard
    const submittedAt = now - c.ageMinutes * 60_000
    return {
      id: c.id,
      customerId: c.customerId,
      customerName: c.customerName,
      goalLabel: c.goalLabel,
      stage: 'pending' as const,
      priority: c.priority,
      assignee: CURRENT_ASSOCIATE,
      currentStep: 'customer_snapshot' as const,
      progressPct: 0,
      lastUpdatedBy: c.customerName,
      lastUpdatedAt: submittedAt,
      createdAt: submittedAt,
    }
  })
}

export function seedTransfers(_now: number): TransferRequest[] {
  return []
}
