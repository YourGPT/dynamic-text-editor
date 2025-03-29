import React, { forwardRef, type ForwardRefRenderFunction, useEffect, useState } from "react";
import { useDynamicTextEditor } from "./hooks/useDynamicTextEditor";
import type { DynamicTextEditorProps, DynamicTextEditorRef } from "./types";
import Suggestions from "./Suggestions";
import TurndownService from "turndown";
import * as Showdown from "showdown";
//
import "./styles/editor.css";
import "./styles/suggestions.css";

// Create instances of converters
const turndownService = new TurndownService({
  emDelimiter: "*",
  strongDelimiter: "**",
  hr: "---",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  headingStyle: "atx",
});

// Override paragraph rule to use single newlines instead of double
turndownService.addRule("paragraph", {
  filter: "p",
  replacement: function (content) {
    return content + "\n";
  },
});

const showdownConverter = new Showdown.Converter({
  simpleLineBreaks: true,
  strikethrough: true,
});

const DynamicTextEditorBase: ForwardRefRenderFunction<DynamicTextEditorRef, DynamicTextEditorProps> = (
  { className = "", classNames, suggestions, renderItem, value, onChange, minSuggestionWidth, maxSuggestionWidth, maxSuggestionHeight, showCustomToolbar = false, ...props },
  ref
) => {
  // Store the HTML representation of the Markdown internally
  const [htmlValue, setHtmlValue] = useState(() => (value ? showdownConverter.makeHtml(value) : ""));
  // Format tracking state
  const [formatState, setFormatState] = useState({
    bold: false,
    italic: false,
    underline: false,
    link: false,
  });

  // Set initial value only once
  useEffect(() => {
    if (value !== undefined && htmlValue === "") {
      const newHtml = showdownConverter.makeHtml(value);
      setHtmlValue(newHtml);
    }
  }, []);

  // Custom onChange handler to convert HTML back to Markdown
  const handleChange = (html: string) => {
    setHtmlValue(html);
    if (onChange) {
      // Convert HTML to Markdown before calling onChange
      const markdownContent = turndownService.turndown(html);
      onChange(markdownContent);
    }
  };

  const { quillRef, quillInstance, editorState, setEditorState, clearContent, focus, blur, suggestionState, insertSuggestion } = useDynamicTextEditor({
    value: htmlValue,
    onChange: handleChange,
    suggestions,
    toolbar: false,
    ...props,
  });

  // Update format state on selection change
  useEffect(() => {
    if (!quillInstance) return;

    const selectionChangeHandler = () => {
      const selection = quillInstance.getSelection();
      if (selection) {
        const format = quillInstance.getFormat(selection);
        setFormatState({
          bold: !!format.bold,
          italic: !!format.italic,
          underline: !!format.underline,
          link: !!format.link,
        });
      }
    };

    quillInstance.on("selection-change", selectionChangeHandler);
    return () => {
      quillInstance.off("selection-change", selectionChangeHandler);
    };
  }, [quillInstance]);

  // Method to programmatically set value
  const setValue = (newValue: string) => {
    const newHtml = showdownConverter.makeHtml(newValue);
    setHtmlValue(newHtml);
    setEditorState(newHtml);
  };

  // Format handlers for custom toolbar
  const handleBold = () => {
    if (!quillInstance) return;
    const selection = quillInstance.getSelection();
    if (selection) {
      const format = quillInstance.getFormat(selection);
      quillInstance.format("bold", !format.bold);
      setFormatState((prev) => ({ ...prev, bold: !format.bold }));
    } else {
      quillInstance.focus();
    }
  };

  const handleItalic = () => {
    if (!quillInstance) return;
    const selection = quillInstance.getSelection();
    if (selection) {
      const format = quillInstance.getFormat(selection);
      quillInstance.format("italic", !format.italic);
      setFormatState((prev) => ({ ...prev, italic: !format.italic }));
    } else {
      quillInstance.focus();
    }
  };

  const handleUnderline = () => {
    if (!quillInstance) return;
    const selection = quillInstance.getSelection();
    if (selection) {
      const format = quillInstance.getFormat(selection);
      quillInstance.format("underline", !format.underline);
      setFormatState((prev) => ({ ...prev, underline: !format.underline }));
    } else {
      quillInstance.focus();
    }
  };

  const handleLink = () => {
    if (!quillInstance) return;
    const selection = quillInstance.getSelection();
    if (selection) {
      const format = quillInstance.getFormat(selection);
      const url = format.link ? "" : prompt("Enter URL", "https://");
      if (url !== null) {
        quillInstance.format("link", url);
        setFormatState((prev) => ({ ...prev, link: !!url }));
      }
    } else {
      quillInstance.focus();
    }
  };

  // Expose methods via ref
  React.useImperativeHandle(ref, () => ({
    quillInstance,
    editorState,
    setEditorState,
    clearContent,
    focus,
    blur,
    containerRef: quillRef.current,
    setValue,
  }));

  return (
    <div className={`dynamic-text-editor ${className} ${classNames?.root || ""}`}>
      {showCustomToolbar && (
        <div className="dynamic-text-editor-custom-toolbar">
          <button type="button" onClick={handleBold} className={`toolbar-button ${formatState.bold ? "active" : ""}`} title="Bold">
            <strong>B</strong>
          </button>
          <button type="button" onClick={handleItalic} className={`toolbar-button ${formatState.italic ? "active" : ""}`} title="Italic">
            <em>I</em>
          </button>
          <button type="button" onClick={handleUnderline} className={`toolbar-button ${formatState.underline ? "active" : ""}`} title="Underline">
            <u>U</u>
          </button>
          <button type="button" onClick={handleLink} className={`toolbar-button ${formatState.link ? "active" : ""}`} title="Link">
            🔗
          </button>
        </div>
      )}

      <div ref={quillRef} className={`dynamic-text-editor-container ${classNames?.editor || ""}`} />

      <Suggestions
        isOpen={suggestionState.isOpen}
        items={suggestionState.filteredItems || suggestionState.items}
        position={suggestionState.triggerPosition}
        selectedIndex={suggestionState.selectedIndex}
        onSelect={insertSuggestion}
        renderItem={renderItem}
        classNames={{
          suggestions: classNames?.suggestions,
          suggestion: classNames?.suggestion,
          suggestionSelected: classNames?.suggestionSelected,
          suggestionHovered: classNames?.suggestionHovered,
        }}
        maxHeight={maxSuggestionHeight}
        minWidth={minSuggestionWidth}
        maxWidth={maxSuggestionWidth}
      />
    </div>
  );
};

export const DynamicTextEditor = forwardRef<DynamicTextEditorRef, DynamicTextEditorProps>(DynamicTextEditorBase);
DynamicTextEditor.displayName = "DynamicTextEditor";

export default DynamicTextEditor;
