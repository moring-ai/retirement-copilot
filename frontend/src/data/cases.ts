import type { CaseSummary, TransferRequest } from '@/types'
import { CURRENT_ASSOCIATE, CURRENT_ASSOCIATE_ID } from '@/data/associates'

export { CURRENT_ASSOCIATE, CURRENT_ASSOCIATE_ID }

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
      priority: 'high',
      assignee: CURRENT_ASSOCIATE,
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
      priority: 'high',
      assignee: 'Dana Rivera',
      currentStep: 'response',
      progressPct: 66,
      lastUpdatedBy: 'Dana Rivera',
      lastUpdatedAt: now - 3 * HOUR,
      createdAt: now - 1 * DAY,
    },
    {
      id: 'CASE-4680',
      customerId: 'CUST-1001',
      customerName: 'Robert Miller',
      goalLabel: 'Rollover with Roth conversion',
      stage: 'in_review',
      priority: 'medium',
      assignee: 'Priya Nair',
      currentStep: 'required_forms',
      progressPct: 50,
      lastUpdatedBy: 'Priya Nair',
      lastUpdatedAt: now - 5 * HOUR,
      createdAt: now - 1 * DAY,
    },
    {
      id: 'CASE-4760',
      customerId: 'CUST-1001',
      customerName: 'Robert Miller',
      goalLabel: 'Rollover with Roth conversion',
      stage: 'submitted',
      priority: 'low',
      assignee: 'Marcus Lee',
      currentStep: 'review',
      progressPct: 100,
      lastUpdatedBy: 'Marcus Lee',
      lastUpdatedAt: now - 1 * DAY - 4 * HOUR,
      createdAt: now - 3 * DAY,
    },
    {
      id: 'CASE-4712',
      customerId: 'CUST-2002',
      customerName: 'Patricia Donovan',
      goalLabel: 'Direct rollover to a Traditional IRA',
      stage: 'draft',
      priority: 'medium',
      assignee: CURRENT_ASSOCIATE,
      currentStep: 'customer_snapshot',
      progressPct: 0,
      lastUpdatedBy: CURRENT_ASSOCIATE,
      lastUpdatedAt: now - 2 * DAY,
      createdAt: now - 2 * DAY,
    },
    {
      id: 'CASE-4655',
      customerId: 'CUST-2002',
      customerName: 'Patricia Donovan',
      goalLabel: 'Direct rollover to a Traditional IRA',
      stage: 'submitted',
      priority: 'low',
      assignee: CURRENT_ASSOCIATE,
      currentStep: 'review',
      progressPct: 100,
      lastUpdatedBy: CURRENT_ASSOCIATE,
      lastUpdatedAt: now - 3 * DAY,
      createdAt: now - 4 * DAY,
    },
  ]
}

// Seeded transfer requests. TR-9001 is an incoming request the signed-in
// associate can accept/decline; TR-9002 is one they've sent (awaiting); and
// TR-9000 is a resolved (accepted) transfer for history.
export function seedTransfers(now: number): TransferRequest[] {
  return [
    {
      id: 'TR-9001',
      caseId: 'CASE-4795',
      customerName: 'Patricia Donovan',
      fromAssociate: 'Dana Rivera',
      toAssociate: CURRENT_ASSOCIATE,
      note: 'Escalated — beneficiary dispute needs your review.',
      status: 'pending',
      createdAt: now - 35 * MIN,
    },
    {
      id: 'TR-9002',
      caseId: 'CASE-4712',
      customerName: 'Patricia Donovan',
      fromAssociate: CURRENT_ASSOCIATE,
      toAssociate: 'Priya Nair',
      note: 'Routine draft — please pick up.',
      status: 'pending',
      createdAt: now - 1 * HOUR,
    },
    {
      id: 'TR-9000',
      caseId: 'CASE-4680',
      customerName: 'Robert Miller',
      fromAssociate: CURRENT_ASSOCIATE,
      toAssociate: 'Priya Nair',
      note: 'Reassigned for capacity.',
      status: 'accepted',
      createdAt: now - 6 * HOUR,
    },
  ]
}
