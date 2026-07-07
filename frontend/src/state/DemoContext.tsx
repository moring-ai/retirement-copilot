import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { getScenario, type DemoScenario } from '@/data/demo-scenarios'
import { buildLiveScenario } from '@/data/live-scenario'
import { postChat } from '@/lib/chatContract'

// A self-contained state machine for the case-run experience, kept isolated from
// the case-workspace reducer. It drives two very different UIs:
//
//   Path A — streams a general answer into an answer card (never blank).
//   Path B — advances a gated 5-step servicing workflow (never blank), revealing
//            one evidence event per "beat" (~1.6s) so a narrated demo is readable.

export type BStep = 'context' | 'readiness' | 'forms' | 'draft' | 'approval'
export type StepStatus = 'pending' | 'running' | 'complete' | 'needs_info'
export const B_STEPS: BStep[] = ['context', 'readiness', 'forms', 'draft', 'approval']

export type HitlDecision = 'escalated' | 'reassigned' | null
export type Decision = 'approved' | 'rejected' | null

interface DemoState {
  scenario: DemoScenario | null
  panelOpen: boolean
  phase: 'running' | 'result'
  // Path A
  answerLen: number
  // Path B — progressive reveal (pure functions of which beat fired)
  stepStatus: Record<BStep, StepStatus>
  activeStep: BStep
  evidenceRevealed: number
  readinessRevealed: number
  readinessReady: boolean
  formsReady: boolean
  draftReady: boolean
  complianceReady: boolean
  approvalReady: boolean
  // interaction / action-button demo state
  checklist: Record<string, boolean>
  decision: Decision
  hitl: HitlDecision
  caseSaved: boolean
  reviewRequested: boolean
  // actions
  start: (id: string) => void
  close: () => void
  replay: () => void
  skip: () => void
  togglePanel: () => void
  setActiveStep: (s: BStep) => void
  toggleChecklist: (id: string) => void
  approve: () => void
  reject: () => void
  decideHitl: (d: Exclude<HitlDecision, null>) => void
  saveCase: () => void
  requestReview: () => void
}

const DemoCtx = createContext<DemoState | null>(null)

const ALL_PENDING: Record<BStep, StepStatus> = {
  context: 'pending',
  readiness: 'pending',
  forms: 'pending',
  draft: 'pending',
  approval: 'pending',
}

const BEAT_MS = 1600 // cadence between agent events (demo readability)

function autoChecklist(s: DemoScenario, escalate: boolean): Record<string, boolean> {
  const next: Record<string, boolean> = {}
  for (const item of s.reviewChecklist ?? []) {
    next[item.id] = item.auto ? (item.id === 'compliance' ? !escalate : true) : false
  }
  return next
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [scenario, setScenario] = useState<DemoScenario | null>(null)
  const [panelOpen, setPanelOpen] = useState(true)
  const [phase, setPhase] = useState<'running' | 'result'>('running')
  const [answerLen, setAnswerLen] = useState(0)
  const [stepStatus, setStepStatus] = useState<Record<BStep, StepStatus>>(ALL_PENDING)
  const [activeStep, setActiveStep] = useState<BStep>('context')
  const [evidenceRevealed, setEvidenceRevealed] = useState(0)
  const [readinessRevealed, setReadinessRevealed] = useState(0)
  const [readinessReady, setReadinessReady] = useState(false)
  const [formsReady, setFormsReady] = useState(false)
  const [draftReady, setDraftReady] = useState(false)
  const [complianceReady, setComplianceReady] = useState(false)
  const [approvalReady, setApprovalReady] = useState(false)
  const [checklist, setChecklist] = useState<Record<string, boolean>>({})
  const [decision, setDecision] = useState<Decision>(null)
  const [hitl, setHitl] = useState<HitlDecision>(null)
  const [caseSaved, setCaseSaved] = useState(false)
  const [reviewRequested, setReviewRequested] = useState(false)

  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const interval = useRef<ReturnType<typeof setInterval> | null>(null)
  // Guards against a slow /chat resolving into a run the associate already left.
  const runToken = useRef(0)

  const clearAll = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    if (interval.current) {
      clearInterval(interval.current)
      interval.current = null
    }
  }, [])

  useEffect(() => () => clearAll(), [clearAll])

  const at = (ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms))
  }

  const resetProgress = () => {
    setPhase('running')
    setAnswerLen(0)
    setStepStatus(ALL_PENDING)
    setActiveStep('context')
    setEvidenceRevealed(0)
    setReadinessRevealed(0)
    setReadinessReady(false)
    setFormsReady(false)
    setDraftReady(false)
    setComplianceReady(false)
    setApprovalReady(false)
    setChecklist({})
    setDecision(null)
    setHitl(null)
    setCaseSaved(false)
    setReviewRequested(false)
  }

  // Path A — reasoning events + answer text stream in together.
  const playPathA = useCallback((s: DemoScenario) => {
    s.reasoning.forEach((_, i) => at(700 * (i + 1), () => setEvidenceRevealed(i + 1)))
    const full = s.answer ?? ''
    const CHUNK = Math.max(5, Math.round(full.length / 70))
    interval.current = setInterval(() => {
      setAnswerLen((n) => {
        const next = n + CHUNK
        if (next >= full.length) {
          if (interval.current) clearInterval(interval.current)
          interval.current = null
          setPhase('result')
          return full.length
        }
        return next
      })
    }, 70)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Path B — one gated event per beat; steps go running → complete gradually.
  const playPathB = useCallback((s: DemoScenario) => {
    const escalate = s.readiness === 'escalate'
    const nChecks = (s.readinessChecks ?? []).length
    const clampChecks = (k: number) => setReadinessRevealed(Math.min(k, nChecks))

    at(BEAT_MS * 1, () => setEvidenceRevealed(2)) // customer-specific gate
    at(BEAT_MS * 2, () => { setEvidenceRevealed(3); clampChecks(1) }) // profile → customer found
    at(BEAT_MS * 3, () => setEvidenceRevealed(4)) // customer-found gate
    at(BEAT_MS * 4, () => { setEvidenceRevealed(5); clampChecks(2) }) // IRA / accounts
    at(BEAT_MS * 5, () => { setEvidenceRevealed(6); clampChecks(4) }) // source plan (rollover-allowed + loan)
    at(BEAT_MS * 6, () => { setEvidenceRevealed(7); clampChecks(5) }) // restrictions
    at(BEAT_MS * 7, () => { setEvidenceRevealed(8); clampChecks(nChecks) }) // identity → all checks in
    at(BEAT_MS * 8, () => {
      setEvidenceRevealed(9) // validate / readiness result
      setStepStatus((st) => ({ ...st, readiness: escalate ? 'needs_info' : 'complete', forms: 'running' }))
      setActiveStep('forms')
      setReadinessReady(true)
    })
    at(BEAT_MS * 9, () => {
      setEvidenceRevealed(10) // guardrails gate
      setStepStatus((st) => ({ ...st, forms: 'complete', draft: 'running' }))
      setActiveStep('draft')
      setFormsReady(true)
    })
    at(BEAT_MS * 10, () => {
      setEvidenceRevealed(11) // done / escalate
      setStepStatus((st) => ({
        ...st,
        draft: escalate ? 'needs_info' : 'complete',
        approval: 'pending',
      }))
      setActiveStep('approval')
      setDraftReady(true)
      setComplianceReady(true)
      setApprovalReady(true)
      setChecklist(autoChecklist(s, escalate))
      setPhase('result')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const start = useCallback(
    (id: string) => {
      const base = getScenario(id)
      if (!base) return
      clearAll()
      const token = ++runToken.current
      setScenario(base)
      setPanelOpen(true)
      resetProgress()

      // Fire the REAL backend /chat (which performs real MCP tool calls), then
      // play the run over the live response. Falls back to the scripted scenario
      // if the backend is unreachable, so the demo still works fully offline.
      if (base.path === 'A_augmented_llm') {
        setEvidenceRevealed(1) // never-blank: show the router step immediately
        postChat({ message: base.question })
          .then((resp) => {
            if (runToken.current !== token) return
            const live = buildLiveScenario(base, resp)
            setScenario(live)
            playPathA(live)
          })
          .catch(() => {
            if (runToken.current !== token) return
            playPathA(base)
          })
        return
      }

      // Path B — never-blank beat 0 while the real tool chain runs.
      setStepStatus({ ...ALL_PENDING, context: 'complete', readiness: 'running' })
      setActiveStep('readiness')
      setEvidenceRevealed(1)
      postChat({ message: base.question, customer_id: base.customerId })
        .then((resp) => {
          if (runToken.current !== token) return
          const live = buildLiveScenario(base, resp)
          setScenario(live)
          playPathB(live)
        })
        .catch(() => {
          if (runToken.current !== token) return
          playPathB(base)
        })
    },
    [clearAll, playPathA, playPathB],
  )

  // Jump straight to the settled end-state (Skip control).
  const skip = useCallback(() => {
    if (!scenario) return
    clearAll()
    const s = scenario
    if (s.path === 'A_augmented_llm') {
      setAnswerLen((s.answer ?? '').length)
      setEvidenceRevealed(s.reasoning.length)
      setPhase('result')
      return
    }
    const escalate = s.readiness === 'escalate'
    setStepStatus({
      context: 'complete',
      readiness: escalate ? 'needs_info' : 'complete',
      forms: 'complete',
      draft: escalate ? 'needs_info' : 'complete',
      approval: 'pending',
    })
    setActiveStep('approval')
    setEvidenceRevealed(s.reasoning.length)
    setReadinessRevealed((s.readinessChecks ?? []).length)
    setReadinessReady(true)
    setFormsReady(true)
    setDraftReady(true)
    setComplianceReady(true)
    setApprovalReady(true)
    setChecklist(autoChecklist(s, escalate))
    setPhase('result')
  }, [scenario, clearAll])

  const replay = useCallback(() => {
    if (scenario) start(scenario.id)
  }, [scenario, start])

  // Deep-link: ?demo=<scenario-id> auto-opens a case (handy for presenting).
  useEffect(() => {
    if (typeof window === 'undefined') return
    const id = new URL(window.location.href).searchParams.get('demo')
    if (id) start(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const close = useCallback(() => {
    clearAll()
    setScenario(null)
    resetProgress()
  }, [clearAll])

  const value = useMemo<DemoState>(
    () => ({
      scenario,
      panelOpen,
      phase,
      answerLen,
      stepStatus,
      activeStep,
      evidenceRevealed,
      readinessRevealed,
      readinessReady,
      formsReady,
      draftReady,
      complianceReady,
      approvalReady,
      checklist,
      decision,
      hitl,
      caseSaved,
      reviewRequested,
      start,
      close,
      replay,
      skip,
      togglePanel: () => setPanelOpen((o) => !o),
      setActiveStep: (s) => setActiveStep(s),
      toggleChecklist: (id) => setChecklist((c) => ({ ...c, [id]: !c[id] })),
      approve: () => setDecision('approved'),
      reject: () => setDecision('rejected'),
      decideHitl: (d) => setHitl(d),
      saveCase: () => setCaseSaved(true),
      requestReview: () => setReviewRequested(true),
    }),
    [scenario, panelOpen, phase, answerLen, stepStatus, activeStep, evidenceRevealed, readinessRevealed, readinessReady, formsReady, draftReady, complianceReady, approvalReady, checklist, decision, hitl, caseSaved, reviewRequested, start, close, replay, skip],
  )

  return <DemoCtx.Provider value={value}>{children}</DemoCtx.Provider>
}

export function useDemo(): DemoState {
  const ctx = useContext(DemoCtx)
  if (!ctx) throw new Error('useDemo must be used within a DemoProvider')
  return ctx
}
