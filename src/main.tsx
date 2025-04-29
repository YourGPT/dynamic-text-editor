import { StrictMode, useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { DynamicTextEditor } from "./components/DynamicTextEditor";
import type { DynamicTextEditorRef } from "./components/DynamicTextEditor/types";

import "./utils/demo.css";
import { defaultSuggestions } from "./utils/constants";
import { CMEditorDemo } from "./components/CMEditorDemo";

const DEFAULT_VAL = "As an EcommerceBot for the online shopping platform, your mission is to assist customers effectively and enhance their shopping experience.\n\n\n\n\n{{gt a='value1' b='value2'}}\n\nkkklkl\n  \n\n  \n\n  \n\n  \n\nassa";

const Demo = () => {
  const editorRef = useRef<DynamicTextEditorRef>(null);
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem("editor-value");
    return stored || DEFAULT_VAL;
  });

  const maxCharCount = 100; // Set a 100 character limit

  useEffect(() => {
    localStorage.setItem("editor-value", value);
  }, [value]);

  return (
    <div className="dynamic-text-editor-demo">
      <h1>CodeMirror Variable Editor</h1>

      <div style={{ marginBottom: "40px" }}>
        <h2>Full Demo Component</h2>
        <CMEditorDemo maxCharCount={maxCharCount} />
      </div>

      {/* <h2>Original DynamicTextEditor</h2>
      <button onClick={() => editorRef.current?.setValue(DEFAULT_VAL)}>Add Value</button> */}

      <div>
        {/* <DynamicTextEditor ref={editorRef} onChange={setValue} initialValue={value} suggestions={defaultSuggestions} classNames={{}} className="" showCustomToolbar /> */}

        {/* <textarea style={{ width: "400px", height: "200px" }} value={value} onChange={(e) => setValue(e.target.value)} /> */}
        {/* <div className="mt-4">
          <h4 className="" style={{ whiteSpace: "pre-wrap" }}>
            Value:
          </h4>
          <pre>{value}</pre>
        </div> */}

        <div>
          <h4 className="" style={{ whiteSpace: "pre-wrap" }}>
            Default Value:
          </h4>
          <pre>{DEFAULT_VAL}</pre>
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
