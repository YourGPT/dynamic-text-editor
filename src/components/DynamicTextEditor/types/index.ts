import { ReactNode } from "react";
import Quill from "quill";

export interface BaseEditorItem {
  id?: string | number;
  label: string;
  value: string;
  description?: string;
  category?: string;
  type?: string;
  link?: string;
  docs?: string;
}

export interface EditorClassNames {
  container?: string;
  editor?: string;
  variable?: string;
  suggestions?: string;
  suggestion?: string;
  suggestionSelected?: string;
  suggestionHovered?: string;
  category?: string;
  description?: string;
}

export interface DynamicTextEditorProps {
  value?: string;
  initialValue?: string;
  onChange: (value: string) => void;
  suggestions: BaseEditorItem[];
  placeholder?: string;
  className?: string;
  classNames?: EditorClassNames;
  renderItem?: (item: BaseEditorItem, isSelected: boolean, isHovered: boolean) => ReactNode;
  renderCategory?: (item: BaseEditorItem) => ReactNode;
  renderDescription?: (item: BaseEditorItem) => ReactNode;
  minSuggestionWidth?: number;
  maxSuggestionWidth?: number;
  maxSuggestionHeight?: number;
  suggestionTrigger?: string;
  suggestionClosing?: string;
  theme?: "snow" | "bubble";
  fontSize?: string;
  lineHeight?: string;
  width?: string;
  height?: string;
  toolbar?: boolean | ToolbarConfig;
  formats?: string[];
  onFocus?: () => void;
  onBlur?: () => void;
  defaultValue?: string;
  readOnly?: boolean;
  showCustomToolbar?: boolean;
}

export interface DynamicTextEditorRef {
  quillInstance: Quill | null;
  editorState: string;
  setEditorState: (content: string) => void;
  clearContent: () => void;
  focus: () => void;
  blur: () => void;
  containerRef: HTMLDivElement | null;
  setValue: (value: string) => void;
}

export type ToolbarConfig = Array<
  | string[]
  | Array<{
      header?: number[] | number | false;
      align?: string[];
      list?: string;
      script?: string;
      indent?: string;
      direction?: string;
      size?: string;
      color?: string;
      background?: string;
      font?: string;
      code?: string;
    }>
>;
