import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// The App component should import from 'dynamic-text-editor'
// which will resolve to either the local or published version
// depending on which script you ran (use-local or use-published)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
