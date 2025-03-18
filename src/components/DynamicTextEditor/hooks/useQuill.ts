import { useState, useEffect, useRef, useCallback } from "react";
import Quill, { Delta } from "quill";
import "quill/dist/quill.snow.css";
import "quill/dist/quill.bubble.css";
import { ToolbarConfig } from "../types";

// Default toolbar options
const defaultToolbarOptions = [["bold", "italic", "underline"], ["blockquote", "code-block"], [{ header: 1 }, { header: 2 }], [{ list: "ordered" }, { list: "bullet" }], [{ align: [] }], ["clean"]];

// Default formats for the toolbar
const defaultFormats = [
  "bold",
  "italic",
  "underline",
  "blockquote",
  "code-block",
  "header",
  "list",
  "bullet",
  "align",
  "template-variable", // Include template format by default
];

export interface UseQuillOptions {
  container: React.RefObject<HTMLDivElement>;
  theme?: "snow" | "bubble";
  placeholder?: string;
  readOnly?: boolean;
  formats?: string[];
  toolbar?: boolean | ToolbarConfig;
  defaultValue?: string;
  onTextChange?: (html: string, delta: Delta, source: string) => void;
}

/**
 * Hook for basic Quill editor initialization and management
 */
const useQuill = ({ container, theme = "snow", placeholder = "Write something...", readOnly = false, formats = [], toolbar = true, defaultValue = "", onTextChange }: UseQuillOptions) => {
  const [quill, setQuill] = useState<Quill | null>(null);
  const hasInitializedRef = useRef(false);
  const toolbarRef = useRef(toolbar);
  const initializedRef = useRef(false);

  // Store the latest props in refs to avoid dependency issues
  const propsRef = useRef({
    theme,
    placeholder,
    readOnly,
    formats,
    toolbar,
    defaultValue,
    onTextChange,
  });

  // Update the ref whenever props change
  useEffect(() => {
    propsRef.current = {
      theme,
      placeholder,
      readOnly,
      formats,
      toolbar,
      defaultValue,
      onTextChange,
    };
  });

  // Initialize Quill instance - remove dependencies that change frequently
  const initializeQuill = useCallback(() => {
    if (!container.current || initializedRef.current) return null;

    initializedRef.current = true;

    // Clear the container and create editor element
    container.current.innerHTML = '<div class="editor-content"></div>';
    const editorElement = container.current.querySelector(".editor-content");

    if (!editorElement) {
      initializedRef.current = false;
      return null;
    }

    // Get current props from ref
    const { theme, placeholder, readOnly, formats, toolbar, defaultValue, onTextChange } = propsRef.current;

    // Configure and create Quill instance
    const toolbarConfig = toolbar === true ? defaultToolbarOptions : toolbar;
    toolbarRef.current = toolbarConfig;

    // Include necessary formats based on toolbar
    const formatsToUse = toolbar === true ? [...new Set([...defaultFormats, ...formats])] : [...formats, "template-variable"];

    try {
      const quillInstance = new Quill(editorElement as HTMLElement, {
        theme,
        placeholder,
        readOnly,
        modules: {
          ...(toolbar !== false && {
            toolbar: toolbarConfig,
          }),
          history: {
            userOnly: true,
          },
        },
        formats: formatsToUse,
      });

      // Set initial content if provided
      if (defaultValue) {
        quillInstance.clipboard.dangerouslyPasteHTML(defaultValue);
      }

      // Set up text change event handler
      if (onTextChange) {
        quillInstance.on("text-change", (delta, oldDelta, source) => {
          const html = quillInstance.root.innerHTML;
          onTextChange(html, delta, source);
        });
      }

      hasInitializedRef.current = true;
      setQuill(quillInstance);

      return quillInstance;
    } catch (error) {
      console.error("Error initializing Quill:", error);
      initializedRef.current = false;
      return null;
    }
  }, [container]); // Only depend on container ref

  // Initialize on mount only once
  useEffect(() => {
    const quillInstance = initializeQuill();

    return () => {
      if (quillInstance) {
        quillInstance.off("text-change");
        hasInitializedRef.current = false;
        initializedRef.current = false;
      }
    };
  }, [initializeQuill]);

  // Handle readOnly changes
  useEffect(() => {
    if (quill) {
      quill.enable(!readOnly);
    }
  }, [quill, readOnly]);

  // Basic utility methods
  const setContent = useCallback(
    (content: string) => {
      if (quill) {
        quill.clipboard.dangerouslyPasteHTML(content);
      }
    },
    [quill]
  );

  const getContent = useCallback(() => {
    return quill ? quill.root.innerHTML : "";
  }, [quill]);

  const getText = useCallback(() => {
    return quill ? quill.getText() : "";
  }, [quill]);

  const clearContent = useCallback(() => {
    if (quill) {
      quill.setText("");
    }
  }, [quill]);

  // Safe reinitialization that won't cause infinite loops
  const reinitialize = useCallback(() => {
    if (!quill) return;

    // Create a new toolbarConfig based on current props
    const currentToolbar = propsRef.current.toolbar;
    const toolbarConfig = currentToolbar === true ? defaultToolbarOptions : currentToolbar;

    // Only reinitialize if toolbar actually changed
    const toolbarChanged = JSON.stringify(toolbarRef.current) !== JSON.stringify(toolbarConfig);

    if (!toolbarChanged) return;

    toolbarRef.current = toolbarConfig;
    hasInitializedRef.current = false;
    setQuill(null);
    setTimeout(initializeQuill, 0);
  }, [quill, initializeQuill]);

  return {
    quill,
    setContent,
    getContent,
    getText,
    clearContent,
    reinitialize,
  };
};

export default useQuill;
