import React, { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/oswald/700.css";
import "@fontsource/space-mono/400.css";
import "@fontsource/space-mono/700.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/kalam/400.css";
const App = lazy(() => import("./App"));
import "./styles.css";
class ReferenceBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="loading-desk">
        <span className="mini-logo">[ sj. ]</span>
        <h1>Lost a page.</h1>
        <p>
          The reference couldn’t load. Check that the local server is running.
        </p>
        <button onClick={() => location.reload()}>Try again</button>
      </div>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ReferenceBoundary>
      <Suspense
        fallback={
          <div className="loading-desk">
            <span className="mini-logo">[ sj. ]</span>
            <p>Rummaging through the reference desk…</p>
          </div>
        }
      >
        <App />
      </Suspense>
    </ReferenceBoundary>
  </React.StrictMode>,
);
