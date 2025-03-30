import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { DynamicTextEditor } from "./components/DynamicTextEditor";

import "./utils/demo.css";
import { defaultSuggestions } from "./utils/constants";

const Demo = () => {
  const [value, setValue] = useState("");

  return (
    <div className="dynamic-text-editor-demo">
      <div>
        <DynamicTextEditor onChange={setValue} value={value} suggestions={defaultSuggestions} classNames={{}} className="" showCustomToolbar />
        <div className="mt-4">
          <h4 className="">Value:</h4>
          <pre>{value}</pre>
        </div>
      </div>
    </div>
  );
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div className="container">
      <Demo />
    </div>
  </StrictMode>
);
