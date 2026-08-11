import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Rendering failures are contained here so the WebView never becomes blank.
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-shell flex min-h-[100dvh] items-center justify-center px-5">
          <section className="error-panel" role="alert">
            <span className="eyebrow">国学老师</span>
            <h1>页面暂时没有加载完整</h1>
            <p>请返回后重新进入，或稍后再试。</p>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}
