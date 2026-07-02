import type { Customer } from '@/types'

// Four demo customer archetypes. Field shapes match the backend seed data
// (scripts/seed_mock_data.py / mock_customers.json). A few presentation-only
// fields (employment_status, destination_account, rollover_goal, distribution_status,
// and the scenario metadata) drive the workspace steps and the case switcher.
//
// The four are chosen to produce visibly different agent output:
//   CUST-1001  clean, no IRA yet   -> direct rollover, open IRA first
//   CUST-3003  clean, existing IRA -> direct rollover into existing IRA
//   CUST-4004  indirect in progress-> time-sensitive 60-day caution
//   CUST-2002  restrictions/holds  -> escalation

export const DEFAULT_CUSTOMER_ID = 'CUST-1001'

/** Display order in the case switcher — simplest to most complex. */
export const CUSTOMER_ORDER = ['CUST-1001', 'CUST-3003', 'CUST-4004', 'CUST-2002']

export const CUSTOMERS: Record<string, Customer> = {
  'CUST-1001': {
    customer_id: 'CUST-1001',
    name: 'Robert Miller',
    age: 65,
    employment_status: 'Retired',
    veteran_status: 'Army veteran',
    state: 'Georgia',
    contact_preference: 'phone',
    email: 'robert.miller@example.com',
    phone: '+1-770-555-0142',
    ssn_last4: '4821',
    risk_flags: [],
    has_existing_fidelity_ira: false,
    retirement_accounts: [
      {
        account_id: 'FID-BRK-55012',
        type: 'Individual Brokerage',
        provider: 'Fidelity',
        balance_estimate: 18250.0,
      },
    ],
    source_plan: {
      description: 'Old employer 401(k)',
      plan_provider: 'Example Benefits Plan Services',
      plan_type: '401(k)',
      balance_estimate: 142500.0,
      rollover_allowed: true,
      outstanding_plan_loan: false,
    },
    destination_account: 'Fidelity Traditional IRA',
    rollover_goal: 'Direct rollover without a taxable distribution',
    account_restrictions: [],
    documents: {
      ira_application: 'missing',
      rollover_request_form: 'missing',
      identity_verification: 'complete',
    },
    case_status: {
      open_rollover_case: false,
      notes: 'No open rollover case yet.',
    },
    distribution_status: 'none',
    caseType: 'clean_new_ira',
    scenarioLabel: 'Clean · new IRA',
    scenarioTone: 'positive',
  },

  'CUST-3003': {
    customer_id: 'CUST-3003',
    name: 'Denise Carter',
    age: 61,
    employment_status: 'Retired',
    veteran_status: 'Not a veteran',
    state: 'North Carolina',
    contact_preference: 'email',
    email: 'denise.carter@example.com',
    phone: '+1-919-555-0173',
    ssn_last4: '3092',
    risk_flags: [],
    has_existing_fidelity_ira: true,
    retirement_accounts: [
      {
        account_id: 'FID-IRA-60318',
        type: 'Traditional IRA',
        provider: 'Fidelity',
        balance_estimate: 87400.0,
      },
    ],
    source_plan: {
      description: 'Old employer 401(k)',
      plan_provider: 'Summit Workplace Retirement',
      plan_type: '401(k)',
      balance_estimate: 76300.0,
      rollover_allowed: true,
      outstanding_plan_loan: false,
    },
    destination_account: 'Fidelity Traditional IRA (existing)',
    rollover_goal: 'Direct rollover into existing Fidelity IRA',
    account_restrictions: [],
    documents: {
      ira_application: 'complete',
      rollover_request_form: 'missing',
      identity_verification: 'complete',
    },
    case_status: {
      open_rollover_case: false,
      notes: 'Existing Fidelity Traditional IRA on file.',
    },
    distribution_status: 'none',
    caseType: 'clean_existing_ira',
    scenarioLabel: 'Clean · existing IRA',
    scenarioTone: 'positive',
  },

  'CUST-4004': {
    customer_id: 'CUST-4004',
    name: "James O'Neil",
    age: 52,
    employment_status: 'Employed',
    veteran_status: 'Navy veteran',
    state: 'Illinois',
    contact_preference: 'phone',
    email: 'james.oneil@example.com',
    phone: '+1-312-555-0128',
    ssn_last4: '5567',
    risk_flags: [],
    has_existing_fidelity_ira: true,
    retirement_accounts: [
      {
        account_id: 'FID-IRA-44210',
        type: 'Traditional IRA',
        provider: 'Fidelity',
        balance_estimate: 41200.0,
      },
    ],
    source_plan: {
      description: 'Former employer 401(k)',
      plan_provider: 'Beacon Plan Administrators',
      plan_type: '401(k)',
      balance_estimate: 63500.0,
      rollover_allowed: true,
      outstanding_plan_loan: false,
    },
    destination_account: 'Fidelity Traditional IRA (existing)',
    rollover_goal: 'Complete an indirect rollover already in progress',
    account_restrictions: [],
    documents: {
      ira_application: 'complete',
      rollover_request_form: 'missing',
      identity_verification: 'complete',
    },
    case_status: {
      open_rollover_case: false,
      notes: 'Source plan already issued a distribution to the customer.',
    },
    distribution_status: 'indirect_in_progress',
    caseType: 'indirect_caution',
    scenarioLabel: 'Caution · indirect (60-day)',
    scenarioTone: 'caution',
  },

  'CUST-2002': {
    customer_id: 'CUST-2002',
    name: 'Patricia Donovan',
    age: 58,
    employment_status: 'Employed',
    veteran_status: 'Not a veteran',
    state: 'Ohio',
    contact_preference: 'email',
    email: 'patricia.donovan@example.com',
    phone: '+1-614-555-0199',
    ssn_last4: '7734',
    risk_flags: ['beneficiary_dispute', 'address_mismatch'],
    has_existing_fidelity_ira: true,
    retirement_accounts: [
      {
        account_id: 'FID-IRA-71120',
        type: 'Traditional IRA',
        provider: 'Fidelity',
        balance_estimate: 64200.0,
      },
    ],
    source_plan: {
      description: 'Old employer 401(k)',
      plan_provider: 'Meridian Retirement Group',
      plan_type: '401(k)',
      balance_estimate: 98750.0,
      rollover_allowed: 'unknown',
      outstanding_plan_loan: true,
    },
    destination_account: 'Fidelity Traditional IRA',
    rollover_goal: 'Direct rollover without a taxable distribution',
    account_restrictions: ['beneficiary dispute', 'address mismatch'],
    documents: {
      ira_application: 'complete',
      rollover_request_form: 'missing',
      identity_verification: 'incomplete',
    },
    case_status: {
      open_rollover_case: false,
      notes: 'Prior servicing note references an unresolved beneficiary dispute.',
    },
    distribution_status: 'none',
    caseType: 'escalation',
    scenarioLabel: 'Escalation',
    scenarioTone: 'critical',
  },
}

export const CUSTOMER_LIST = CUSTOMER_ORDER.map((id) => CUSTOMERS[id])
