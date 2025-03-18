import { useState, useRef, useEffect } from "react";
import { DynamicTextEditor, DynamicTextEditorRef } from "dynamic-text-editor";
import { defaultSuggestions } from "./constants";

function App() {
  const [promptValue, setPromptValue] = useState<string>("Hello {{VISITOR.name}}, welcome to {{CONTACT.company}}!");
  const editorRef = useRef<DynamicTextEditorRef>(null);

  useEffect(() => {
    console.log(editorRef.current);
  });

  return (
    <div className="container mx-auto p-12">
      <h2 className="mb-6 text-lg font-medium">Dynamic Prompt Editor Demo</h2>
      <section className=" max-h-[300px]">
        <DynamicTextEditor ref={editorRef} value={promptValue} onChange={setPromptValue} suggestions={defaultSuggestions} classNames={{ editor: "max-h-[300px] overflow-y-auto" }} />
      </section>

      <section>
        <h4 className="mb-2 text-sm font-medium">Value</h4>
        <div className="text-gray-500">{promptValue}</div>
      </section>
    </div>
  );
}

export default App;
