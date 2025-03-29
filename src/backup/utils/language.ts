import { LanguageSupport, StreamLanguage } from "@codemirror/language";
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";

const promptLanguage = StreamLanguage.define({
  name: "prompt",

  startState: () => ({
    inVariable: false,
    category: "",
    isComplete: false,
  }),

  token(stream, state) {
    // Handle opening braces
    if (stream.match("{{")) {
      state.inVariable = true;
      state.isComplete = false;
      return "variable-bracket";
    }

    // Handle closing braces
    if (stream.match("}}")) {
      state.inVariable = false;
      state.category = "";
      state.isComplete = true;
      return "variable-bracket";
    }

    if (state.inVariable) {
      stream.eatSpace();

      // Match specific categories with their prefixes
      const categoryMatches = [
        { prefix: /FLOW\.|Flow\./i, category: "Flow" },
        { prefix: /SESSION\./i, category: "Session" },
        { prefix: /VISITOR\./i, category: "Visitor" },
        { prefix: /CONTACT\./i, category: "Contact" },
      ];

      for (const { prefix, category } of categoryMatches) {
        if (stream.match(prefix)) {
          state.category = category;
          return `variable-prefix ${category}`;
        }
      }

      // Match property names after dots for variables
      if (state.category && stream.match(/[\w_]+/)) {
        return `variable-value ${state.category}`;
      }

      // Match function names
      const functionMatches = [
        { pattern: /eq|gt|lt/, category: "Equality" },
        { pattern: /and|or|not/, category: "Logical" },
        { pattern: /uppercase|lowercase|trim/, category: "String" },
      ];

      for (const { pattern, category } of functionMatches) {
        if (stream.match(pattern)) {
          state.category = category;
          return `function ${category}`;
        }
      }

      // Match parameters
      // eslint-disable-next-line no-useless-escape
      if (stream.match(/[\w_]+=(?=\')/)) {
        return "parameter";
      }

      // Match string values
      if (stream.match(/'[^']*'/)) {
        return "string";
      }

      stream.next();
      return null;
    }

    stream.next();
    return null;
  },
});

const variableDecoration = Decoration.mark({
  class: "cm-variable-wrapper",
  inclusive: true,
  selectAll: true,
});

const variablePlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.getDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.getDecorations(update.view);
      }
    }

    getDecorations(view: EditorView) {
      const builder = new RangeSetBuilder<Decoration>();

      for (const { from, to } of view.visibleRanges) {
        const text = view.state.doc.sliceString(from, to);
        let match;
        const regex = /\{\{[^}]+\}\}/g;

        while ((match = regex.exec(text)) !== null) {
          const start = from + match.index;
          const end = start + match[0].length;
          builder.add(start, end, variableDecoration);
        }
      }

      return builder.finish();
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

export function promptLanguageSupport() {
  return new LanguageSupport(promptLanguage, [variablePlugin]);
}
