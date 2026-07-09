import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

/** Top-level error boundary so an uncaught render/lifecycle throw shows a
 *  recoverable message instead of a blank white screen. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    // Surface for debugging; the UI stays usable via the reset button.
    console.error('[ErrorBoundary] caught:', error)
  }

  reset = () => this.setState({ error: null })

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
          <div className="max-w-md rounded-xl border border-border bg-card p-6 shadow-card">
            <h1 className="text-lg font-semibold text-ink">Something went wrong</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The workspace hit an unexpected error and stopped rendering. Your data is
              safe — you can return to your cases and try again.
            </p>
            <pre className="mt-3 max-h-32 overflow-auto rounded-md bg-muted/60 p-2 text-left text-[11px] text-ink-soft">
              {this.state.error.message}
            </pre>
            <div className="mt-4 flex justify-center gap-2">
              <button
                type="button"
                onClick={this.reset}
                className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
              >
                Back to cases
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:bg-muted"
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
