import React, { forwardRef, type ForwardRefRenderFunction, useEffect, useState } from "react";
import { useDynamicTextEditor } from "./hooks/useDynamicTextEditor";
import type { DynamicTextEditorProps, DynamicTextEditorRef } from "./types";
import Suggestions from "./Suggestions";
import TurndownService from "turndown";
import * as Showdown from "showdown";
import "quill/dist/quill.snow.css";
import "quill/dist/quill.bubble.css";
import "./styles/editor.css";
import "./styles/suggestions.css";

// Create instances of converters
const turndownService = new TurndownService();
const showdownConverter = new Showdown.Converter({
  simpleLineBreaks: true,
  strikethrough: true,
});

const DynamicTextEditorBase: ForwardRefRenderFunction<DynamicTextEditorRef, DynamicTextEditorProps> = (
  { className = "", classNames, suggestions, renderItem, value, onChange, minSuggestionWidth, maxSuggestionWidth, maxSuggestionHeight, ...props },
  ref
) => {
  // Store the HTML representation of the Markdown internally
  const [htmlValue, setHtmlValue] = useState(() => (value ? showdownConverter.makeHtml(value) : ""));

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
    ...props,
  });

  // Method to programmatically set value
  const setValue = (newValue: string) => {
    const newHtml = showdownConverter.makeHtml(newValue);
    setHtmlValue(newHtml);
    setEditorState(newHtml);
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
