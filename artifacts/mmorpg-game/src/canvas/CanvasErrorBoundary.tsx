// ==============================================================================
// CanvasErrorBoundary.tsx
// Zero-Crash Guard for React Three Fiber 3D Canvas Subtrees
// Prevents unhandled 3D mesh/text exceptions from unmounting the WebGL Scene
// ==============================================================================

import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  name?: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage?: string;
}

export class CanvasErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || String(error),
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      `[CanvasErrorBoundary] Caught exception in 3D layer "${this.props.name || "Unknown"}":`,
      error,
      errorInfo
    );
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}

