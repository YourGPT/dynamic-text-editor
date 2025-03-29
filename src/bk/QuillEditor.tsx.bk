import React, { useEffect, useRef, forwardRef, useImperativeHandle, useState, useLayoutEffect } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import { styled } from "styled-components";
import { BaseEditorItem, EditorClassNames } from "../types/editor";
import TurndownService from "turndown";
import * as Showdown from "showdown";

// Define a custom Blot for styling text in double curly braces
// We need to properly type the Inline import
type InlineBlotConstructor = {
  new (): {
    domNode: HTMLElement;
  };
  create(): HTMLElement;
  formats(node: HTMLElement): boolean | undefined;
};

const Inline = Quill.import("blots/inline") as InlineBlotConstructor;

class TemplateVariableBlot extends Inline {
  static blotName = "template-variable";
  static tagName = "span";

  static create() {
    const node = super.create();
    node.classList.add("template-variable");
    return node;
  }

  static formats(node: HTMLElement) {
    return node.classList.contains("template-variable") ? true : undefined;
  }
}

// Register the custom blot
Quill.register("formats/template-variable", TemplateVariableBlot);

interface QuillEditorProps {
  value?: string;
  onChange: (value: string) => void;
  suggestions: BaseEditorItem[];
  className?: string;
  classNames?: Partial<EditorClassNames>;
  placeholder?: string;
}

export interface QuillEditorRef {
  focus: () => void;
}

const EditorContainer = styled.div`
  position: relative;
  border: 1px solid #ccc;
  border-radius: 4px;

  .template-variable {
    background-color: #e6f7ff;
    border-radius: 3px;
    padding: 0 2px;
    color: #1890ff;
    font-weight: 500;
  }

  .ql-editor {
    min-height: 100px;
  }

  /* Styles for suggestions dropdown */
  .suggestion-dropdown {
    position: absolute;
    z-index: 9999;
    background: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    max-height: 200px;
    overflow-y: auto;
    width: 250px;
  }

  .suggestion-item {
    padding: 8px 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
  }

  .suggestion-item.selected {
    background-color: #f0f0f0;
  }

  .suggestion-category {
    font-size: 12px;
    color: #666;
    margin-right: 8px;
    padding: 2px 6px;
    background: #f5f5f5;
    border-radius: 3px;
  }

  .suggestion-label {
    font-weight: 500;
  }

  .suggestion-description {
    font-size: 12px;
    color: #888;
    margin-top: 2px;
  }
`;

// Function to detect and format template variables in text
const formatTemplateVariables = (editor: ReactQuill) => {
  if (!editor || !editor.getEditor) return;

  const quill = editor.getEditor();
  const text = quill.getText();
  const regex = /{{(.*?)}}/g;
  let match;

  // Clear existing formats first to avoid duplications
  quill.formatText(0, text.length, "template-variable", false);

  // Find all matches and apply the custom format
  while ((match = regex.exec(text)) !== null) {
    const startIndex = match.index;
    const length = match[0].length;
    quill.formatText(startIndex, length, "template-variable", true);
  }
};

// Create instances of converters
const turndownService = new TurndownService();
const showdownConverter = new Showdown.Converter({
  simpleLineBreaks: true,
  strikethrough: true,
});

const QuillEditor = forwardRef<QuillEditorRef, QuillEditorProps>(({ value = "", onChange, className, classNames, suggestions, placeholder = "Start typing..." }, ref) => {
  const editorRef = useRef<ReactQuill>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // State for suggestions dropdown
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionItems, setSuggestionItems] = useState<BaseEditorItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [triggerPosition, setTriggerPosition] = useState({ top: 0, left: 0 });

  // Store the HTML representation of the Markdown internally
  const [htmlValue, setHtmlValue] = useState(() => showdownConverter.makeHtml(value));

  // Update HTML value when Markdown value changes externally
  useEffect(() => {
    const newHtml = showdownConverter.makeHtml(value);
    setHtmlValue(newHtml);
  }, [value]);

  useImperativeHandle(ref, () => ({
    focus: () => {
      if (editorRef.current) {
        editorRef.current.focus();
      }
    },
  }));

  // Function to handle suggestions filtering and display
  const checkForSuggestions = () => {
    if (!editorRef.current) return;

    const quill = editorRef.current.getEditor();
    const selection = quill.getSelection();
    if (!selection) return;

    const lineResult = quill.getLine(selection.index);
    if (!lineResult || !lineResult.length) return;

    const [line, offset] = lineResult;
    if (!line || !line.domNode) return;

    const text = line.domNode.textContent || "";
    const cursorPosition = selection.index;
    const textBeforeCursor = text.slice(0, offset);

    // Check if the user has typed {{ followed by some text
    const match = textBeforeCursor.match(/{{([^}]*)$/);

    if (match) {
      const searchText = match[1].trim().toLowerCase();

      // Filter suggestions based on the search text
      const filteredSuggestions = suggestions.filter((item) => item.label.toLowerCase().includes(searchText) || item.value.toLowerCase().includes(searchText));

      setSuggestionItems(filteredSuggestions);

      if (filteredSuggestions.length > 0) {
        // Calculate position for the dropdown
        const bounds = quill.getBounds(cursorPosition);
        if (!bounds) return;

        // Get the editor's container position for correct dropdown positioning
        const editorRect = quill.container.getBoundingClientRect();

        setTriggerPosition({
          top: editorRect.top + bounds.top + bounds.height,
          left: editorRect.left + bounds.left,
        });

        setShowSuggestions(true);
        setSelectedIndex(0);
        return;
      }
    }

    // If we get here, no need to show suggestions
    setShowSuggestions(false);
  };

  // Handle key events for suggestion navigation and selection
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!showSuggestions || suggestionItems.length === 0) return;

    // Arrow up/down to navigate suggestions
    if (e.key === "ArrowDown") {
      e.preventDefault();
      e.stopPropagation();
      setSelectedIndex((prev) => (prev + 1) % suggestionItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      e.stopPropagation();
      setSelectedIndex((prev) => (prev - 1 + suggestionItems.length) % suggestionItems.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      e.stopPropagation();
      insertSuggestion(suggestionItems[selectedIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setShowSuggestions(false);
    }
  };

  // Function to insert the selected suggestion
  const insertSuggestion = (item: BaseEditorItem) => {
    if (!editorRef.current) return;

    const quill = editorRef.current.getEditor();
    const selection = quill.getSelection();
    if (!selection) return;

    const lineResult = quill.getLine(selection.index);
    if (!lineResult || !lineResult.length) return;

    const [line, offset] = lineResult;
    if (!line || !line.domNode) return;

    const text = line.domNode.textContent || "";
    const textBeforeCursor = text.slice(0, offset);

    // Find the position of {{ to replace
    const match = textBeforeCursor.match(/{{([^}]*)$/);
    if (!match) return;

    const startIndex = selection.index - match[0].length;

    // Delete the typed prefix and insert the suggestion
    quill.deleteText(startIndex, match[0].length);
    quill.insertText(startIndex, item.value, { "template-variable": true });

    // Move cursor after the inserted text
    quill.setSelection(startIndex + item.value.length, 0);

    // Hide suggestions dropdown
    setShowSuggestions(false);

    // Get updated content and convert to Markdown
    setTimeout(() => {
      if (!editorRef.current) return;
      const updatedHtml = editorRef.current.getEditor().root.innerHTML;
      setHtmlValue(updatedHtml);
      const markdownContent = turndownService.turndown(updatedHtml);
      onChange(markdownContent);

      // Also format the variables for proper styling
      formatTemplateVariables(editorRef.current);
    }, 10);
  };

  useEffect(() => {
    if (editorRef.current) {
      formatTemplateVariables(editorRef.current);

      // Add keyboard event listener for suggestion navigation
      const quill = editorRef.current.getEditor();
      quill.on("text-change", checkForSuggestions);

      // Attach the keydown handler to the document
      document.addEventListener("keydown", handleKeyDown, true);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);

      if (editorRef.current) {
        const quill = editorRef.current.getEditor();
        quill.off("text-change", checkForSuggestions);
      }
    };
  }, [showSuggestions, suggestionItems, selectedIndex]);

  useEffect(() => {
    if (editorRef.current) {
      formatTemplateVariables(editorRef.current);
    }
  }, [htmlValue]);

  const handleChange = (html: string) => {
    // Update internal HTML state
    setHtmlValue(html);

    // Convert HTML to Markdown before calling onChange
    const markdownContent = turndownService.turndown(html);
    onChange(markdownContent);

    // We need to schedule this after the change has been processed
    setTimeout(() => {
      if (editorRef.current) {
        formatTemplateVariables(editorRef.current);
      }
    }, 0);
  };

  // Handle clicking a suggestion
  const handleSuggestionClick = (item: BaseEditorItem) => {
    insertSuggestion(item);
  };

  // Custom Quill modules
  const modules = {
    toolbar: [["bold", "italic", "underline"], [{ list: "ordered" }, { list: "bullet" }], ["clean"]],
    clipboard: {
      matchVisual: false,
    },
  };

  // Handle window resizing for dropdown positioning
  useLayoutEffect(() => {
    if (showSuggestions && editorRef.current) {
      const updatePosition = () => {
        const quill = editorRef.current?.getEditor();
        if (!quill) return;

        const selection = quill.getSelection();
        if (!selection) return;

        const bounds = quill.getBounds(selection.index);
        if (!bounds) return;

        const editorRect = quill.container.getBoundingClientRect();

        setTriggerPosition({
          top: editorRect.top + bounds.top + bounds.height,
          left: editorRect.left + bounds.left,
        });
      };

      // Update position on resize
      window.addEventListener("resize", updatePosition);

      return () => {
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [showSuggestions]);

  return (
    <EditorContainer ref={containerRef} className={`${className || ""} ${classNames?.root || ""}`}>
      <ReactQuill ref={editorRef} value={htmlValue} onChange={handleChange} modules={modules} placeholder={placeholder} theme="snow" />

      {showSuggestions && suggestionItems.length > 0 && (
        <div
          className="suggestion-dropdown"
          style={{
            position: "fixed",
            top: `${triggerPosition.top + 20}px`,
            left: `${triggerPosition.left}px`,
            zIndex: 9999,
          }}
        >
          {suggestionItems.map((item, index) => (
            <div key={item.id || index} className={`suggestion-item ${index === selectedIndex ? "selected" : ""}`} onClick={() => handleSuggestionClick(item)} onMouseEnter={() => setSelectedIndex(index)}>
              <span className="suggestion-category">{item.category}</span>
              <div>
                <div className="suggestion-label">{item.label}</div>
                <div className="suggestion-description">{item.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </EditorContainer>
  );
});

QuillEditor.displayName = "QuillEditor";

export default QuillEditor;
