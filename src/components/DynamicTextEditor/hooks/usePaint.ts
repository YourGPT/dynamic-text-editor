import { useEffect, useCallback, useRef } from "react";
import Quill from "quill";

// Define interfaces for Quill Blot system
interface BlotConstructor {
  blotName: string;
  tagName: string;
  className?: string;
  scope?: number;
}

// Define a custom Blot for styling text in double curly braces
type InlineBlotConstructor = {
  new (): {
    domNode: HTMLElement;
  };
  create(value?: unknown): HTMLElement;
  formats(node: HTMLElement): unknown;
};

const Inline = Quill.import("blots/inline") as InlineBlotConstructor;

class TemplateBlot extends Inline {
  static create(value: string): HTMLElement {
    const node = super.create();
    node.setAttribute("data-template", value);
    return node;
  }

  static formats(node: HTMLElement): string | undefined {
    return node.getAttribute("data-template") || undefined;
  }
}

// Add these properties using a type assertion
(TemplateBlot as unknown as BlotConstructor).blotName = "template-variable";
(TemplateBlot as unknown as BlotConstructor).tagName = "span";
(TemplateBlot as unknown as BlotConstructor).className = "template-variable";

// Register it with proper typing
Quill.register("formats/template-variable", TemplateBlot);

interface UsePaintProps {
  quillInstance: Quill | null;
  trigger?: string;
  closingChar?: string;
}

/**
 * A hook that highlights all text within {{template}} delimiters using a custom Quill blot
 */
const usePaint = ({ quillInstance, trigger = "{{", closingChar = "}}" }: UsePaintProps) => {
  const previousContentRef = useRef<string>("");
  const isHighlightingRef = useRef<boolean>(false);

  /**
   * Apply highlighting to all template patterns in the text using the custom blot
   */
  const highlightTemplates = useCallback(() => {
    if (!quillInstance || isHighlightingRef.current) {
      console.log("[highlightTemplates] Skipped - quillInstance missing or already highlighting", {
        hasQuill: !!quillInstance,
        isHighlighting: isHighlightingRef.current,
      });
      return;
    }

    // Set the flag to prevent recursive calls
    isHighlightingRef.current = true;
    console.log("[highlightTemplates] Starting highlighting process");

    // Get the current text content
    const text = quillInstance.getText();
    console.log("[highlightTemplates] Text content:", text);
    console.log("[highlightTemplates] Contains trigger pattern:", text.includes(trigger));

    // Skip if content hasn't changed to prevent loops
    // if (previousContentRef.current === text) {
    //   console.log("[highlightTemplates] Content unchanged, skipping");
    //   isHighlightingRef.current = false;
    //   return;
    // }

    console.log("[highlightTemplates] Content changed, proceeding with highlighting");
    previousContentRef.current = text;

    try {
      // Escape special regex characters in the trigger and closing
      const escapedTrigger = trigger.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const escapedClosing = closingChar.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      console.log("[highlightTemplates] Using pattern:", `${escapedTrigger}(.*?)${escapedClosing}`);

      // Create pattern to match templates with any content between delimiters
      const templatePattern = new RegExp(`${escapedTrigger}(.*?)${escapedClosing}`, "g");

      // Temporarily disable the text-change handler
      const oldHandler = quillInstance.root.oninput;
      quillInstance.root.oninput = null;
      console.log("[highlightTemplates] Disabled input handler temporarily");

      // Clear existing template formats first to avoid duplications
      console.log("[highlightTemplates] Clearing existing template formats");
      quillInstance.formatText(0, text.length, "template-variable", false);

      // Find all template patterns in text and apply highlighting
      let match;
      let matchCount = 0;
      templatePattern.lastIndex = 0; // Reset regex state

      while ((match = templatePattern.exec(text)) !== null) {
        const startIndex = match.index;
        const length = match[0].length;
        matchCount++;

        console.log(`[highlightTemplates] Found match #${matchCount}:`, {
          text: match[0],
          startIndex,
          length,
        });

        try {
          // Apply the custom template-variable format
          quillInstance.formatText(startIndex, length, "template-variable", true);
          console.log(`[highlightTemplates] Applied formatting to match #${matchCount}`);
        } catch (error) {
          console.error(`[highlightTemplates] Error applying template formatting to match #${matchCount}:`, error);
        }
      }

      console.log(`[highlightTemplates] Total matches found: ${matchCount}`);

      // Restore the input handler
      setTimeout(() => {
        quillInstance.root.oninput = oldHandler;
        console.log("[highlightTemplates] Restored input handler");
      }, 0);
    } catch (error) {
      console.error("[highlightTemplates] Error in highlightTemplates:", error);
    } finally {
      // Always reset the flag when done
      setTimeout(() => {
        isHighlightingRef.current = false;
        console.log("[highlightTemplates] Reset highlighting flag");

        // Check if highlighting was successful
        const finalHTML = quillInstance.root.innerHTML;
        console.log("[highlightTemplates] Final HTML after highlighting:", finalHTML);
        console.log("[highlightTemplates] Contains template classes:", finalHTML.includes("template-variable"));
      }, 50);
    }
  }, [quillInstance, trigger, closingChar]);

  // Use a debounced version of the highlight function to avoid performance issues
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedHighlight = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }

    timeoutIdRef.current = setTimeout(() => {
      highlightTemplates();
      timeoutIdRef.current = null;
    }, 1); // Increased delay to reduce chances of loop
  }, [highlightTemplates]);

  // Monitor text changes to detect and highlight templates
  useEffect(() => {
    if (!quillInstance) return;

    // Apply initial highlighting
    // Wait for the editor to stabilize first
    setTimeout(() => {
      highlightTemplates();
    }, 100);

    // Add event listener for text changes
    quillInstance.on("text-change", debouncedHighlight);

    return () => {
      // Clean up by removing event listeners
      if (quillInstance) {
        quillInstance.off("text-change", debouncedHighlight);
      }

      // Clear any pending timeout
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [quillInstance, highlightTemplates, debouncedHighlight]);

  return {
    highlightTemplates,
    debouncedHighlight,
  };
};

export default usePaint;
