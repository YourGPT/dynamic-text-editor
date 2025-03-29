import { useState, useRef } from "react";
import { DynamicTextEditor, DynamicTextEditorRef } from "dynamic-text-editor";
import { defaultSuggestions } from "./constants";

function App() {
  const [promptValue, setPromptValue] = useState<string>("Hello {{VISITOR.name}},\nWelcome to {{CONTACT.company}}!");
  const editorRef = useRef<DynamicTextEditorRef>(null);

  // Example of how to programmatically update the editor content
  const updateEditorContent = () => {
    if (editorRef.current) {
      editorRef.current.setValue("Updated content with {{VISITOR.email}}!");
    }
  };
  console.log(JSON.stringify(promptValue));

  return (
    <div className="container mx-auto p-12">
      <h2 className="mb-6 text-lg font-medium">Dynamic Prompt Editor Demo</h2>
      <section className="max-h-[300px]">
        <DynamicTextEditor ref={editorRef} value={promptValue} onChange={setPromptValue} suggestions={defaultSuggestions} classNames={{ editor: "max-h-[300px] overflow-y-auto" }} showCustomToolbar />
      </section>

      <section className="mt-4">
        <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" onClick={updateEditorContent}>
          Update Editor Content
        </button>
      </section>

      <section className="mt-4">
        <h4 className="mb-2 text-sm font-medium">Current Value</h4>
        <p className="text-gray-500 whitespace-pre">{promptValue}</p>
      </section>
    </div>
  );
}

export default App;
