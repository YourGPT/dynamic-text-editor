import { EditorView } from "@codemirror/view";
import { Extension } from "@codemirror/state";

export const promptTheme: Extension = EditorView.theme({
  "&": {
    fontSize: "14px",
    height: "100%",
    width: "100%",
  },

  // Selection styles
  ".cm-selectionBackground": {
    background: "highlight !important",
  },
  ".cm-focused .cm-selectionBackground": {
    background: "highlight !important",
  },

  // Variable wrapper
  ".cm-variable-wrapper": {
    display: "inline-block",
    borderRadius: "4px",
    padding: "2px 0",
    margin: "0 2px",
    backgroundColor: "#d6ebff",
    border: "1px solid #e2e8f0",
  },

  // Basic elements
  ".cm-variable-bracket": {
    color: "#64748b !important",
  },

  // Variable categories
  ".cm-flow-variable": {
    color: "#2563eb !important",
    background: "#dbeafe",
    padding: "0 4px",
    borderRadius: "3px",
  },
  ".cm-session-variable": {
    color: "#7c3aed !important",
    background: "#ede9fe",
    padding: "0 4px",
    borderRadius: "3px",
  },
  ".cm-visitor-variable": {
    color: "#059669 !important",
    background: "#d1fae5",
    padding: "0 4px",
    borderRadius: "3px",
  },
  ".cm-contact-variable": {
    color: "#dc2626 !important",
    background: "#fee2e2",
    padding: "0 4px",
    borderRadius: "3px",
  },

  // Function categories
  ".cm-equality-function": {
    color: "#0284c7 !important",
    background: "#e0f2fe",
    padding: "0 4px",
    borderRadius: "3px",
  },
  ".cm-logical-function": {
    color: "#7c2d12 !important",
    background: "#ffedd5",
    padding: "0 4px",
    borderRadius: "3px",
  },
  ".cm-string-function": {
    color: "#4338ca !important",
    background: "#e0e7ff",
    padding: "0 4px",
    borderRadius: "3px",
  },

  // Other elements
  ".cm-parameter": {
    color: "#475569 !important",
    fontStyle: "italic",
  },
  ".cm-string": {
    color: "#166534 !important",
  },

  // Add these new styles for suggestions and completions
  ".cm-tooltip": {
    fontSize: "14px",
  },
  ".cm-completionLabel": {
    fontSize: "14px",
    padding: "2px 4px",
  },
  ".cm-tooltip.cm-tooltip-autocomplete": {
    minWidth: "auto",
    maxWidth: "400px",
  },
  ".cm-tooltip.cm-tooltip-autocomplete > ul": {
    maxHeight: "200px",
    minWidth: "200px",
  },
  ".cm-tooltip.cm-tooltip-autocomplete > ul > li": {
    padding: "2px 4px",
  },
});
