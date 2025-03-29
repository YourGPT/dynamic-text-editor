import React, { forwardRef, type ForwardRefRenderFunction, useEffect, useState } from "react";
import { useDynamicTextEditor } from "./hooks/useDynamicTextEditor";
import type { DynamicTextEditorProps, DynamicTextEditorRef } from "./types";
import Suggestions from "./Suggestions";
import TurndownService from "turndown";
import * as Showdown from "showdown";
import { styled } from "styled-components";

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

// Styled Components
const EditorContainer = styled.div`
  position: relative;
`;

const EditorContent = styled.div`
  .ql-container.ql-snow {
    border: none;
  }

  .ql-editor {
    padding: unset;
    color: hsl(var(--foreground));
  }

  .ql-editor.ql-blank::before {
    left: 0px;
    color: hsl(var(--foreground) / 0.5);
  }

  .quill-ui-editor {
    display: flex;
    flex-direction: column;
  }

  .quill-ui-editor .editor-content {
    flex: 1;
    min-height: 150px;
  }

  /* Hide duplicate toolbars */
  .quill-ui-editor .ql-toolbar + .ql-toolbar {
    display: none;
  }

  /* Ensure placeholder is properly positioned */
  .quill-ui-editor .ql-editor.ql-blank::before {
    font-style: italic;
    position: absolute;
    left: 15px;
    pointer-events: none;
    color: hsl(var(--foreground) / 0.5);
  }

  /* Bubble theme styles */
  .theme-bubble .editor-content {
    border: 1px solid hsl(var(--foreground) / 0.2);
    border-radius: 4px;
    padding: 12px;
    transition: border-color 0.2s ease;
    background-color: hsl(var(--background));
  }

  .theme-bubble .editor-content:hover {
    border-color: hsl(var(--foreground) / 0.4);
  }

  .theme-bubble .editor-content:focus-within {
    border-color: hsl(var(--primary));
    box-shadow: 0 0 0 2px hsl(var(--primary) / 0.2);
  }

  /* Adjust bubble toolbar position */
  .theme-bubble .ql-bubble .ql-tooltip {
    z-index: 1000;
  }
`;

const CustomToolbar = styled.div`
  display: flex;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  gap: 4px;
  padding-bottom: 4px;
`;

const ToolbarButton = styled.button<{ $active?: boolean }>`
  width: 30px;
  height: 30px;
  background-color: hsl(var(--background));
  border: 1px solid hsl(var(--foreground) / 0.1);
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: background-color 0.2s, border-color 0.2s;
  color: hsl(var(--foreground));

  &:hover {
    background-color: hsl(var(--foreground) / 0.05);
    border-color: hsl(var(--foreground) / 0.2);
  }

  &:active {
    background-color: hsl(var(--foreground) / 0.1);
  }

  ${({ $active }) =>
    $active &&
    `
    background-color: hsl(var(--primary) / 0.1);
    border-color: hsl(var(--primary));
    color: hsl(var(--primary));
  `}
`;

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
    <EditorContainer className={`dynamic-text-editor ${className} ${classNames?.root || ""}`}>
      {showCustomToolbar && (
        <CustomToolbar className="dynamic-text-editor-custom-toolbar">
          <ToolbarButton type="button" onClick={handleBold} $active={formatState.bold} title="Bold">
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton type="button" onClick={handleItalic} $active={formatState.italic} title="Italic">
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton type="button" onClick={handleUnderline} $active={formatState.underline} title="Underline">
            <u>U</u>
          </ToolbarButton>
          <ToolbarButton type="button" onClick={handleLink} $active={formatState.link} title="Link">
            🔗
          </ToolbarButton>
        </CustomToolbar>
      )}

      <EditorContent ref={quillRef} className={`dynamic-text-editor-container ${classNames?.editor || ""}`} />

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
    </EditorContainer>
  );
};

export const DynamicTextEditor = forwardRef<DynamicTextEditorRef, DynamicTextEditorProps>(DynamicTextEditorBase);
DynamicTextEditor.displayName = "DynamicTextEditor";

export default DynamicTextEditor;
