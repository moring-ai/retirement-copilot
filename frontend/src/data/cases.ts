import type { CaseSummary, TransferRequest } from '@/types'
import { CURRENT_ASSOCIATE, CURRENT_ASSOCIATE_ID } from '@/data/associates'

export { CURRENT_ASSOCIATE, CURRENT_ASSOCIATE_ID }

// The associate home starts empty. Cases arrive live from customer-initiated
// (web) rollover runs over the cross-tab agent bus — no static seed data.
export function seedCases(_now: number): CaseSummary[] {
  return []
}

export function seedTransfers(_now: number): TransferRequest[] {
  return []
}
