import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DynamicTextEditor } from "./components/DynamicTextEditor";
import type { BaseEditorItem } from "./components/DynamicTextEditor/types";

import "./utils/demo.css";
import { defaultSuggestions } from "./utils/constants";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DynamicTextEditor onChange={() => {}} value={""} suggestions={defaultSuggestions} classNames={{}} showCustomToolbar />
  </StrictMode>
);
