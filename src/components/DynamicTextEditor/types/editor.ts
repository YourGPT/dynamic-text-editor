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

export type ContentBlockType = {
  getText: () => string;
};

export type FindEntityCallback = (start: number, end: number) => void;
