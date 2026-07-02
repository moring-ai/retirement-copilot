import type { RolloverGoalOption } from '@/types'

// The three rollover objectives an associate can capture for a case. The label
// is what the associate selects; the description frames what the agent will
// check for during the eligibility pass.
export const ROLLOVER_GOALS: RolloverGoalOption[] = [
  {
    id: 'direct_traditional',
    label: 'Direct rollover to a Traditional IRA',
    description:
      'Move funds straight from the former employer plan into a Fidelity Traditional IRA with no taxable distribution.',
  },
  {
    id: 'roth_conversion',
    label: 'Rollover with Roth conversion',
    description:
      'Roll the former plan into a Fidelity Roth IRA — a taxable conversion event the customer should review with a tax professional.',
  },
  {
    id: 'consolidate_accounts',
    label: 'Consolidate multiple retirement accounts',
    description:
      'Combine several former-employer plans into a single Fidelity IRA to simplify ongoing servicing.',
  },
]

export function goalLabel(id: string | null): string {
  return ROLLOVER_GOALS.find((g) => g.id === id)?.label ?? 'Not yet selected'
}
