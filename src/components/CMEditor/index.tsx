import { useEffect, useRef, useState, useMemo, memo } from "react";
import { createRoot } from "react-dom/client";
import { styled } from "styled-components";
import { EditorState, StateField, Transaction, Compartment } from "@codemirror/state";
import { EditorView, Decoration, DecorationSet, keymap, WidgetType } from "@codemirror/view";
import { autocompletion, CompletionContext, startCompletion, completionKeymap } from "@codemirror/autocomplete";
import { syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";

// Define compartments for reconfigurable extensions
const autocompleteCompartment = new Compartment();
const eventHandlersCompartment = new Compartment();
const changeListenerCompartment = new Compartment();

interface CMEditorProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: Array<{ value: string; label?: string; description?: string; link?: string }>;
  placeholder?: string;
  className?: string;
  onBlur?: (event: { target: { value: string } }) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  multiLine?: boolean; // Whether editor allows multiple lines (true) or acts like a single-line input (false)
}

// Create a highlight style for variables
const highlightStyle = HighlightStyle.define([
  {
    tag: tags.className,
    class: "cm-variable-highlight",
  },
]);

// RegExp for finding variables in {{...}} format
const variableRegex = /\{\{([^}]*)\}\}/g;

// Function to find all variables in text
function findVariables(text: string) {
  const variables = [];
  let match;
  while ((match = variableRegex.exec(text)) !== null) {
    variables.push({
      from: match.index,
      to: match.index + (match[0]?.length || 0),
      text: match[1],
    });
  }
  return variables;
}

// Create a decoration for variables
const variableDecoration = Decoration.mark({
  class: "cm-variable-highlight",
  tagName: "span",
});

// Create a state field for variable decorations
const variableField = StateField.define<DecorationSet>({
  create(state) {
    // Apply decorations on initial state
    const text = state.doc.toString();
    const vars = findVariables(text);
    return Decoration.set(vars.map((v) => variableDecoration.range(v.from, v.to)));
  },
  update(decorations: DecorationSet, tr: Transaction) {
    decorations = decorations.map(tr.changes);
    if (!tr.docChanged) return decorations;

    const doc = tr.state.doc;
    const text = doc.toString();
    const vars = findVariables(text);

    return Decoration.set(vars.map((v) => variableDecoration.range(v.from, v.to)));
  },
  provide(field) {
    return EditorView.decorations.from(field);
  },
});

// React component for suggestion item
const SuggestionItem = ({ label, detail, link }: { label: string; detail?: string; link?: string }) => {
  const handleLinkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (link) {
      // Open link in new tab
      window.open(link, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="cm-suggestion-item">
      <div className="cm-suggestion-left">
        <div className="cm-suggestion-label">{label}</div>
        {detail && <div className="cm-suggestion-description">{detail}</div>}
      </div>
      {link && (
        <div className="cm-suggestion-right">
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleLinkClick}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            Docs
          </a>
        </div>
      )}
    </div>
  );
};

// React component for suggestion tooltip (hover)
// const SuggestionInfo = ({ label, detail, link }: { label: string; detail?: string; link?: string }) => {
//   return (
//     <div className="cm-suggestion-info">
//       <div className="cm-suggestion-info-label">{label}</div>
//       {detail && <div>{detail}</div>}
//       {link && (
//         <div>
//           <a href={link} target="_blank" rel="noopener noreferrer">
//             {link}
//           </a>
//         </div>
//       )}
//     </div>
//   );
// };

// Create a completion source for variables
function variableCompletionSource(context: CompletionContext, suggestions: Array<{ value: string; label?: string; description?: string; link?: string }>) {
  // First try to match a cursor position inside an existing {{}} pattern
  const line = context.state.doc.lineAt(context.pos);
  const lineText = line.text;
  const cursorPosInLine = context.pos - line.from;

  // Look for {{ before the cursor and }} after the cursor on the current line
  let varStartIndex = -1;
  let varEndIndex = -1;

  // Find the closest {{ before the cursor
  for (let i = cursorPosInLine - 1; i >= 0; i--) {
    if (lineText.substring(i, i + 2) === "{{") {
      varStartIndex = i;
      break;
    }
  }

  // Find the closest }} after the cursor
  if (varStartIndex >= 0) {
    for (let i = cursorPosInLine; i < lineText?.length - 1; i++) {
      if (lineText.substring(i, i + 2) === "}}") {
        varEndIndex = i;
        break;
      }
    }
  }

  // If we found {{ before and }} after, we're inside a variable
  if (varStartIndex >= 0 && varEndIndex >= 0) {
    // We're inside a {{}} pattern, show suggestions and replace only the content
    const from = line.from + varStartIndex + 2; // Position after {{
    const to = line.from + varEndIndex; // Position before }}

    return {
      from,
      to,
      options: suggestions.map((s) => ({
        label: s.label || s.value,
        detail: s.description || "",
        apply: s.value, // Just replace what's between {{ and }}
        boost: 1,
        // Store source object for use in the renderer
        source: {
          value: s.value,
          label: s.label || s.value,
          description: s.description || "",
          link: s.link,
        },
      })),
    };
  }

  // Fall back to the original pattern-matching logic
  const word = context.matchBefore(/\{\{([^}]*)$/);
  if (!word) return null;

  // Show suggestions for any text after {{ (including empty)
  return {
    from: word.from + 2, // Position after '{{'
    options: suggestions.map((s) => ({
      label: s.value,
      detail: s.description || "",
      apply: `${s.value}}}`,
      boost: 1,
      // Store source object for use in the renderer
      source: {
        value: s.value,
        label: s.label || s.value,
        description: s.description || "",
        link: s.link,
      },
    })),
  };
}

// Render function for suggestion items using React
function renderSuggestionItem(completion: { label: string; detail?: string; source?: { link?: string; value?: string } }) {
  // Create DOM container
  const container = document.createElement("div");

  // Create React root and render component
  const root = createRoot(container);
  root.render(<SuggestionItem label={completion.label} detail={completion.detail} link={completion.source?.link} />);

  return container;
}

// Check the current document position for {{ pattern and show suggestions if found
function checkForVariableStart(view: EditorView) {
  const pos = view.state.selection.main.from;
  const line = view.state.doc.lineAt(pos);
  const lineStart = line.from;
  const lineText = line.text;
  const cursorPosInLine = pos - lineStart;

  // Case 1: Check if we're inside {{}}
  let varStartIndex = -1;
  let varEndIndex = -1;

  // Find the closest {{ before the cursor
  for (let i = cursorPosInLine - 1; i >= 0; i--) {
    if (lineText.substring(i, i + 2) === "{{") {
      varStartIndex = i;
      break;
    }
  }

  // Find the closest }} after the cursor
  if (varStartIndex >= 0) {
    for (let i = cursorPosInLine; i < lineText?.length - 1; i++) {
      if (lineText.substring(i, i + 2) === "}}") {
        varEndIndex = i;
        break;
      }
    }
  }

  // If we're inside {{}} pattern, show suggestions
  if (varStartIndex >= 0 && varEndIndex >= 0) {
    startCompletion(view);
    return true;
  }

  // Case 2: Check for unclosed {{ pattern
  let varStart = -1;
  for (let i = cursorPosInLine - 1; i >= 0; i--) {
    if (lineText.substring(i, i + 2) === "{{") {
      varStart = i;
      break;
    }
  }

  // If we found {{ and it's not at the end of a completed variable
  if (varStart >= 0) {
    const afterVarStart = lineText.substring(varStart);
    if (!afterVarStart.match(/\}\}/)) {
      // No closing }} found after {{, so we're in a variable declaration
      startCompletion(view);
      return true;
    }
  }

  return false;
}

// Create a placeholder extension
function placeholderExtension(placeholder: string) {
  return EditorView.decorations.of((view) => {
    // Only show placeholder when editor is empty
    if (view.state?.doc?.length > 0) return Decoration.none;

    // Create a placeholder decoration at position 0
    return Decoration.set([
      Decoration.widget({
        widget: new (class extends WidgetType {
          toDOM() {
            const span = document.createElement("span");
            span.className = "cm-placeholder";
            span.textContent = placeholder;
            return span;
          }
          ignoreEvent() {
            return true;
          }
        })(),
        side: 1,
      }).range(0),
    ]);
  });
}

// Convert to memoized component with explicit props comparison
export const CMEditor = memo(
  ({ value, onChange, suggestions, placeholder, className, onBlur, onKeyDown, multiLine = true }: CMEditorProps) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const initializedRef = useRef(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // Memoize enhancedSuggestions to prevent recreating on every render
    const enhancedSuggestions = useMemo(() => suggestions.map((s) => ({ ...s, source: s })), [suggestions]);

    // Initialize editor only once
    useEffect(() => {
      if (!editorRef.current || initializedRef.current) return;
      initializedRef.current = true;

      const baseExtensions = [
        // Basic editor setup
        // Only apply line wrapping if not in single-line mode
        multiLine !== false ? EditorView.lineWrapping : [],
        syntaxHighlighting(highlightStyle),

        // Add custom styling for single-line mode
        EditorView.theme({
          "&.cm-editor": {
            fontSize: "inherit",
            fontFamily: "inherit",
          },
          "&.cm-editor.cm-single-line .cm-scroller": {
            overflow: "hidden auto",
          },
          "&.cm-editor.cm-single-line .cm-content": {
            minHeight: "40px",
            height: "40px",
          },
          "&.cm-editor.cm-single-line .cm-line": {
            padding: "0",
            lineHeight: "38px",
            display: "inline-block",
          },
        }),

        // Placeholder (if provided)
        placeholder ? placeholderExtension(placeholder) : [],

        // History extension for undo/redo functionality
        history(),

        // Add a high-priority keymap handler for Enter to ensure we catch it first
        keymap.of([
          {
            key: "Enter",
            run: () => {
              // Check if our external handler is registered
              if (onKeyDown) {
                // Create a synthetic keyboard event
                const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true });
                // Call our handler directly
                onKeyDown(event);
                // If the handler prevented default, we prevent CodeMirror handling
                if (event.defaultPrevented) {
                  return true;
                }
              }

              // If multiLine is false, always prevent new lines by handling the Enter key
              if (multiLine === false) {
                return true; // Prevents the default CodeMirror behavior (adding a new line)
              }

              // Return false to let CodeMirror handle it normally when multiLine is true
              return false;
            },
            // Higher priority than default keymap to ensure we get it first
            preventDefault: false,
          },
        ]),

        // Ensure space key is not accidentally intercepted
        keymap.of([
          {
            key: " ",
            run: () => {
              // Always return false to ensure space is handled normally
              return false;
            },
            preventDefault: false,
          },
        ]),

        // Include keymaps for basic editing, history, and indentation
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),

        // Include keymap for completions
        keymap.of(completionKeymap),

        // Variable highlighting
        variableField,

        // Handle events in a compartment so they can be updated when props change
        eventHandlersCompartment.of(
          EditorView.domEventHandlers({
            blur: () => {
              if (onBlur) {
                onBlur({ target: { value: viewRef.current?.state?.doc?.toString() || "" } });
              }
              return false;
            },
            keydown: (event) => {
              if (onKeyDown) {
                onKeyDown(event);

                // Explicitly prevent CodeMirror from handling Enter key
                // This allows the parent component to fully control Enter behavior
                if (event.key === "Enter" && !event.defaultPrevented) {
                  // Parent didn't prevent default, check multiLine setting
                  if (multiLine === false) {
                    return true; // Prevent default when multiLine is false
                  }
                  return false;
                }

                // If parent prevented default on Enter, stop propagation here
                if (event.key === "Enter" && event.defaultPrevented) {
                  return true; // Prevent CodeMirror from handling it
                }

                // Ensure space key works properly
                if (event.key === " ") {
                  return false; // Let CodeMirror handle spaces normally
                }
              } else if (event.key === "Enter" && multiLine === false) {
                // If there's no onKeyDown handler but multiLine is false, prevent new lines
                return true;
              } else if (event.key === " ") {
                // Always let spaces work properly
                return false;
              }
              return false; // Don't stop propagation, allow CodeMirror to handle the event too
            },
          })
        ),

        // Custom autocompletion in a compartment for easy reconfiguration
        autocompleteCompartment.of(
          autocompletion({
            override: [(ctx) => variableCompletionSource(ctx, enhancedSuggestions)],
            activateOnTyping: true,
            closeOnBlur: false,
            addToOptions: [
              {
                render: renderSuggestionItem,
                position: 20,
              },
            ],
            icons: false,
          })
        ),

        // Update parent on changes - in a compartment so it can be reconfigured when onChange changes
        changeListenerCompartment.of(
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              const newValue = update.state?.doc?.toString() || "";
              if (newValue !== value) {
                onChange(newValue);

                // Check if we should show suggestions after any document change
                if (update.transactions.some((tr) => tr.isUserEvent("input.type") || tr.isUserEvent("delete"))) {
                  setTimeout(() => {
                    if (viewRef.current) {
                      checkForVariableStart(viewRef.current);
                    }
                  }, 10);
                }
              }
            }
          })
        ),

        // Custom keymap for autocompletion and checking for {{ after deleting
        keymap.of([
          {
            key: "{",
            run: (view) => {
              const from = view.state.selection.main.from;
              const textBefore = view.state.doc.sliceString(Math.max(0, from - 1), from);

              if (textBefore === "{") {
                // Show suggestions immediately when {{ is typed
                setTimeout(() => startCompletion(view), 0);
              }
              return false;
            },
          },
          {
            key: "Backspace",
            run: (view) => {
              // After handling backspace normally, check if we're at a {{ position
              setTimeout(() => checkForVariableStart(view), 10);
              return false; // Don't actually handle the key, let default handler run
            },
          },
          {
            key: "Delete",
            run: (view) => {
              // After handling delete normally, check if we're at a {{ position
              setTimeout(() => checkForVariableStart(view), 10);
              return false; // Don't actually handle the key, let default handler run
            },
          },
        ]),
      ];

      const state = EditorState.create({
        doc: value,
        extensions: baseExtensions,
      });

      const view = new EditorView({
        state,
        parent: editorRef.current,
      });

      viewRef.current = view;
      setIsInitialized(true);

      // Add global event listener to handle clicks on autocomplete links
      const handleTooltipClick = (e: MouseEvent) => {
        // Find if the clicked element is a link inside our autocomplete tooltip
        const target = e.target as HTMLElement;
        if (target.tagName === "A" && target.closest(".cm-tooltip-autocomplete")) {
          // If it's our link, prevent the default CodeMirror behavior
          e.preventDefault();
          e.stopPropagation();
        }
      };

      // Add the event listener to the document
      document.addEventListener("mousedown", handleTooltipClick, true);

      return () => {
        document.removeEventListener("mousedown", handleTooltipClick, true);
        view.destroy();
        viewRef.current = null;
        initializedRef.current = false;
      };
    }, []);

    // Update change handler when it changes
    useEffect(() => {
      if (!viewRef.current || !isInitialized) return;

      const newChangeListener = EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const newValue = update.state?.doc?.toString() || "";
          if (newValue !== value) {
            onChange(newValue);

            // Check if we should show suggestions after any document change
            if (update.transactions.some((tr) => tr.isUserEvent("input.type") || tr.isUserEvent("delete"))) {
              setTimeout(() => {
                if (viewRef.current) {
                  checkForVariableStart(viewRef.current);
                }
              }, 10);
            }
          }
        }
      });

      viewRef.current.dispatch({
        effects: changeListenerCompartment.reconfigure(newChangeListener),
      });
    }, [onChange, value, isInitialized]);

    // Update event handlers when they change
    useEffect(() => {
      if (!viewRef.current || !isInitialized) return;

      const newEventHandlers = EditorView.domEventHandlers({
        blur: () => {
          if (onBlur) {
            onBlur({ target: { value: viewRef.current?.state?.doc?.toString() || "" } });
          }
          return false;
        },
        keydown: (event) => {
          if (onKeyDown) {
            onKeyDown(event);
          }
          return false;
        },
      });

      viewRef.current.dispatch({
        effects: eventHandlersCompartment.reconfigure(newEventHandlers),
      });
    }, [onBlur, onKeyDown, isInitialized]);

    // Update suggestions using compartment when they change
    useEffect(() => {
      if (!viewRef.current || !isInitialized) return;

      const newAutocomplete = autocompletion({
        override: [(ctx) => variableCompletionSource(ctx, enhancedSuggestions)],
        activateOnTyping: true,
        closeOnBlur: false,
        addToOptions: [
          {
            render: renderSuggestionItem,
            position: 20,
          },
        ],
        icons: false,
      });

      // Update only the autocompletion part using the compartment
      viewRef.current.dispatch({
        effects: autocompleteCompartment.reconfigure(newAutocomplete),
      });
    }, [enhancedSuggestions, isInitialized]); // Only when suggestions change

    // Update content when value prop changes with safer selection handling
    useEffect(() => {
      if (!viewRef.current || !isInitialized) return;

      const currentValue = viewRef.current.state?.doc?.toString() || "";
      if (value !== currentValue) {
        // Calculate a safe cursor position to prevent RangeError
        const safePos = Math.min(value?.length || 0, viewRef.current.state?.doc?.length || 0);

        viewRef.current.dispatch({
          changes: {
            from: 0,
            to: viewRef.current.state?.doc?.length || 0,
            insert: value || "",
          },
          // Use a safer selection
          selection: { anchor: safePos },
          scrollIntoView: true,
        });
      }
    }, [value, isInitialized]);

    // Apply single-line styling when multiLine is false
    useEffect(() => {
      if (!viewRef.current || !isInitialized) return;

      // Add or remove single-line-input class based on multiLine prop
      const editorElement = viewRef.current.dom;
      if (editorElement) {
        if (multiLine === false) {
          editorElement.classList.add("cm-single-line");

          // Force additional styling by applying inline styles if needed
          editorElement.style.height = "40px";
          editorElement.style.minHeight = "40px";
          editorElement.style.maxHeight = "40px";

          // Find the scroller element and force its style
          const scroller = editorElement.querySelector(".cm-scroller");
          if (scroller) {
            (scroller as HTMLElement).style.height = "40px";
            (scroller as HTMLElement).style.minHeight = "40px";
            (scroller as HTMLElement).style.maxHeight = "40px";
            (scroller as HTMLElement).style.overflowY = "hidden";
          }

          // Find the content element and force its style
          const content = editorElement.querySelector(".cm-content");
          if (content) {
            (content as HTMLElement).style.height = "40px";
            (content as HTMLElement).style.minHeight = "40px";
            (content as HTMLElement).style.maxHeight = "40px";
            (content as HTMLElement).style.whiteSpace = "pre";
          }
        } else {
          editorElement.classList.remove("cm-single-line");
          editorElement.style.height = "";
          editorElement.style.minHeight = "";
          editorElement.style.maxHeight = "";

          // Reset styles of child elements
          const scroller = editorElement.querySelector(".cm-scroller");
          if (scroller) {
            (scroller as HTMLElement).style.height = "";
            (scroller as HTMLElement).style.minHeight = "";
            (scroller as HTMLElement).style.maxHeight = "";
            (scroller as HTMLElement).style.overflowY = "";
          }

          const content = editorElement.querySelector(".cm-content");
          if (content) {
            (content as HTMLElement).style.height = "";
            (content as HTMLElement).style.minHeight = "";
            (content as HTMLElement).style.maxHeight = "";
            (content as HTMLElement).style.whiteSpace = "";
          }
        }
      }
    }, [multiLine, isInitialized]);

    return <EditorContainer className={`${className || ""} ${multiLine === false ? "single-line" : ""}`} ref={editorRef} />;
  },
  (prevProps, nextProps) => {
    // Custom comparison function to determine if re-render is needed
    return (
      prevProps.value === nextProps.value &&
      prevProps.className === nextProps.className &&
      prevProps.placeholder === nextProps.placeholder &&
      prevProps.onBlur === nextProps.onBlur &&
      prevProps.onChange === nextProps.onChange &&
      prevProps.onKeyDown === nextProps.onKeyDown &&
      JSON.stringify(prevProps.suggestions) === JSON.stringify(nextProps.suggestions)
    );
  }
);

const EditorContainer = styled.div`
  .cm-focused {
    border: none;
    outline: none;
  }
  .cm-scroller {
    font-family: inherit;
  }
  .cm-editor {
  }

  /* Single-line mode styling */
  &.single-line {
    height: 40px;
    min-height: 40px;
    max-height: 40px;

    .cm-editor {
      height: 40px;
      min-height: 40px;
      max-height: 40px;
      line-height: 38px; /* Slightly less than height to account for borders */
      overflow-x: auto;
      overflow-y: hidden;
    }

    .cm-scroller {
      height: 40px;
      min-height: 40px;
      max-height: 40px;
      overflow-x: auto;
      overflow-y: hidden;
      white-space: pre; /* Changed from nowrap to pre to better handle spaces */
      scrollbar-width: none; /* Firefox */
      &::-webkit-scrollbar {
        display: none; /* Chrome, Safari, Edge */
      }
    }

    .cm-content {
      height: 40px;
      min-height: 40px;
      max-height: 40px;
      overflow-x: auto;
      overflow-y: hidden;
      white-space: pre !important; /* Changed from nowrap to pre to better handle spaces */
      padding: 0px;
    }

    .cm-line {
      white-space: pre !important; /* Changed from nowrap to pre to better handle spaces */
      display: inline-block;
      height: 38px;
      line-height: 38px;
      padding-top: 0 !important;
      padding-bottom: 0 !important;
    }

    /* Override any line wrapping */
    .cm-lineWrapping {
      white-space: pre !important; /* Changed from nowrap to pre */
    }
  }

  /* Class applied directly to CodeMirror's DOM element */
  .cm-single-line {
    height: 40px;
    min-height: 40px;
    max-height: 40px;

    .cm-content {
      overflow-x: auto;
      overflow-y: hidden;
      white-space: pre !important;
      height: 40px;
      min-height: 40px;
      max-height: 40px;
      padding: 0px;
    }

    .cm-scroller {
      height: 40px;
      min-height: 40px;
      max-height: 40px;
      overflow-x: auto;
      overflow-y: hidden;
      white-space: pre !important;
    }

    .cm-line {
      white-space: pre !important;
      display: inline-block;
      height: 38px;
      line-height: 38px;
      padding-top: 0 !important;
      padding-bottom: 0 !important;
    }

    /* Force disable line wrapping in single-line mode */
    &.cm-lineWrapping {
      white-space: pre !important;
    }
  }

  .cm-variable-highlight {
    background-color: hsl(var(--primary) / 0.1);
    border-radius: 2px;
    color: hsl(var(--primary));
    padding: 0 2px;
    word-break: break-all;
    /* font-weight: 500; */
  }

  .cm-placeholder {
    color: hsl(var(--foreground) / 0.5);
    pointer-events: none;
    position: absolute;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .cm-tooltip {
    background-color: hsl(var(--background));
    border: 1px solid hsl(var(--border));
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    max-height: 300px;
    overflow-y: auto;
    z-index: 1000;
  }
  .cm-tooltip.cm-tooltip-autocomplete > ul {
    font-family: inherit;
    white-space: pre-wrap;
  }

  .cm-tooltip-autocomplete {
    & > ul {
      font-family: inherit;
      max-height: 380px;
      width: 320px;
      overflow-y: auto;
      padding: 4px 0;
      white-space: pre-wrap;
    }

    .cm-completionLabel {
      padding: 0 8px;
      font-weight: 500;
      display: none; /* Hide default label */
    }

    .cm-completionDetail {
      display: none; /* Hide default detail */
    }

    .cm-suggestion-item {
      padding: 8px 10px;
      border-bottom: 1px solid #f0f0f0;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;

      &:last-child {
        border-bottom: none;
      }
    }

    .cm-suggestion-left {
      flex: 1;
    }

    .cm-suggestion-right {
      margin-left: 8px;

      a {
        font-size: 12px;
        color: hsl(var(--primary));
        text-decoration: none;
        padding: 2px 6px;
        border-radius: 4px;
        background-color: hsl(var(--primary) / 0.1);

        &:hover {
          background-color: hsl(var(--primary) / 0.2);
        }
      }
    }

    .cm-suggestion-label {
      color: hsl(var(--foreground) / 0.9);
      font-size: 14px;
      margin-bottom: 2px;
      font-weight: normal;
    }

    .cm-suggestion-description {
      font-size: 12px;
      color: hsl(var(--foreground) / 0.6);
      margin-bottom: 2px;
      white-space: pre-wrap;
    }

    .cm-suggestion-link {
      font-size: 11px;
      color: #1890ff;
      text-decoration: underline;
    }

    .cm-suggestion-info {
      padding: 8px;
      font-size: 13px;
      line-height: 1.4;

      a {
        color: #1890ff;
        text-decoration: underline;
      }

      strong {
        display: block;
        margin-bottom: 4px;
        color: #1890ff;
      }
    }

    li {
      padding: 0;
      &:hover {
        background-color: #f5f5f5;
      }
      &[aria-selected] {
        background-color: #ffe6e6;
      }
    }
  }

  .cm-tooltip-autocomplete li:hover {
    background-color: #f5f5f5;
  }
  && .cm-tooltip-autocomplete ul li[aria-selected] {
    background-color: hsl(var(--primary) / 0.1);
  }
`;
