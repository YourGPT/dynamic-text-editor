// export { default as DraftPromptEditor } from "./components/DraftPromptEditor";
// export type { DraftPromptEditorRef, DraftPromptEditorProps, BaseEditorItem, EditorClassNames } from "./types/editor";

// Explicitly import CSS so it's bundled with JS
import "./components/DynamicTextEditor/styles/editor.css";
import "./components/DynamicTextEditor/styles/suggestions.css";

export { useDynamicTextEditor } from "./components/DynamicTextEditor/hooks/useDynamicTextEditor";
export type { useDynamicTextEditorProps } from "./components/DynamicTextEditor/hooks/useDynamicTextEditor";
export { DynamicTextEditor } from "./components/DynamicTextEditor";
export type { DynamicTextEditorProps, DynamicTextEditorRef, BaseEditorItem } from "./components/DynamicTextEditor/types";
