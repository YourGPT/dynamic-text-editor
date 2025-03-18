import { DynamicTextEditorRef as BaseRef } from "dynamic-text-editor";

declare module "dynamic-text-editor" {
  interface DynamicTextEditorRef extends BaseRef {
    setValue: (value: string) => void;
  }
}
