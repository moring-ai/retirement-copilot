import type { RagSource } from '@/types'

// Maps the UI-facing "Sources Used" display names onto the real approved-guidance
// documents and their stable chunk-id prefixes
// (backend/app/rag/ingest.py _DOC_PREFIX + data/rag_docs/*.md).

type SourceKey =
  | 'rollover_policy'
  | 'distribution_guide'
  | 'forms_catalog'
  | 'compliance_language'
  | 'escalation_policy'
  | 'tax_boundaries'

export const RAG_SOURCE_CATALOG: Record<SourceKey, RagSource> = {
  rollover_policy: {
    displayName: 'IRA Rollover Policy',
    doc: 'rollover_sop.md',
    chunk_id: 'ROLLOVER-SOP-01',
    score: 0.34,
  },
  distribution_guide: {
    displayName: '401(k) Distribution Guidelines',
    doc: 'ira_opening_guidance.md',
    chunk_id: 'IRA-OPEN-02',
    score: 0.37,
  },
  forms_catalog: {
    displayName: 'Required Forms Catalog',
    doc: 'required_forms_guidance.md',
    chunk_id: 'FORMS-06',
    score: 0.31,
  },
  compliance_language: {
    displayName: 'Compliance Language Guide',
    doc: 'approved_customer_language.md',
    chunk_id: 'APPROVED-LANG-01',
    score: 0.29,
  },
  escalation_policy: {
    displayName: 'Escalation Policy',
    doc: 'escalation_policy.md',
    chunk_id: 'ESCALATION-01',
    score: 0.4,
  },
  tax_boundaries: {
    displayName: 'Tax Advice Boundaries',
    doc: 'tax_advice_boundaries.md',
    chunk_id: 'TAX-BOUNDARY-01',
    score: 0.33,
  },
}

export function source(key: SourceKey): RagSource {
  return RAG_SOURCE_CATALOG[key]
}
