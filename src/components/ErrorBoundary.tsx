// migrated to TSX — minimal strict types (controlled)
import { Component } from "react";
import i18n from "../i18n";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Unhandled render error:', error);
    console.error('[ErrorBoundary] Component stack:', info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-page" role="alert">
          <span className="error-page-code">!</span>
          <h1>{i18n.t("errors.something_went_wrong", "Something went wrong")}</h1>
          <p>{String(this.state.error?.message || this.state.error)}</p>
          <button className="btn-primary" onClick={() => window.location.reload()}>
            {i18n.t("errors.reload_page", "Reload page")}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
