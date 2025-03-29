/* eslint-disable @typescript-eslint/no-explicit-any */
import { Completion, CompletionContext, CompletionResult } from "@codemirror/autocomplete";
import { EditorView } from "@codemirror/view";

export function createCompletions(items: any[]) {
  return (context: CompletionContext): CompletionResult | null => {
    // Check if we're inside a variable block
    const before = context.matchBefore(/\{\{[\w._]*\}?\}?$/);

    if (!before) return null;

    // Check if we're between braces
    const hasClosingBraces = before.text.endsWith("}}");

    // Only show suggestions after {{ is typed
    if (!before.text.startsWith("{{")) {
      return null;
    }

    // Get the text after {{ to match against
    const query = before.text.replace(/^\{\{|\}\}$/g, "").toLowerCase();

    const options: Completion[] = items
      ?.filter((item) => item.value.toLowerCase().includes(query))
      ?.map((item) => ({
        label: item.value,
        type: item.type as "variable" | "function",
        detail: item.category,

        info: () => {
          const dom = document.createElement("div");

          dom.innerHTML = `
            <div style="padding: 4px; height:8px;">
              <div>${item.description || ""}</div>
              <a href="${item.docs}" target="_blank" rel="noopener noreferrer">Docs</a>
            </div>
          `;
          return dom;
        },

        // info: (completion) => {
        //   // Custom info panel content
        //   const dom = document.createElement("div");
        //   dom.innerHTML = `
        //     <div style="padding: 8px;">
        //       <div style="font-weight: bold">${item.label}</div>
        //       <div>${item.description || ""}</div>
        //     </div>
        //   `;
        //   return dom;
        // },
        category: item.category,
        boost: item.value.toLowerCase().startsWith(query) ? 2 : 1,
        apply: (view: EditorView, completion: { label: string }, from: number, to: number) => {
          // const start = from - (before.text.startsWith("{{") ? 2 : 0);
          const start = from - 2;
          // If we're between empty braces {{}}, just insert the completion label
          // const completionText = before.text === "{{}}" ? completion.label : hasClosingBraces ? `{{${completion.label}}}` : `{{${completion.label}`;

          view.dispatch({
            changes: {
              from: start,
              to: to,
              // insert: completionText,
              insert: `{{${completion.label}`,
            },
          });
        },
      }));

    return {
      from: before.from + 2,
      to: hasClosingBraces ? before.to - 2 : before.to,
      options,
      validFor: /^[\w._]*$/,
    };
  };
}
