import { useEffect } from 'react'
import { useDemo } from '@/state/DemoContext'
import { useWorkspace } from '@/state/WorkspaceContext'
import { PathAWorkspace } from './PathAWorkspace'
import { PathBWorkspace } from './PathBWorkspace'

// The case-run overlay. Branches into the correct experience for the selected
// agent path — a streaming answer workspace (Path A) or the guided servicing
// workflow (Path B) — and reflects the outcome back into the queue AFTER the
// agent has done the work (never precomputed).
export function RunWorkspace() {
  const { scenario, phase, submitted, hitl } = useDemo()
  const { dispatch } = useWorkspace()

  useEffect(() => {
    if (!scenario) return
    const id = scenario.caseCard.id
    if (submitted) {
      dispatch({ type: 'SET_CASE_STAGE', caseId: id, stage: 'submitted', progressPct: 100, currentStep: 'review' })
    } else if (hitl) {
      dispatch({ type: 'SET_CASE_STAGE', caseId: id, stage: 'escalated', progressPct: 66, currentStep: 'goal_eligibility' })
    } else if (phase === 'result') {
      // Path A closes to the queue as an answered inquiry; Path B lands in review.
      if (scenario.path === 'A_augmented_llm') {
        dispatch({ type: 'SET_CASE_STAGE', caseId: id, stage: 'in_review', progressPct: 100, currentStep: 'response' })
      } else if (scenario.readiness === 'escalate') {
        dispatch({ type: 'SET_CASE_STAGE', caseId: id, stage: 'escalated', progressPct: 66, currentStep: 'goal_eligibility' })
      } else {
        dispatch({ type: 'SET_CASE_STAGE', caseId: id, stage: 'in_review', progressPct: 83, currentStep: 'response' })
      }
    }
  }, [scenario, phase, submitted, hitl, dispatch])

  if (!scenario) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background animate-fade-in">
      {scenario.path === 'A_augmented_llm' ? (
        <PathAWorkspace scenario={scenario} />
      ) : (
        <PathBWorkspace scenario={scenario} />
      )}
    </div>
  )
}
