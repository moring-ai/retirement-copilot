import type { WorkspaceState } from '@/types'

/**
 * Derive the "skills" the agent has exercised this case from the evidence it
 * has produced. Mirrors the backend skill vocabulary (MCP lookup, RAG
 * citation, compliance guardrails, approved language) without needing the live
 * skills_used field, so the associate island reads as authentic.
 */
export function deriveSkills(state: WorkspaceState): string[] {
  const skills: string[] = []
  const ev = state.evidence

  if (ev.toolCalls.length > 0) skills.push('Customer data lookup (MCP)')
  if (ev.sources.length > 0) skills.push('Approved-guidance retrieval (RAG)')
  if (ev.confidence !== null) skills.push('Confidence & risk scoring')

  // When a customer response has been drafted, the code-only guardrails ran.
  if (state.draftText.length > 0) {
    skills.push(
      'PII redaction',
      'Advice & tax boundaries',
      'Approved customer language',
    )
  }

  return skills
}
