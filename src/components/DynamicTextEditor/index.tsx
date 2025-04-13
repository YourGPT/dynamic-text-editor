import React, { forwardRef, type ForwardRefRenderFunction, useEffect, useRef, useCallback, useMemo } from "react";
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
  return string;
};

const showdownConverter = new Showdown.Converter({
  simpleLineBreaks: false,
  strikethrough: true,
  literalMidWordUnderscores: true,
  literalMidWordAsterisks: true,
  parseImgDimensions: true,
  noHeaderId: true,
  disableForced4SpacesIndentedSublists: true,
  simplifiedAutoLink: false,
  excludeTrailingPunctuationFromURLs: false,
  openLinksInNewWindow: false,
  backslashEscapesHTMLTags: false,
  emoji: false,
  underline: false,
  completeHTMLDocument: false,
  metadata: false,
  splitAdjacentBlockquotes: false,
});

// Disable all Markdown conversion
showdownConverter.setOption("literalMidWordAsterisks", true);
showdownConverter.setOption("literalMidWordUnderscores", true);
showdownConverter.setOption("noHeaderId", true);
showdownConverter.setOption("parseImgDimensions", false);
showdownConverter.setOption("strikethrough", false);
showdownConverter.setOption("tables", false);
showdownConverter.setOption("tasklists", false);
showdownConverter.setOption("smoothLivePreview", false);
showdownConverter.setOption("smartIndentationFix", false);
showdownConverter.setOption("disableForced4SpacesIndentedSublists", true);
showdownConverter.setOption("simpleLineBreaks", true);
showdownConverter.setOption("requireSpaceBeforeHeadingText", true);
showdownConverter.setOption("ghMentions", false);
showdownConverter.setOption("encodeEmails", false);

// Add extensions to disable Markdown features
showdownConverter.addExtension(
  {
    type: "output",
    filter: function (text) {
      // We need to encode HTML entities that may have been created
      return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    },
  },
  "encodeHTMLEntities"
);

// Override the makeHtml method to prevent Markdown conversion completely
showdownConverter.makeHtml = function (text) {
  // Skip Markdown parsing and just wrap in paragraph tags if needed
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
};

const DynamicTextEditorBase: ForwardRefRenderFunction<DynamicTextEditorRef, DynamicTextEditorProps> = (
  { className = "", classNames, suggestions, renderItem, initialValue, onChange, minSuggestionWidth, maxSuggestionWidth, maxSuggestionHeight, suggestionTrigger = "{{", suggestionClosing = "}}", ...props },
  ref
) => {
  const lastHtmlValueRef = useRef<string>("");
  const lastMarkdownValueRef = useRef<string>(initialValue || "");
  const isSelfUpdateRef = useRef<boolean>(false);
  const selectionRef = useRef<{ index: number; length: number } | null>(null);

  // Format markdown to HTML with proper paragraph and line break handling
  const formatMarkdown = useCallback((markdownValue: string): string => {
    if (!markdownValue) return "";

    // Split by newlines and process each part
    const parts = markdownValue.split(/\n/);
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

    return processedHtml;
  }, []);

  // Convert markdown to HTML only when the value changes
  const htmlValue = useMemo(() => {
    // Handle empty/falsy values explicitly
    if (initialValue === "" || initialValue === null || initialValue === undefined) {
      lastMarkdownValueRef.current = "";
      lastHtmlValueRef.current = "";
      return "";
    }

    if (initialValue === lastMarkdownValueRef.current) {
      return lastHtmlValueRef.current;
    }

    lastMarkdownValueRef.current = initialValue;

    // Special pre-processing for consecutive newlines
    // First, preserve template variables
    const templatePattern = /{{[^}]+}}/g;
    const templates: string[] = [];
    const tempValue = initialValue.replace(templatePattern, (match: string) => {
      templates.push(match);
      return `__TEMPLATE_${templates.length - 1}__`;
    });

    // Process consecutive newlines
    let processedValue = tempValue.replace(/\n{2,}/g, (match: string) => {
      // For each newline, add a paragraph break
      return match
        .split("")
        .map(() => "<br>")
        .join("");
    });

    // Restore template variables
    processedValue = processedValue.replace(/__TEMPLATE_(\d+)__/g, (_: string, index: string) => {
      return templates[parseInt(index)];
    });

    let newHtml = showdownConverter.makeHtml(processedValue || "");

    // Replace multiple <br> tags with proper paragraph spacing
    newHtml = newHtml.replace(/<br>/g, "p><br><p>");

    lastHtmlValueRef.current = newHtml;
    return newHtml;
  }, [initialValue]);

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
    value: htmlValue,
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
    if (!quillInstance || isSelfUpdateRef.current) return;

    // Handle empty values explicitly
    const valueIsEmpty = initialValue === "" || initialValue === null || initialValue === undefined;
    const shouldUpdate = valueIsEmpty || initialValue !== lastMarkdownValueRef.current || lastHtmlValueRef.current !== quillInstance.root.innerHTML;

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
    lastMarkdownValueRef.current = initialValue || "";

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
  }, [quillInstance, initialValue, htmlValue]);

  // Method to programmatically set value
  const setValue = useCallback(
    (newValue: string) => {
      // Handle empty value case
      if (newValue === "" || newValue === null || newValue === undefined) {
        lastHtmlValueRef.current = "";
        lastMarkdownValueRef.current = "";
        if (quillInstance) {
          isSelfUpdateRef.current = true;
          quillInstance.setText("");
          isSelfUpdateRef.current = false;
        }
        if (onChange) {
          onChange("");
        }
        return;
      }

      const initialHtml = formatMarkdown(newValue);

      lastHtmlValueRef.current = initialHtml;
      lastMarkdownValueRef.current = newValue;

      if (quillInstance) {
        isSelfUpdateRef.current = true;
        // Use Quill's content API instead of directly setting innerHTML
        quillInstance.clipboard.dangerouslyPasteHTML(initialHtml, "api");
        isSelfUpdateRef.current = false;
      }

      if (onChange) {
        onChange(newValue);
      }
    },
    [quillInstance, onChange, formatMarkdown]
  );

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
    if (!quillInstance || !initialValue) return;

    // Only run this once on initialization
    if (lastHtmlValueRef.current === "") {
      console.log("[Initial Load] Starting initial content load");
      console.log("[Initial Load] Value:", initialValue);
      console.log("[Initial Load] Contains templates:", initialValue.includes(suggestionTrigger));

      isSelfUpdateRef.current = true;

      const initialHtml = formatMarkdown(initialValue);

      console.log("[Initial Load] Formatted HTML:", initialHtml);
      console.log("[Initial Load] Contains template markers:", initialHtml.includes(suggestionTrigger));

      // Use Quill's content API instead of directly setting innerHTML
      console.log("[Initial Load] Setting content with dangerouslyPasteHTML");
      quillInstance.clipboard.dangerouslyPasteHTML(initialHtml, "api");

      console.log("[Initial Load] Content set, HTML:", quillInstance.root.innerHTML);
      console.log("[Initial Load] Contains template classes:", quillInstance.root.innerHTML.includes("template-variable"));

      // Update refs
      lastHtmlValueRef.current = initialHtml;
      lastMarkdownValueRef.current = initialValue;

      isSelfUpdateRef.current = false;
      console.log("[Initial Load] Complete, reset self-update flag");
    }
  }, [quillInstance, initialValue, formatMarkdown, suggestionTrigger]); // Added formatMarkdown to dependencies

  return (
    <EditorContainer className={`dynamic-text-editor ${className}`}>
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
    prevProps.initialValue === nextProps.initialValue &&
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
