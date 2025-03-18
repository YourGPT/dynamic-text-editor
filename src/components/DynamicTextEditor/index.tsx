import React, { forwardRef, type ForwardRefRenderFunction } from "react";
import { useDynamicTextEditor } from "./hooks/useDynamicTextEditor";
import type { DynamicTextEditorProps, DynamicTextEditorRef } from "./types";
import Suggestions from "./Suggestions";
import "quill/dist/quill.snow.css";
import "quill/dist/quill.bubble.css";
import "./styles/editor.css";
import "./styles/suggestions.css";

const DynamicTextEditorBase: ForwardRefRenderFunction<DynamicTextEditorRef, DynamicTextEditorProps> = (
  { className = "", classNames, suggestions, renderItem, value, onChange, minSuggestionWidth, maxSuggestionWidth, maxSuggestionHeight, ...props },
  ref
) => {
  const { quillRef, quillInstance, editorState, setEditorState, clearContent, focus, blur, suggestionState, insertSuggestion } = useDynamicTextEditor({
    value,
    onChange,
    suggestions,
    ...props,
  });

  // Expose methods via ref
  React.useImperativeHandle(ref, () => ({
    quillInstance,
    editorState,
    setEditorState,
    clearContent,
    focus,
    blur,
    containerRef: quillRef.current,
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
