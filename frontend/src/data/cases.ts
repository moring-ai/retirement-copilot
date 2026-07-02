import type { CaseSummary } from '@/types'

/** The signed-in associate. Stamped onto every edit as "last updated by". */
export const CURRENT_ASSOCIATE = 'Masato Otsu'

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

// Seed cases for the home dashboard. Timestamps are relative to load time so
// the "last updated" column always reads as recent, believable activity.
export function seedCases(now: number): CaseSummary[] {
  return [
    {
      id: 'CASE-4821',
      customerId: 'CUST-1001',
      customerName: 'Robert Miller',
      goalLabel: 'Direct rollover to a Traditional IRA',
      stage: 'in_review',
      currentStep: 'goal_eligibility',
      progressPct: 33,
      lastUpdatedBy: CURRENT_ASSOCIATE,
      lastUpdatedAt: now - 22 * MIN,
      createdAt: now - 2 * HOUR,
    },
    {
      id: 'CASE-4795',
      customerId: 'CUST-2002',
      customerName: 'Patricia Donovan',
      goalLabel: 'Consolidate multiple retirement accounts',
      stage: 'escalated',
      currentStep: 'compliance_review',
      progressPct: 66,
      lastUpdatedBy: 'Dana R.',
      lastUpdatedAt: now - 3 * HOUR,
      createdAt: now - 1 * DAY,
    },
    {
      id: 'CASE-4760',
      customerId: 'CUST-1001',
      customerName: 'Robert Miller',
      goalLabel: 'Rollover with Roth conversion',
      stage: 'submitted',
      currentStep: 'review',
      progressPct: 100,
      lastUpdatedBy: 'Marcus L.',
      lastUpdatedAt: now - 1 * DAY - 4 * HOUR,
      createdAt: now - 3 * DAY,
    },
    {
      id: 'CASE-4712',
      customerId: 'CUST-2002',
      customerName: 'Patricia Donovan',
      goalLabel: 'Direct rollover to a Traditional IRA',
      stage: 'draft',
      currentStep: 'customer_snapshot',
      progressPct: 0,
      lastUpdatedBy: CURRENT_ASSOCIATE,
      lastUpdatedAt: now - 2 * DAY,
      createdAt: now - 2 * DAY,
    },
  ]
}
