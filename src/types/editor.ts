/* eslint-disable @typescript-eslint/no-explicit-any */
import { Editor } from "draft-js";

export interface BaseEditorItem {
  value: string;
  label: string;
  description: string;
  category: string;
  type: "function" | "variable";
  link?: string;
  docs?: string;
}

export interface EditorClassNames {
  root: string;
  variable: string;
  suggestions: string;
  suggestion: string;
  suggestionSelected: string;
  category: string;
  description: string;
}

export interface DraftPromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: BaseEditorItem[];
  className?: string;
  classNames?: Partial<EditorClassNames>;
  placeholder?: string;
}

export interface DraftPromptEditorRef {
  focus: () => void;
  getEditor: () => Editor | null;
}

export type ContentBlockType = {
  getText: () => string;
};

export type FindEntityCallback = (start: number, end: number) => void;
