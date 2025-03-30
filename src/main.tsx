import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DynamicTextEditor } from "./components/DynamicTextEditor";

import "./utils/demo.css";
import { defaultSuggestions } from "./utils/constants";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div className="container">
      <DynamicTextEditor onChange={() => {}} value={""} suggestions={defaultSuggestions} classNames={{}} className="dynamic-text-editor-demo" showCustomToolbar />
    </div>
  </StrictMode>
);
