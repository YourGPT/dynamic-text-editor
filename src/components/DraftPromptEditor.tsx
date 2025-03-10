import { useEffect, useRef, useState, useMemo, forwardRef, useImperativeHandle } from "react";
import type { ForwardRefRenderFunction, ReactElement } from "react";
import { Editor, EditorState, CompositeDecorator, Modifier, SelectionState, ContentState, DraftHandleValue, getDefaultKeyBinding } from "draft-js";
import { styled } from "styled-components";
import { ContentBlockType, FindEntityCallback, DraftPromptEditorProps, BaseEditorItem, DraftPromptEditorRef } from "../types/editor";

function findVariableEntities(contentBlock: ContentBlockType, callback: FindEntityCallback) {
  const text = contentBlock.getText();
  const regex = /\{\{[^}]+\}\}/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    callback(match.index, match.index + match[0].length);
  }
}

const VariableSpan: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return <span className={`variable ${className || ""}`}>{children}</span>;
};

const DraftPromptEditor: ForwardRefRenderFunction<DraftPromptEditorRef, DraftPromptEditorProps> = (props, ref): ReactElement => {
  const { value, onChange, suggestions: options, placeholder, className, classNames } = props;

  const decorator = useMemo(
    () =>
      new CompositeDecorator([
        {
          strategy: findVariableEntities,
          component: (props) => <VariableSpan {...props} className={classNames?.variable} />,
        },
      ]),
    [classNames?.variable]
  );

  const [editorState, setEditorState] = useState(() => {
    const contentState = ContentState.createFromText(value);
    return EditorState.createWithContent(contentState, decorator);
  });
  const [suggestions, setSuggestions] = useState<typeof options>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionPosition, setSuggestionPosition] = useState<{
    top: number;
    left: number;
    maxHeight?: number;
  }>({ top: 0, left: 0 });
  const editorRef = useRef<Editor>(null);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(
    ref,
    () => ({
      focus: () => {
        editorRef.current?.focus();
      },
      getEditor: () => editorRef.current,
    }),
    []
  );

  useEffect(() => {
    const currentContent = editorState.getCurrentContent().getPlainText();
    if (value !== currentContent) {
      const contentState = ContentState.createFromText(value);
      const newEditorState = EditorState.createWithContent(contentState, decorator);
      const selection = editorState.getSelection();
      const stateWithSelection = EditorState.forceSelection(newEditorState, selection);
      setEditorState(stateWithSelection);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, decorator]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSuggestions && editorRef.current && suggestionsRef.current && !editorRef.current.editor?.contains(event.target as Node) && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSuggestions]);

  const handleBeforeInput = (): DraftHandleValue => {
    const selection = editorState.getSelection();
    if (!selection.isCollapsed()) {
      return "not-handled";
    }
    return "not-handled";
  };

  const handlePastedText = (text: string): DraftHandleValue => {
    const selection = editorState.getSelection();
    const contentState = editorState.getCurrentContent();
    const newContent = Modifier.replaceText(contentState, selection, text);
    const newEditorState = EditorState.push(editorState, newContent, "insert-characters");

    const newSelection = selection.merge({
      anchorOffset: selection.getStartOffset() + text.length,
      focusOffset: selection.getStartOffset() + text.length,
    });
    const stateWithSelection = EditorState.forceSelection(newEditorState, newSelection);

    handleEditorChange(stateWithSelection);
    return "handled";
  };

  const handleKeyCommand = (command: string): DraftHandleValue => {
    if (showSuggestions) {
      switch (command) {
        case "arrow-up":
          setSelectedSuggestionIndex((prev) => {
            const newIndex = prev > 0 ? prev - 1 : suggestions.length - 1;
            scrollSelectedIntoView(newIndex);
            return newIndex;
          });
          return "handled";
        case "arrow-down":
          setSelectedSuggestionIndex((prev) => {
            const newIndex = prev < suggestions.length - 1 ? prev + 1 : 0;
            scrollSelectedIntoView(newIndex);
            return newIndex;
          });
          return "handled";
        case "enter":
          if (suggestions[selectedSuggestionIndex]) {
            handleSuggestionClick(suggestions[selectedSuggestionIndex]);
            return "handled";
          }
          break;
        case "escape":
          setShowSuggestions(false);
          return "handled";
      }
    }
    return "not-handled";
  };

  const handleEditorChange = (newState: EditorState) => {
    const selection = newState.getSelection();
    const content = newState.getCurrentContent();
    const block = content.getBlockForKey(selection.getStartKey());
    const text = block.getText();
    const cursorPosition = selection.getStartOffset();

    const beforeCursor = text.slice(0, cursorPosition);
    const match = beforeCursor.match(/\{\{[\w._]*$/);

    if (match) {
      const searchText = match[0].replace(/^\{\{/, "").toLowerCase();
      const filtered = options.filter((item: BaseEditorItem) => item.value.toLowerCase().includes(searchText));

      setSuggestions(filtered);
      setSelectedSuggestionIndex(0);
      setShowSuggestions(true);

      if (editorRef.current) {
        const editorBounds = editorRef.current.editor?.getBoundingClientRect();
        const caretBounds = getCaretCoordinates();
        if (editorBounds && caretBounds) {
          const position = calculateSuggestionPosition(editorBounds, caretBounds);
          setSuggestionPosition(position);
        }
      }
    } else {
      setShowSuggestions(false);
    }

    setEditorState(newState);
    onChange(content.getPlainText());
  };

  const handleSuggestionClick = (suggestion: (typeof options)[0]) => {
    const contentState = editorState.getCurrentContent();
    const selection = editorState.getSelection();
    const block = contentState.getBlockForKey(selection.getStartKey());
    const text = block.getText();
    const cursorPosition = selection.getStartOffset();

    const beforeCursor = text.slice(0, cursorPosition);
    const match = beforeCursor.match(/\{\{[\w._]*$/);

    if (match) {
      const start = cursorPosition - match[0].length;
      const newSelection = SelectionState.createEmpty(selection.getStartKey()).merge({
        anchorOffset: start,
        focusOffset: cursorPosition,
      });

      const newContent = Modifier.replaceText(contentState, newSelection, ` {{${suggestion.value}}} `);

      const newState = EditorState.push(editorState, newContent, "insert-characters");
      const afterInsertSelection = newSelection.merge({
        anchorOffset: start + suggestion.value.length + 6,
        focusOffset: start + suggestion.value.length + 6,
      });
      const stateWithSelection = EditorState.forceSelection(newState, afterInsertSelection);

      setEditorState(stateWithSelection);
      setShowSuggestions(false);
      onChange(newContent.getPlainText());
    }
  };

  const keyBindingFn = (e: React.KeyboardEvent): string | null => {
    if (showSuggestions) {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        return "arrow-up";
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        return "arrow-down";
      }
      if (e.key === "Enter") {
        e.preventDefault();
        return "enter";
      }
      if (e.key === "Escape") {
        e.preventDefault();
        return "escape";
      }
    }
    return getDefaultKeyBinding(e);
  };

  const scrollSelectedIntoView = (index: number) => {
    if (suggestionsRef.current) {
      const suggestionItems = suggestionsRef.current.children;
      if (suggestionItems[index]) {
        const item = suggestionItems[index] as HTMLElement;
        const container = suggestionsRef.current;

        const itemTop = item.offsetTop;
        const itemBottom = itemTop + item.offsetHeight;
        const containerTop = container.scrollTop;
        const containerBottom = containerTop + container.offsetHeight;

        if (itemTop < containerTop) {
          // Scroll up to show item
          container.scrollTop = itemTop;
        } else if (itemBottom > containerBottom) {
          // Scroll down to show item
          container.scrollTop = itemBottom - container.offsetHeight;
        }
      }
    }
  };

  const calculateSuggestionPosition = (editorBounds: DOMRect, caretBounds: { top: number; left: number }) => {
    const windowHeight = window.innerHeight;
    const suggestionsHeight = Math.min(suggestions.length * 76, 400);
    const spaceBelow = windowHeight - caretBounds.top - 24;
    const spaceAbove = caretBounds.top - editorBounds.top;

    // Calculate left position with bounds checking
    let left = caretBounds.left - editorBounds.left;
    const maxLeft = editorBounds.width - 320; // 320px is min-width of suggestions
    left = Math.min(left, maxLeft);
    left = Math.max(0, left);

    if (spaceBelow < suggestionsHeight && spaceAbove > suggestionsHeight) {
      // Show above if more space above and not enough below
      return {
        top: caretBounds.top - editorBounds.top - suggestionsHeight - 8,
        left,
        maxHeight: Math.min(spaceAbove - 16, 400),
      };
    } else {
      // Show below by default
      return {
        top: caretBounds.top - editorBounds.top + 24,
        left,
        maxHeight: Math.min(spaceBelow - 16, 400),
      };
    }
  };

  return (
    <EditorWrapper className={`${className || ""} ${classNames?.root || ""}`} onClick={() => editorRef.current?.focus()}>
      <Editor
        ref={editorRef}
        editorState={editorState}
        onChange={handleEditorChange}
        handleBeforeInput={handleBeforeInput}
        handlePastedText={handlePastedText}
        handleKeyCommand={handleKeyCommand}
        keyBindingFn={keyBindingFn}
        placeholder={placeholder}
      />
      {showSuggestions && (
        <SuggestionsBox
          ref={suggestionsRef}
          className={classNames?.suggestions}
          style={{
            top: suggestionPosition.top + 20,
            left: suggestionPosition.left,
            maxHeight: suggestionPosition.maxHeight,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {suggestions.map((suggestion: BaseEditorItem, index: number) => (
            <SuggestionItem
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              $isSelected={index === selectedSuggestionIndex}
              className={`${classNames?.suggestion || ""} ${index === selectedSuggestionIndex ? classNames?.suggestionSelected || "" : ""}`}
              onMouseEnter={() => setSelectedSuggestionIndex(index)}
            >
              <SuggestionContent>
                <SuggestionLabel>
                  <span>{suggestion.value}</span>
                  {suggestion.link ? (
                    <CategoryLink href={suggestion.link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                      {suggestion.category}
                    </CategoryLink>
                  ) : (
                    <SuggestionCategory className={classNames?.category}>{suggestion.category}</SuggestionCategory>
                  )}
                </SuggestionLabel>
                <SuggestionDescription className={classNames?.description}>{suggestion.description}</SuggestionDescription>
              </SuggestionContent>
              {suggestion.docs && (
                <DocsLink href={suggestion.docs} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                  Docs
                </DocsLink>
              )}
            </SuggestionItem>
          ))}
        </SuggestionsBox>
      )}
    </EditorWrapper>
  );
};

function getCaretCoordinates(): { top: number; left: number } | null {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return null;

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  return { top: rect.top, left: rect.left };
}

export default forwardRef<DraftPromptEditorRef, DraftPromptEditorProps>(DraftPromptEditor);

// Styled components
const EditorWrapper = styled.div`
  position: relative;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  min-height: 300px;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 15px;
  line-height: 1.6;
  color: #1e293b;
  background: #ffffff;
  cursor: text;

  &:focus-within {
    border-color: #3b82f6;
  }

  .variable {
    background-color: #dbeafe;
    padding: 2px 4px;
    border-radius: 4px;
    color: #2563eb;
    font-weight: 500;
  }

  .public-DraftEditorPlaceholder-root {
    color: #94a3b8;
    position: absolute;
    pointer-events: none;
  }
`;

const SuggestionsBox = styled.div`
  position: absolute;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  overflow-y: auto;
  z-index: 1000;
  min-width: 320px;
  max-width: 500px;

  /* Scrollbar styling */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }
`;

const SuggestionItem = styled.div<{ $isSelected: boolean }>`
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f1f5f9;
  background-color: ${(props) => (props.$isSelected ? "#f1f5f9" : "transparent")};
  display: flex;
  justify-content: space-between;
  gap: 8px;

  &:hover {
    background-color: #f8fafc;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const SuggestionContent = styled.div`
  flex: 1;
`;

const DocsLink = styled.a`
  color: #3b82f6;
  font-size: 0.875em;
  text-decoration: none;
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 4px;

  &:hover {
    background-color: #dbeafe;
  }
`;

const SuggestionLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;

  span {
    font-weight: 500;
    color: #0f172a;
  }
`;

const SuggestionCategory = styled.span`
  font-size: 0.875em;
  color: #64748b;
  background: #f8fafc;
  padding: 2px 8px;
  border-radius: 4px;
`;

const CategoryLink = styled(SuggestionCategory).attrs({ as: "a" })`
  color: #3b82f6;
  text-decoration: underline;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;

  svg {
    width: 12px;
    height: 12px;
  }

  &:hover {
    background: #f8fafc;
  }
`;

const SuggestionDescription = styled.div`
  font-size: 0.875em;
  color: #475569;
`;
