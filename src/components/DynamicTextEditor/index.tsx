import React, { forwardRef, type ForwardRefRenderFunction, useEffect, useState, useRef, useCallback, useMemo } from "react";
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

// Improve line break handling in Turndown
turndownService.addRule("lineBreak", {
  filter: "br",
  replacement: function () {
    return "\n";
  },
});

// Override paragraph rule to better handle line breaks
turndownService.addRule("paragraph", {
  filter: "p",
  replacement: function (content, node) {
    // console.log("PARAGRAPH", content, node);
    // Check if it's an empty paragraph with just a <br>
    if (node.textContent?.trim() === "" && (node as Element)?.innerHTML?.includes("<br>")) {
      return "\u200B\n"; // Using zero-width space followed by double newline
    }
    return content + "\u200B\n";
  },
});

// Add rule to prevent escaping special characters
turndownService.escape = function (string) {
  // Don't escape any characters within template variables
  if (string.startsWith("{{") && string.endsWith("}}")) {
    return string;
  }

  // For normal text, only escape the minimal set of characters needed for Markdown
  return string.replace(/\\/g, "\\\\").replace(/\*/g, "\\*");
  // Removed all other escaping to keep special characters intact
};

const showdownConverter = new Showdown.Converter({
  simpleLineBreaks: false,
  strikethrough: true,
  literalMidWordUnderscores: true,
  literalMidWordAsterisks: true,
  parseImgDimensions: true,
});

// Fix for proper line break conversion
showdownConverter.setOption("simpleLineBreaks", true);
showdownConverter.setOption("disableForced4SpacesIndentedSublists", true);

const DynamicTextEditorBase: ForwardRefRenderFunction<DynamicTextEditorRef, DynamicTextEditorProps> = (
  { className = "", classNames, suggestions, renderItem, value, onChange, minSuggestionWidth, maxSuggestionWidth, maxSuggestionHeight, showCustomToolbar = false, suggestionTrigger = "{{", suggestionClosing = "}}", ...props },
  ref
) => {
  const lastHtmlValueRef = useRef<string>("");
  const lastMarkdownValueRef = useRef<string>(value || "");
  const isSelfUpdateRef = useRef<boolean>(false);
  const selectionRef = useRef<{ index: number; length: number } | null>(null);

  // Convert markdown to HTML only when the value changes
  const htmlValue = useMemo(() => {
    return "";
    // Handle empty/falsy values explicitly
    // if (value === "" || value === null || value === undefined) {
    //   lastMarkdownValueRef.current = "";
    //   lastHtmlValueRef.current = "";
    //   return "";
    // }

    // if (value === lastMarkdownValueRef.current) {
    //   return lastHtmlValueRef.current;
    // }

    // lastMarkdownValueRef.current = value;

    // // Special pre-processing for consecutive newlines
    // // First, preserve template variables
    // const templatePattern = /{{[^}]+}}/g;
    // const templates: string[] = [];
    // const tempValue = value.replace(templatePattern, (match) => {
    //   templates.push(match);
    //   return `__TEMPLATE_${templates.length - 1}__`;
    // });

    // // Process consecutive newlines
    // let processedValue = tempValue.replace(/\n{2,}/g, (match) => {
    //   // For each newline, add a paragraph break
    //   return match
    //     .split("")
    //     .map(() => "<br>")
    //     .join("");
    // });

    // // Restore template variables
    // processedValue = processedValue.replace(/__TEMPLATE_(\d+)__/g, (_, index) => {
    //   return templates[parseInt(index)];
    // });

    // let newHtml = showdownConverter.makeHtml(processedValue || "");

    // // Replace multiple <br> tags with proper paragraph spacing
    // newHtml = newHtml.replace(/<br>/g, "p><br><p>");

    // lastHtmlValueRef.current = newHtml;
    // return newHtml;
  }, [value]);

  // Custom onChange handler without debouncing
  const handleChange = useCallback(
    (html: string) => {
      if (isSelfUpdateRef.current) return;

      // Special handling for empty content
      if (!html) {
        lastHtmlValueRef.current = "";
        lastMarkdownValueRef.current = "";

        if (onChange) {
          onChange("");
        }
        return;
      }

      const markdownContent = turndownService.turndown(html);
      lastHtmlValueRef.current = html;
      lastMarkdownValueRef.current = markdownContent;

      if (onChange) {
        onChange(markdownContent);
      }
    },
    [onChange]
  );

  const { quillRef, quillInstance, editorState, setEditorState, clearContent, focus, blur } = useDynamicTextEditor({
    value: "",
    onChange: handleChange,
    suggestions,
    toolbar: false,
    ...props,
  });

  // Save selection when editor loses focus or before updates
  useEffect(() => {
    if (!quillInstance) return;

    const saveSelectionHandler = () => {
      selectionRef.current = quillInstance.getSelection();
    };

    quillInstance.on("selection-change", saveSelectionHandler);
    return () => {
      quillInstance.off("selection-change", saveSelectionHandler);
    };
  }, [quillInstance]);

  // Update editor content when value changes
  useEffect(() => {
    return;

    if (!quillInstance || isSelfUpdateRef.current) return;

    // Handle empty values explicitly
    const valueIsEmpty = value === "" || value === null || value === undefined;
    const shouldUpdate = valueIsEmpty || value !== lastMarkdownValueRef.current || lastHtmlValueRef.current !== quillInstance.root.innerHTML;

    if (!shouldUpdate) return;

    const selection = selectionRef.current || quillInstance.getSelection();
    isSelfUpdateRef.current = true;

    // Update content - handle empty value explicitly

    if (valueIsEmpty) {
      quillInstance.setText("");
    } else {
      // quillInstance.root.innerHTML = htmlValue;
    }

    // Update refs
    lastMarkdownValueRef.current = value || "";

    // For empty content, set the HTML value to empty as well
    if (valueIsEmpty) {
      lastHtmlValueRef.current = "";
    }

    // Restore selection if it was previously set
    if (selection) {
      setTimeout(() => {
        quillInstance.setSelection(selection.index, selection.length);
        isSelfUpdateRef.current = false;
      }, 0);
    } else {
      isSelfUpdateRef.current = false;
    }
  }, [quillInstance, value, htmlValue]);

  // Format tracking state
  const [formatState, setFormatState] = useState({
    bold: false,
    italic: false,
    underline: false,
    link: false,
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
  const setValue = useCallback(
    (newValue: string) => {
      // Handle empty value case
      // if (newValue === "" || newValue === null || newValue === undefined) {
      //   lastHtmlValueRef.current = "";
      //   lastMarkdownValueRef.current = "";
      //   if (quillInstance) {
      //     isSelfUpdateRef.current = true;
      //     quillInstance.setText("");
      //     isSelfUpdateRef.current = false;
      //   }
      //   if (onChange) {
      //     onChange("");
      //   }
      //   return;
      // }
      // // Special pre-processing for consecutive newlines
      // // First, preserve template variables
      // const templatePattern = /{{[^}]+}}/g;
      // const templates: string[] = [];
      // const tempValue = newValue.replace(templatePattern, (match) => {
      //   templates.push(match);
      //   return `__TEMPLATE_${templates.length - 1}__`;
      // });
      // // Process consecutive newlines
      // let processedValue = tempValue.replace(/\n{2,}/g, (match) => {
      //   // For each newline, add a paragraph break
      //   return match
      //     .split("")
      //     .map(() => "<br>")
      //     .join("");
      // });
      // // Restore template variables
      // processedValue = processedValue.replace(/__TEMPLATE_(\d+)__/g, (_, index) => {
      //   return templates[parseInt(index)];
      // });
      // const newHtml = showdownConverter.makeHtml(processedValue);
      // lastHtmlValueRef.current = newHtml;
      // lastMarkdownValueRef.current = newValue;
      // if (quillInstance) {
      //   isSelfUpdateRef.current = true;
      //   quillInstance.root.innerHTML = newHtml;
      //   isSelfUpdateRef.current = false;
      // }
      // if (onChange) {
      //   onChange(newValue);
      // }
    },
    [quillInstance, onChange]
  );

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

  // Add this new useEffect after the quillInstance is initialized
  // This specifically handles the initial value when the component first mounts
  useEffect(() => {
    if (!quillInstance || !value) return;

    // Only run this once on initialization
    if (lastHtmlValueRef.current === "") {
      isSelfUpdateRef.current = true;

      // Process the value to handle multiple line breaks correctly
      // First, preserve template variables
      // const templatePattern = /{{[^}]+}}/g;
      // const templates: string[] = [];
      // const tempValue = value.replace(templatePattern, (match) => {
      //   templates.push(match);
      //   return `__TEMPLATE_${templates.length - 1}__`;
      // });

      // Split by newlines and process each part
      const parts = value.split(/\n/);
      let processedHtml = "";

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];

        // If this part is empty and not the last part, it's a line break
        if (part.trim() === "" && i < parts.length - 1) {
          processedHtml += "<p><br></p>";
        } else if (part.trim() !== "") {
          // For non-empty parts, convert to HTML and wrap in paragraph tags
          const partHtml = showdownConverter.makeHtml(part);
          // Remove any existing paragraph tags from the converted HTML
          const cleanPartHtml = partHtml.replace(/<\/?p>/g, "");
          processedHtml += `<p>${cleanPartHtml}</p>`;
        }
      }

      // Restore template variables
      const initialHtml = processedHtml.replace(/__TEMPLATE_(\d+)__/g, (_, index) => {
        return templates[parseInt(index)];
      });

      console.log("CURRENT", JSON.stringify(initialHtml), JSON.stringify(value));
      quillInstance.root.innerHTML = initialHtml;

      // Update refs
      lastHtmlValueRef.current = initialHtml;
      lastMarkdownValueRef.current = value;

      isSelfUpdateRef.current = false;
    }
  }, [quillInstance, value]); // This will run once when quillInstance is available

  return (
    <EditorContainer className={`dynamic-text-editor ${className}`}>
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

      <EditorContent ref={quillRef} className={`dynamic-text-editor-container ${classNames?.container || ""}`} />

      <Suggestions
        quillInstance={quillInstance}
        suggestions={suggestions}
        trigger={suggestionTrigger}
        closingChar={suggestionClosing}
        renderItem={renderItem}
        classNames={{
          suggestions: classNames?.suggestions,
          suggestion: classNames?.suggestion,
          suggestionSelected: classNames?.suggestionSelected,
          suggestionHovered: classNames?.suggestionHovered,
          category: classNames?.category,
          description: classNames?.description,
          container: classNames?.container,
        }}
        maxHeight={maxSuggestionHeight}
        minWidth={minSuggestionWidth}
        maxWidth={maxSuggestionWidth}
      />
    </EditorContainer>
  );
};

// Correct way to apply React.memo with forwardRef
export const DynamicTextEditor = React.memo(forwardRef<DynamicTextEditorRef, DynamicTextEditorProps>(DynamicTextEditorBase), (prevProps, nextProps) => {
  // Custom comparison function
  return (
    prevProps.value === nextProps.value &&
    prevProps.readOnly === nextProps.readOnly &&
    prevProps.suggestions === nextProps.suggestions &&
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.showCustomToolbar === nextProps.showCustomToolbar
  );
});

DynamicTextEditor.displayName = "DynamicTextEditor";

export default DynamicTextEditor;

// Styled Components
const EditorContainer = styled.div`
  position: relative;
`;

const EditorContent = styled.div`
  font-size: inherit !important;
  line-height: inherit !important;
  font-family: inherit !important;

  p,
  b,
  span {
    font-size: inherit !important;
    line-height: inherit !important;
    font-family: inherit !important;
  }

  .ql-container.ql-snow {
    border: none;
    font-size: inherit !important;
    font-family: inherit !important;
  }

  .ql-editor {
    padding: unset;
    color: hsl(var(--foreground));
    outline: none;
    font-size: inherit !important;
    line-height: inherit !important;
    font-family: inherit !important;
    white-space: pre-wrap;
  }

  /* Override Quill's default font size */
  .ql-container,
  .ql-editor,
  .ql-editor p {
    font-size: inherit !important;
    line-height: inherit !important;
  }

  /* Target any inline styles that might be added */
  [style*="font-size"] {
    font-size: inherit !important;
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
