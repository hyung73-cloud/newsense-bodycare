import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-surface text-center px-6">
          <div className="w-14 h-14 rounded-full bg-red-100 text-red-500 flex items-center justify-center mb-4 text-2xl">
            !
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">화면을 표시하지 못했습니다</h1>
          <p className="text-sm text-gray-500 mb-4 max-w-md break-all">{this.state.error.message}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-blue-700"
          >
            새로고침
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
