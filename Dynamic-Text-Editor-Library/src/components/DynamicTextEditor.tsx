import React, { forwardRef, type ForwardRefRenderFunction, type ReactElement } from "react";
import { useDynamicTextEditor, type useDynamicTextEditorProps } from "../hooks/useDynamicTextEditor";

export interface DynamicTextEditorProps extends Omit<useDynamicTextEditorProps, "ref"> {
  className?: string;
  containerClassName?: string;
  editorClassName?: string;
}

export type DynamicTextEditorRef = {
  quillInstance: ReturnType<typeof useDynamicTextEditor>["quillInstance"];
  editorState: string;
  setEditorState: (content: string) => void;
  clearContent: () => void;
  focus: () => void;
  blur: () => void;
  containerRef: HTMLDivElement | null;
};

const DynamicTextEditorBase: ForwardRefRenderFunction<DynamicTextEditorRef, DynamicTextEditorProps> = (
  { className = "", containerClassName = "", editorClassName = "", ...props },
  ref
): ReactElement => {
  const { quillRef, quillInstance, editorState, setEditorState, clearContent, focus, blur } = useDynamicTextEditor({
    ...props,
  });

  // Merge refs if one is provided
  React.useImperativeHandle(ref, () => ({
    quillInstance,
    editorState,
    setEditorState,
    clearContent,
    focus,
    blur,
    containerRef: quillRef.current,
  }));

  return (
    <div className={`dynamic-text-editor ${className}`}>
      <div ref={quillRef} className={`dynamic-text-editor-container ${containerClassName} ${editorClassName}`} />
    </div>
  );
};

export const DynamicTextEditor = forwardRef<DynamicTextEditorRef, DynamicTextEditorProps>(DynamicTextEditorBase);
DynamicTextEditor.displayName = "DynamicTextEditor";

export default DynamicTextEditor;
