import type { Customer } from '@/types'

// Literal customer records. Fields match the backend seed data
// (scripts/seed_mock_data.py / mcp_server/data/mock_customers.json) so the UI
// vocabulary lines up 1:1 with production. A few presentation-only fields
// (employment_status, destination_account, rollover_goal) are added to satisfy
// the workspace's Customer Snapshot / Rollover Goal steps.

export const DEFAULT_CUSTOMER_ID = 'CUST-1001'

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
    date_of_birth: '1959-03-14',
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
    date_of_birth: '1966-08-22',
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
  },
}

export const CUSTOMER_LIST = Object.values(CUSTOMERS)
