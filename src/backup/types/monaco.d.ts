import * as monaco from "monaco-editor";

interface IEditorModel extends monaco.editor.ITextModel {
  getValueInRange(range: monaco.IRange): string;
}

interface IPosition extends monaco.Position {
  lineNumber: number;
  column: number;
}

export type { IMonacoEditor, IEditorModel, IPosition };
