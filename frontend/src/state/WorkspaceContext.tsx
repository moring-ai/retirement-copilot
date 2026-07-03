import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type Dispatch,
  type ReactNode,
} from 'react'
import type { WorkspaceState } from '@/types'
import {
  createInitialState,
  workspaceReducer,
  type Action,
} from '@/state/workspace-reducer'
import { useAgentBus } from '@/hooks/useAgentBus'
import { publish, getPersistedRuns } from '@/lib/agentBus'
import { CURRENT_ASSOCIATE } from '@/data/cases'

interface WorkspaceContextValue {
  state: WorkspaceState
  dispatch: Dispatch<Action>
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(workspaceReducer, undefined, () =>
    createInitialState(),
  )
  return (
    <WorkspaceContext.Provider value={{ state, dispatch }}>
      <WorkspaceBusBridge />
      {children}
    </WorkspaceContext.Provider>
  )
}

/** Bridges the cross-tab agent bus into the associate reducer: a customer's
 *  AGENT_RUN implicitly creates/advances the matching case; opening that case
 *  sends a quiet "reviewed by your associate" stamp back to the customer. */
function WorkspaceBusBridge() {
  const { state, dispatch } = useWorkspace()
  const stamped = useRef<Set<string>>(new Set())

  // Catch up on any customer runs that happened before this tab opened/reloaded
  // (BroadcastChannel has no replay). Ingest is idempotent (upsert by case id).
  useEffect(() => {
    getPersistedRuns().forEach((run) => dispatch({ type: 'INGEST_AGENT_RUN', run }))
  }, [dispatch])

  useAgentBus((e) => {
    if (e.type === 'AGENT_RUN') dispatch({ type: 'INGEST_AGENT_RUN', run: e })
  })

  useEffect(() => {
    const id = state.activeCaseId
    if (
      state.view === 'workspace' &&
      id &&
      id.startsWith('WEB-') &&
      !stamped.current.has(id)
    ) {
      const c = state.cases.find((x) => x.id === id)
      stamped.current.add(id)
      publish({
        type: 'ASSOCIATE_STAMP',
        caseId: id,
        customerId: c?.customerId ?? '',
        label: 'Reviewed by your associate',
        associate: CURRENT_ASSOCIATE,
        at: Date.now(),
      })
    }
  }, [state.view, state.activeCaseId, state.cases])

  return null
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return ctx
}
