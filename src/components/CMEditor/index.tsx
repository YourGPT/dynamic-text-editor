import { useEffect, useRef, useState, createElement } from "react";
import { createRoot } from "react-dom/client";
import { styled } from "styled-components";
import { EditorState, StateField, Transaction } from "@codemirror/state";
import { EditorView, Decoration, DecorationSet, keymap } from "@codemirror/view";
import { autocompletion, CompletionContext, startCompletion, completionKeymap } from "@codemirror/autocomplete";
import { syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { defaultKeymap } from "@codemirror/commands";

interface CMEditorProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: Array<{ value: string; label?: string; description?: string; link?: string }>;
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
const SuggestionItem = ({ label, detail, link }: { label: string; detail?: string; link?: string }) => {
  return (
    <div className="cm-suggestion-item">
      <div className="cm-suggestion-label">{label}</div>
      {detail && <div className="cm-suggestion-description">{detail}</div>}
      {link && <div className="cm-suggestion-link">{link}</div>}
    </div>
  );
};

// React component for suggestion tooltip (hover)
const SuggestionInfo = ({ label, detail, link }: { label: string; detail?: string; link?: string }) => {
  return (
    <div className="cm-suggestion-info">
      <strong>{label}</strong>
      {detail && <div>{detail}</div>}
      {link && (
        <div>
          <a href={link} target="_blank" rel="noopener noreferrer">
            {link}
          </a>
        </div>
      )}
    </div>
  );
};

// Create a completion source for variables
function variableCompletionSource(context: CompletionContext, suggestions: Array<{ value: string; label?: string; description?: string; link?: string }>) {
  // Match any text after {{
  const word = context.matchBefore(/\{\{([^}]*)$/);
  if (!word) return null;

  // Show suggestions even if just {{ is typed
  return {
    from: word.from + 2, // Position after '{{'
    options: suggestions.map((s) => ({
      label: s.value,
      detail: s.description || "",
      apply: `${s.value}}}`,
      boost: 1,
      info: () => {
        // Create DOM element for tooltip
        const infoEl = document.createElement("div");

        // Render React component to the DOM element
        const root = createRoot(infoEl);
        root.render(<SuggestionInfo label={s.value} detail={s.description} link={s.link} />);

        return infoEl;
      },
      // Store source object for use in the renderer
      source: s,
    })),
  };
}

// Render function for suggestion items using React
function renderSuggestionItem(completion: { label: string; detail?: string; source?: { link?: string } }) {
  // Create DOM container
  const container = document.createElement("div");

  // Create React root and render component
  const root = createRoot(container);
  root.render(<SuggestionItem label={completion.label} detail={completion.detail} link={completion.source?.link} />);

  return container;
}

export const CMEditor = ({ value, onChange, suggestions, className }: CMEditorProps) => {
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

        // Include default keymap for basic editing operations (including Enter for newlines)
        keymap.of(defaultKeymap),

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

        // Custom keymap for autocompletion
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
        ]),

        // Update parent on changes
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newValue = update.state.doc.toString();
            if (newValue !== value) {
              onChange(newValue);
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

        // Include default keymap for basic editing operations
        keymap.of(defaultKeymap),

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

        // Custom keymap for autocompletion
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
        ]),

        // Update parent on changes
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newValue = update.state.doc.toString();
            if (newValue !== value) {
              onChange(newValue);
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
  .cm-editor {
    height: 100%;
    min-height: 200px;
    border: 1px solid #ddd;
    border-radius: 4px;
    overflow: hidden;
  }

  .cm-variable-highlight {
    background-color: rgba(64, 169, 255, 0.2);
    border-radius: 2px;
    color: #1890ff;
    padding: 0 2px;
    font-weight: 500;
  }

  .cm-tooltip {
    background-color: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    max-height: 300px;
    overflow-y: auto;
    z-index: 1000;
  }

  .cm-tooltip-autocomplete {
    & > ul {
      font-family: inherit;
      max-height: 300px;
      overflow-y: auto;
      padding: 4px 0;
    }

    .cm-completionLabel {
      padding: 0 8px;
      font-weight: 500;
    }

    .cm-suggestion-item {
      padding: 8px 10px;
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }
    }

    .cm-suggestion-label {
      font-weight: 600;
      color: #1890ff;
      margin-bottom: 2px;
    }

    .cm-suggestion-description {
      font-size: 12px;
      color: #666;
      margin-bottom: 2px;
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
        background-color: #e6f7ff;
      }
    }
  }
`;
