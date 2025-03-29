/* eslint-disable @typescript-eslint/no-explicit-any */
import { ContentBlock, Editor } from "draft-js";

export interface BaseEditorItem {
  id?: string | number;
  label: string;
  value: string;
  category: string;
  description: string;
  link?: string;
  icon?: string;
  type?: string;
  [key: string]: any; // Allow additional properties
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

export interface EditorRenderProps {
  renderItem?: (item: BaseEditorItem, isSelected: boolean) => React.ReactNode;
  renderCategory?: (item: BaseEditorItem) => React.ReactNode;
  renderDescription?: (item: BaseEditorItem) => React.ReactNode;
}

export interface ContentBlockType extends ContentBlock {
  getText(): string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface EditorClassNames {
  root: string;
  variable: string;
  suggestions: string;
  suggestion: string;
  suggestionSelected: string;
  category: string;
  description: string;
}

export interface EditorRenderProps {
  renderItem?: (item: BaseEditorItem, isSelected: boolean) => React.ReactNode;
  renderCategory?: (item: BaseEditorItem) => React.ReactNode;
  renderDescription?: (item: BaseEditorItem) => React.ReactNode;
}

export interface ContentBlockType extends ContentBlock {
  getText(): string;
}

export type FindEntityCallback = (start: number, end: number) => void;

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
