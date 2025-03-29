/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import CodeMirror from "@uiw/react-codemirror";
import { styled } from "styled-components";
import { autocompletion } from "@codemirror/autocomplete";
import { createCompletions } from "../utils/completions";
import { promptLanguageSupport } from "../utils/language";
import { promptTheme } from "../utils/theme";

const allItems: any[] = [];

interface AIPromptEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const AIPromptEditor: React.FC<AIPromptEditorProps> = ({ value, onChange }) => {
  const extensions = React.useMemo(
    () => [
      promptLanguageSupport(),
      promptTheme,
      autocompletion({
        override: [createCompletions(allItems)],
        defaultKeymap: true,
        maxRenderedOptions: 50,
        activateOnTyping: true,
      }),
    ],
    []
  );

  return (
    <EditorWrapper>
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={extensions}
        theme="light"
        height="300px"
        autoFocus={true}
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          dropCursor: false,
          allowMultipleSelections: false,
          indentOnInput: false,
        }}
      />
    </EditorWrapper>
  );
};

export default AIPromptEditor;

const EditorWrapper = styled.div`
  .cm-editor {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 15px;
    line-height: 1.6;
    color: #1e293b;
    background: #ffffff;
  }

  .cm-editor.cm-focused {
    outline: none;
    border-color: #3b82f6;
  }

  /* Content padding */
  .cm-content {
    padding: 16px !important;
  }

  .cm-line {
    padding: 2px 0;
  }

  /* Hide line numbers */
  .cm-gutters {
    display: none;
  }

  /* Improve suggestion box styling */
  .cm-tooltip.cm-tooltip-autocomplete {
    border: none;
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    padding: 4px;
    max-height: 400px;
    max-width: 500px;
  }

  .cm-tooltip.cm-tooltip-autocomplete > ul {
    font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
    padding: 4px;
  }

  .cm-tooltip.cm-tooltip-autocomplete > ul > li {
    padding: 8px 12px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected] {
    background-color: #f1f5f9;
  }

  /* Style the completion items */
  .cm-completionLabel {
    color: #0f172a;
    font-weight: 500;
  }

  .cm-completionDetail {
    color: #64748b;
    font-size: 0.875em;
    padding: 2px 8px;
    border-radius: 4px;
    background: #f8fafc;
  }

  .cm-completionInfo {
    padding: 12px;
    color: #475569;
    font-size: 0.875em;
    border-top: 1px solid #e2e8f0;
    line-height: 1.6;
  }

  /* Cursor styling */
  .cm-cursor {
    border-left-color: #3b82f6;
  }

  /* Selection styling */
  .cm-selectionBackground {
    background: #dbeafe !important;
  }

  .cm-focused .cm-selectionBackground {
    background: #dbeafe !important;
  }

  /* Scrollbar styling */
  .cm-scroller::-webkit-scrollbar {
    width: 12px;
  }

  .cm-scroller::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 8px;
  }

  .cm-scroller::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 8px;
    border: 3px solid #f1f5f9;
  }

  .cm-tooltip.cm-tooltip-autocomplete > ul::-webkit-scrollbar {
    width: 12px;
  }

  .cm-tooltip.cm-tooltip-autocomplete > ul::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 8px;
  }

  .cm-tooltip.cm-tooltip-autocomplete > ul::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 8px;
    border: 3px solid #f1f5f9;
  }
`;
