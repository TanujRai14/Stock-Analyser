import React from "react";

/**
 * Wrap any widget that touches unpredictable data (charts, computed
 * aggregates) so a thrown error shows a contained fallback instead of
 * white-screening the whole dashboard.
 *
 * Usage: <ErrorBoundary label="Sector heatmap"><SectorHeatmap rows={rows} /></ErrorBoundary>
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error(`[ErrorBoundary${this.props.label ? `: ${this.props.label}` : ""}]`, error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-5 text-sm text-rose-200">
          <p className="font-medium">{this.props.label || "This widget"} couldn't render.</p>
          <p className="mt-1 text-xs text-rose-300/80">
            Check the browser console for details — likely an unexpected data shape from the backend.
          </p>
          <button
            onClick={this.handleReset}
            className="mt-3 rounded-lg border border-rose-400/30 px-3 py-1.5 text-xs font-medium hover:bg-rose-400/10"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
