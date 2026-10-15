import { Component, type ReactNode } from 'react';
import { DemoRepository } from '../services/demo';
import { isDemo } from '../services/supabase';
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="access-denied">
        <h1>Something didn’t load correctly.</h1>
        <p>Your saved records have not been automatically reset. Try reloading the workspace.</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Reload EcoSort
        </button>
        {isDemo && (
          <button
            className="btn btn-secondary"
            onClick={() => {
              if (
                window.confirm('Replace all local demo changes and photos with fictional examples?')
              ) {
                new DemoRepository(localStorage).reset();
                window.location.assign('/signin');
              }
            }}
          >
            Restore demo examples
          </button>
        )}
      </main>
    );
  }
}
