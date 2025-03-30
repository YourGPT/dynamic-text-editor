import { useState, useRef } from "react";
import { DynamicTextEditor, DynamicTextEditorRef } from "dynamic-prompt-editor";
import { defaultSuggestions } from "./constants";
import { Sun, Moon, PencilRuler } from "lucide-react";

function App() {
  const [promptValue, setPromptValue] = useState<string>("Hello {{VISITOR.name}},\nWelcome to {{CONTACT.company}}!");
  const editorRef = useRef<DynamicTextEditorRef>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(document.documentElement.classList.contains("dark"));

  // Example of how to programmatically update the editor content
  const updateEditorContent = () => {
    if (editorRef.current) {
      editorRef.current.setValue("Updated content with {{VISITOR.email}}!");
    }
  };

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className="bg-background min-h-screen w-full text-foreground">
      <div className="container mx-auto p-6 md:p-12">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 bg-card rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <PencilRuler className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Dynamic Prompt Editor Demo</h2>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors" onClick={toggleTheme}>
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <section className="bg-card rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">Editor</h3>
              <DynamicTextEditor
                ref={editorRef}
                value={promptValue}
                onChange={setPromptValue}
                suggestions={defaultSuggestions}
                classNames={{
                  container: "max-h-[400px] overflow-y-auto border border-border rounded-md bg-background/50 [&>div]:p-4",
                  editor: "text-sm",
                }}
                className=""
                showCustomToolbar
              />
            </section>

            <section className="bg-card rounded-lg p-6">
              <h4 className="text-base font-medium mb-3">Actions</h4>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors" onClick={updateEditorContent}>
                Update Editor Content
              </button>
            </section>
          </div>

          <section className="bg-card rounded-lg p-6 shadow-md h-fit lg:sticky lg:top-6">
            <h4 className="text-base font-medium mb-3">Current Value</h4>
            <div className="bg-muted p-4 rounded-md overflow-x-auto min-h-[400px] flex flex-col">
              <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
                <span>Preview</span>
                <span>{promptValue.length} characters</span>
              </div>
              <div className="flex-1 overflow-auto">
                <p className="text-muted-foreground whitespace-pre font-mono text-sm">{promptValue}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default App;
