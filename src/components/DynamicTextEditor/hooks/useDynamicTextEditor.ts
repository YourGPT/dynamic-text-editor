import { useEffect, useRef, useState, useCallback } from "react";
import { DynamicTextEditorProps, BaseEditorItem } from "../types";
import usePaint from "./usePaint";
import useQuill from "./useQuill";
import Quill from "quill";
// import useMarkdownShortcuts from "./useMarkdownShortcuts";

import { ToolbarConfig } from "../types";

type useDynamicTextEditorProps = {
  theme?: "snow" | "bubble";
  placeholder?: string;
  classNames?: object;
  value?: string;
  defaultValue?: string;
  readOnly?: boolean;
  fontSize?: string;
  lineHeight?: string;
  width?: string;
  height?: string;
  toolbar?: boolean | ToolbarConfig;
  formats?: string[];
  onChange?: (content: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  suggestions: BaseEditorItem[];
  suggestionTrigger?: string;
  suggestionClosing?: string;
};

type useDynamicTextEditorReturn = {
  quillRef: React.RefObject<HTMLDivElement>;
  quillInstance: Quill | null;
  editorState: string;
  setEditorState: (content: string) => void;
  clearContent: () => void;
  focus: () => void;
  blur: () => void;
  suggestionState: SuggestionState;
  insertSuggestion: (item: BaseEditorItem) => void;
  // processMarkdown: (text: string) => void;
};

interface SuggestionState {
  isOpen: boolean;
  items: BaseEditorItem[];
  filteredItems: BaseEditorItem[];
  selectedIndex: number;
  triggerPosition: { top: number; left: number };
}

const defaultToolbarOptions: ToolbarConfig = [["bold", "italic", "underline"], ["blockquote", "code-block"], [{ header: [1, 2] }], [{ list: "ordered" }, { list: "bullet" }], [{ align: [] }], ["clean"]];

export const useDynamicTextEditor = ({
  theme = "snow",
  placeholder = "Write something...",
  value,
  defaultValue = "",
  fontSize = "1rem",
  lineHeight = "1.5",
  width = "100%",
  height = "auto",
  toolbar = true,
  formats = ["bold", "italic", "underline", "blockquote", "code-block", "header", "list", "align"],
  onChange,
  onFocus,
  onBlur,
  suggestions,
  suggestionTrigger = "{{",
  suggestionClosing = "}}",
}: DynamicTextEditorProps): useDynamicTextEditorReturn => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [editorState, setEditorState] = useState<string>(value || defaultValue);
  const prevToolbarRef = useRef(toolbar);

  // Add a flag to track if we're manually modifying text
  const isModifyingText = useRef<boolean>(false);

  // Handle text change events
  const handleTextChange = useCallback(
    (html: string) => {
      // Skip if we're programmatically modifying
      console.log("html", html);
      if (isModifyingText.current) return;

      // Update our local state immediately
      setEditorState(html);

      // Call the onChange callback with the HTML content
      if (onChange) {
        onChange(html);
      }
    },
    [onChange]
  );

  // Initialize Quill using our useQuill hook
  const {
    quill: quillInstance,
    setContent,
    clearContent,
    reinitialize,
  } = useQuill({
    container: containerRef,
    theme,
    placeholder,
    // readOnly,
    formats: ["template-variable"],
    toolbar: toolbar === true ? defaultToolbarOptions : toolbar,
    defaultValue: value || defaultValue,
    onTextChange: handleTextChange,
  });

  // We no longer use useSuggestions hook
  // Instead we'll use the integrated Suggestions component
  // Define a stub for the suggestionState to maintain compatibility
  const suggestionState = {
    isOpen: false,
    items: suggestions,
    filteredItems: suggestions,
    selectedIndex: 0,
    triggerPosition: { top: 0, left: 0 },
  };

  // Stub for insertSuggestion function - will be handled by Suggestions component
  const insertSuggestion = useCallback((item: BaseEditorItem) => {
    console.log("insertSuggestion called with:", item);
    // This is now handled directly in the Suggestions component
  }, []);

  // Use the template highlighting hook
  const { highlightTemplates } = usePaint({
    quillInstance,
    trigger: suggestionTrigger,
    closingChar: suggestionClosing,
  });

  // Initialize Markdown shortcuts with our modification tracking flag
  // const { processMarkdown } = useMarkdownShortcuts(quillInstance, isModifyingText);

  // Apply custom styles to Quill
  useEffect(() => {
    if (!quillInstance) return;

    quillInstance.root.style.fontSize = fontSize;
    quillInstance.root.style.lineHeight = lineHeight;
    quillInstance.root.style.width = width;
    quillInstance.root.style.height = height;
  }, [quillInstance, fontSize, lineHeight, width, height]);

  // Add event listeners for focus/blur
  useEffect(() => {
    if (!quillInstance) return;

    if (onFocus) {
      quillInstance.root.addEventListener("focus", onFocus);
    }

    if (onBlur) {
      quillInstance.root.addEventListener("blur", onBlur);
    }

    return () => {
      if (onFocus) {
        quillInstance.root.removeEventListener("focus", onFocus);
      }

      if (onBlur) {
        quillInstance.root.removeEventListener("blur", onBlur);
      }
    };
  }, [quillInstance, onFocus, onBlur]);

  // Handle toolbar changes
  useEffect(() => {
    if (!quillInstance) return;

    // Only reinitialize if toolbar actually changed
    const toolbarChanged = JSON.stringify(prevToolbarRef.current) !== JSON.stringify(toolbar);
    prevToolbarRef.current = toolbar;

    if (!toolbarChanged) return;

    // Store selection and focus state for restoration
    const wasFocused = document.activeElement === quillInstance.root;
    const selection = quillInstance.getSelection();
    const content = quillInstance.root.innerHTML;

    // Use our reinitialize method from useQuill
    reinitialize();

    // Use setTimeout to ensure the editor is fully reinitialized
    setTimeout(() => {
      if (!quillInstance) return;

      // Restore content
      setContent(content);

      // Restore focus and selection
      if (wasFocused) {
        quillInstance.focus();
        if (selection) {
          quillInstance.setSelection(selection.index, selection.length);
        }
      }

      // Highlight templates
      highlightTemplates();
    }, 10);
  }, [toolbar, quillInstance, reinitialize, setContent, highlightTemplates]);

  // We're removing the useEffect for value prop changes
  // since we're now handling it as an uncontrolled component

  // Add CSS for template formatting
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
            .template-variable {
            background-color: #d0e8ff;
            color: #0050b3;
            border-radius: 4px;
            padding: 2px 4px;
            font-weight: 500;
            border: 1px solid #b7daff;
            }`;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Enhanced setEditorState function to update Quill content
  const updateEditorState = useCallback(
    (content: string) => {
      try {
        // Set flag to indicate we're manually modifying text
        isModifyingText.current = true;

        // Set content in Quill
        setContent(content);

        // Update local state
        setEditorState(content);

        // Apply highlighting
        setTimeout(() => {
          highlightTemplates();
          // Reset flag after a small delay to ensure DOM operations are complete
          setTimeout(() => {
            isModifyingText.current = false;
          }, 50);
        }, 10);
      } catch (error) {
        console.error("Error updating editor state:", error);
        isModifyingText.current = false;
      }
    },
    [setContent, highlightTemplates]
  );

  return {
    quillRef: containerRef,
    quillInstance,
    editorState,
    setEditorState: updateEditorState,
    clearContent,
    focus: useCallback(() => quillInstance?.focus(), [quillInstance]),
    blur: useCallback(() => quillInstance?.blur(), [quillInstance]),
    suggestionState,
    insertSuggestion,
    // processMarkdown,
  };
};

export type { useDynamicTextEditorProps, useDynamicTextEditorReturn };
export default useDynamicTextEditor;
