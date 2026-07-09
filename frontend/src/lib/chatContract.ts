// The real backend `/chat` contract (mirrors backend/app/schemas/api.py).
// Kept separate from the UI-shaped types in src/types.ts because those carry
// presentation-only fields (RagSource.displayName, ToolCalled.approval, …).

export type RouterPath = 'A_augmented_llm' | 'B_prompt_chain'

export interface ApiFinding {
  label: string
  value: string
  source: string
}

export interface ApiRagSource {
  chunk_id: string
  doc: string
  score: number | null
}

export interface ApiToolCalled {
  tool: string
  status: 'ok' | 'error'
}

export interface ApiSkillUsed {
  skill: string
  version: string
  kind: 'content' | 'validation'
  status: 'ok' | 'error'
  flagged: boolean
  detail: string
}

export interface ApiTraceStep {
  step: string
  status: string
  detail: string
}

export interface ApiTrace {
  classification: {
    category?: string
    is_customer_specific?: boolean
    confidence?: number
    path?: RouterPath
  }
  parsed: {
    customer_id?: string
    customer_name?: string
    rollover_keywords?: string[]
  }
  steps: ApiTraceStep[]
  tool_results?: Record<string, unknown>
  skills_used?: ApiSkillUsed[]
  model_mode?: string
  errors?: string[]
}

export interface ChatResponse {
  path: RouterPath
  answer: string
  case_summary: string
  findings: ApiFinding[]
  next_steps: string[]
  required_forms: string[]
  customer_draft: string
  compliance_notes: string[]
  escalation_required: boolean
  escalation_reasons: string[]
  clarification_needed: boolean
  rag_sources: ApiRagSource[]
  tools_called: ApiToolCalled[]
  skills_used: ApiSkillUsed[]
  trace: ApiTrace
}

export interface ChatRequest {
  message: string
  customer_id?: string
  session_id?: string
}

/** Backend base URL — override with VITE_BACKEND_URL for non-local setups. */
export const BACKEND_URL: string =
  (import.meta as { env?: Record<string, string> }).env?.VITE_BACKEND_URL ??
  'http://127.0.0.1:8080'

/** POST /chat — runs the real deterministic router + Path A/B on the backend.
 *  Aborts after `timeoutMs` so the UI never hangs on an unresponsive backend. */
export async function postChat(req: ChatRequest, timeoutMs = 30000): Promise<ChatResponse> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${BACKEND_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal: controller.signal,
    })
    if (!res.ok) {
      throw new Error(`/chat failed: ${res.status} ${res.statusText}`)
    }
    return (await res.json()) as ChatResponse
  } finally {
    clearTimeout(timer)
  }
}

export interface HealthResponse {
  status: string
  db: string
  mcp: string
  model_mode: string
  default_model: string
  corpus_chunks: number
  embedding_mode: string
}

export async function getHealth(): Promise<HealthResponse | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/health`)
    if (!res.ok) return null
    return (await res.json()) as HealthResponse
  } catch {
    return null
  }
}
