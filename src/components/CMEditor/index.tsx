import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { styled } from "styled-components";
import { EditorState, StateField, Transaction } from "@codemirror/state";
import { EditorView, Decoration, DecorationSet, keymap, WidgetType } from "@codemirror/view";
import { autocompletion, CompletionContext, startCompletion, completionKeymap } from "@codemirror/autocomplete";
import { syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";

interface CMEditorProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: Array<{ value: string; label?: string; description?: string; link?: string }>;
  placeholder?: string;
  className?: string;
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
      to: match.index + match[0].length,
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
const SuggestionItem = ({ label, detail, link, value }: { label: string; detail?: string; link?: string; value?: string }) => {
  return (
    <div className="cm-suggestion-item">
      <div className="cm-suggestion-left">
        <div className="cm-suggestion-label">{label}</div>
        {detail && <div className="cm-suggestion-description">{detail}</div>}
      </div>
      {/* <div className="cm-suggestion-right">
        {link && (
          <a href={link} target="_blank" rel="noopener noreferrer">
            {link}
          </a>
        )}
      </div> */}
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
    for (let i = cursorPosInLine; i < lineText.length - 1; i++) {
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
        // info: () => {
        //   // Create DOM element for tooltip
        //   const infoEl = document.createElement("div");

        //   // Render React component to the DOM element
        //   const root = createRoot(infoEl);
        //   root.render(<SuggestionInfo label={s.value} detail={s.description} link={s.link} />);

        //   return infoEl;
        // },
        // Store source object for use in the renderer
        source: s,
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
      //   info: () => {
      //     // Create DOM element for tooltip
      //     const infoEl = document.createElement("div");

      //     // Render React component to the DOM element
      //     const root = createRoot(infoEl);
      //     root.render(<SuggestionInfo label={s.value} detail={s.description} link={s.link} />);

      //     return infoEl;
      //   },
      // Store source object for use in the renderer
      source: s,
    })),
  };
}

// Render function for suggestion items using React
function renderSuggestionItem(completion: { label: string; detail?: string; source?: { link?: string; value?: string } }) {
  // Create DOM container
  const container = document.createElement("div");

  // Create React root and render component
  const root = createRoot(container);
  root.render(<SuggestionItem label={completion.label} detail={completion.detail} link={completion.source?.link} value={completion.source?.value} />);

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
    for (let i = cursorPosInLine; i < lineText.length - 1; i++) {
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
    if (view.state.doc.length > 0) return Decoration.none;

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

export const CMEditor = ({ value, onChange, suggestions, placeholder, className }: CMEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const initializedRef = useRef(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Add source property to suggestions for accessing in renderer
  const enhancedSuggestions = suggestions.map((s) => ({ ...s, source: s }));

  // Initialize editor only once
  useEffect(() => {
    if (!editorRef.current || initializedRef.current) return;
    initializedRef.current = true;

    const state = EditorState.create({
      doc: value,
      extensions: [
        // Basic editor setup
        EditorView.lineWrapping,
        syntaxHighlighting(highlightStyle),

        // Placeholder (if provided)
        placeholder ? placeholderExtension(placeholder) : [],

        // History extension for undo/redo functionality
        history(),

        // Include keymaps for basic editing, history, and indentation
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),

        // Include keymap for completions
        keymap.of(completionKeymap),

        // Variable highlighting
        variableField,

        // Custom autocompletion
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
        }),

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

        // Update parent on changes
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newValue = update.state.doc.toString();
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
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;
    setIsInitialized(true);

    return () => {
      view.destroy();
      viewRef.current = null;
      initializedRef.current = false;
    };
  }, []); // Initialize only once

  // Update suggestions when they change
  useEffect(() => {
    if (!viewRef.current || !isInitialized) return;

    // We don't need to rebuild the whole editor, just recreate it with new config
    // Since we can't easily reconfigure just the autocompletion extension
    const currentView = viewRef.current;
    const selection = currentView.state.selection;
    const currentDoc = currentView.state.doc;

    const newState = EditorState.create({
      doc: currentDoc,
      selection,
      extensions: [
        // Basic editor setup
        EditorView.lineWrapping,
        syntaxHighlighting(highlightStyle),

        // Placeholder (if provided)
        placeholder ? placeholderExtension(placeholder) : [],

        // History extension for undo/redo functionality
        history(),

        // Include keymaps for basic editing, history, and indentation
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),

        // Include keymap for completions
        keymap.of(completionKeymap),

        // Variable highlighting
        variableField,

        // Custom autocompletion with updated suggestions
        autocompletion({
          override: [(ctx) => variableCompletionSource(ctx, enhancedSuggestions)],
          activateOnTyping: true,
          closeOnBlur: false,
          maxRenderedOptions: 10,
          addToOptions: [
            {
              render: renderSuggestionItem,
              position: 20,
            },
          ],
          icons: false,
        }),

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

        // Update parent on changes
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newValue = update.state.doc.toString();
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
        }),
      ],
    });

    currentView.setState(newState);
  }, [suggestions, isInitialized]);

  // Update content when value prop changes
  useEffect(() => {
    if (!viewRef.current || !isInitialized) return;

    const currentValue = viewRef.current.state.doc.toString();
    if (value !== currentValue) {
      // Get selection to restore
      const selection = viewRef.current.state.selection;

      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: value,
        },
        // Maintain selection and focus
        selection,
        scrollIntoView: true,
      });
    }
  }, [value, isInitialized]);

  return <EditorContainer className={className} ref={editorRef} />;
};

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

  .cm-variable-highlight {
    background-color: hsl(var(--primary) / 0.1);
    border-radius: 2px;
    color: hsl(var(--primary));
    padding: 0 2px;
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

      &:last-child {
        border-bottom: none;
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
