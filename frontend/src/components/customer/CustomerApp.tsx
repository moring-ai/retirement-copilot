import { useCallback, useReducer } from 'react'
import { CUSTOMERS } from '@/data/customers'
import { postChat } from '@/lib/chatContract'
import { publish, nextId, type AgentRunEvent } from '@/lib/agentBus'
import { useAgentBus } from '@/hooks/useAgentBus'
import { Cover } from './Cover'
import { Dossier } from './Dossier'
import { Guide } from './Guide'
import { BackstageMount } from '@/components/backstage/BackstageMount'
import {
  customerReducer,
  initialCustomerState,
  pathAMessage,
  guideMessage,
  webCaseId,
  DEFAULT_GOAL_ID,
  DEFAULT_GOAL_LABEL,
  type GuideTopic,
} from './customerMachine'

export function CustomerApp() {
  const [state, dispatch] = useReducer(customerReducer, undefined, initialCustomerState)

  // Reverse channel: the associate's review appears as a quiet margin stamp.
  useAgentBus((e) => {
    if (e.type === 'ASSOCIATE_STAMP' && e.caseId === state.caseId) {
      dispatch({ type: 'ADD_STAMP', stamp: { label: e.label, associate: e.associate, at: e.at } })
    }
  })

  // Path A — a customer's own rollover (router picks Augmented LLM: RAG + MCP).
  const onIdentify = useCallback(async (customerId: string) => {
    const name = CUSTOMERS[customerId].name
    const caseId = webCaseId(customerId)
    dispatch({ type: 'START_PATH_A', customerId, customerName: name, caseId })
    try {
      const response = await postChat({
        message: pathAMessage(),
        customer_id: customerId,
        session_id: caseId,
      })
      const run: AgentRunEvent = {
        type: 'AGENT_RUN',
        runId: nextId('run'),
        caseId,
        customerId,
        customerName: name,
        goalId: DEFAULT_GOAL_ID,
        goalLabel: DEFAULT_GOAL_LABEL,
        path: response.path,
        stage: 'eligibility',
        response,
        at: Date.now(),
      }
      dispatch({ type: 'RUN_READY', response, run })
      publish(run)
    } catch {
      dispatch({ type: 'RUN_ERROR' })
    }
  }, [])

  // Path B — general education (router picks the Prompt Chain: RAG + skills).
  const onExplore = useCallback(async (topic: GuideTopic) => {
    dispatch({ type: 'START_GUIDE', topic })
    try {
      const response = await postChat({ message: guideMessage(topic) })
      const run: AgentRunEvent = {
        type: 'AGENT_RUN',
        runId: nextId('run'),
        caseId: '',
        customerId: '',
        customerName: '',
        goalId: '',
        goalLabel: '',
        path: response.path,
        stage: 'education',
        response,
        at: Date.now(),
      }
      dispatch({ type: 'RUN_READY', response, run })
      publish(run)
    } catch {
      dispatch({ type: 'RUN_ERROR' })
    }
  }, [])

  const onAcceptForms = useCallback(() => {
    dispatch({ type: 'ACK_FORMS' })
    if (state.caseId) {
      publish({
        type: 'CUSTOMER_ACTIVITY',
        caseId: state.caseId,
        customerId: state.customerId ?? '',
        label: 'Uploaded rollover paperwork',
        at: Date.now(),
      })
    }
  }, [state.caseId, state.customerId])

  const onSave = useCallback(() => {
    dispatch({ type: 'SAVE_DOSSIER' })
    if (state.caseId) {
      publish({
        type: 'CUSTOMER_ACTIVITY',
        caseId: state.caseId,
        customerId: state.customerId ?? '',
        label: 'Approved their plan',
        at: Date.now(),
      })
    }
  }, [state.caseId, state.customerId])

  let content: React.ReactNode
  if (state.status === 'error') {
    content = (
      <div className="paper flex min-h-screen items-center justify-center px-6 text-center">
        <div>
          <p className="paper-serif text-xl text-[color:var(--paper-ink)]">
            We couldn't reach the servicing agent.
          </p>
          <p className="mt-2 text-sm text-[color:var(--paper-ink-soft)]">
            Make sure the backend is running on port 8080, then try again.
          </p>
          <button
            type="button"
            onClick={() => dispatch({ type: 'RESET' })}
            className="mt-4 rounded-lg bg-[#0b7a4e] px-4 py-2 text-sm font-medium text-white"
          >
            Start over
          </button>
        </div>
      </div>
    )
  } else if (state.screen === 'guide') {
    content = (
      <Guide
        state={state}
        onStartPersonal={() => dispatch({ type: 'RESET' })}
        onBack={() => dispatch({ type: 'RESET' })}
      />
    )
  } else if (state.screen === 'dossier') {
    content = (
      <Dossier
        state={state}
        dispatch={dispatch}
        onAcceptForms={onAcceptForms}
        onSave={onSave}
      />
    )
  } else {
    content = <Cover onIdentify={onIdentify} onExplore={onExplore} />
  }

  return (
    <>
      {content}
      <BackstageMount run={state.lastRun} />
    </>
  )
}
