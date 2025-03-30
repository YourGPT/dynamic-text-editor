import React, { useEffect, useRef, useCallback, useState } from "react";
import { BaseEditorItem } from "./types";
import { styled, keyframes } from "styled-components";
import Quill from "quill";

interface SuggestionsProps {
  quillInstance: Quill | null;
  suggestions: BaseEditorItem[];
  trigger: string;
  closingChar?: string;
  renderItem?: (item: BaseEditorItem, isSelected: boolean, isHovered: boolean) => React.ReactNode;
  classNames?: {
    suggestions?: string;
    suggestion?: string;
    suggestionSelected?: string;
    suggestionHovered?: string;
    category?: string;
    description?: string;
    container?: string;
  };
  maxHeight?: number;
  minWidth?: number;
  maxWidth?: number;
  onValueUpdate?: (value: string) => void;
  className?: string;
}

// Animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Styled Components
const SuggestionsDropdown = styled.div`
  position: fixed;
  z-index: 9999;
  overflow-y: auto;
  overflow-x: hidden;
  border-radius: 8px;
  box-shadow: 0 6px 16px hsl(var(--foreground) / 0.08), 0 3px 6px hsl(var(--foreground) / 0.05);
  background-color: hsl(var(--background));
  border: 1px solid hsl(var(--foreground) / 0.1);
  /* overflow: hidden; */
  padding: 4px 0;
  animation: ${fadeIn} 0.2s ease-in-out;

  /* Scrollbar styling */
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: hsl(var(--background) / 0.9);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: hsl(var(--foreground) / 0.2);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: hsl(var(--foreground) / 0.3);
  }
`;

const BaseSuggestionItem = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border-bottom: 1px solid hsl(var(--foreground) / 0.05);
  user-select: none;
  color: hsl(var(--foreground));

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: hsl(var(--primary) / 0.05);
  }

  &.selected {
    background-color: hsl(var(--primary) / 0.1);
  }
`;

const DefaultSuggestionItem = styled(BaseSuggestionItem)`
  border-left: 3px solid transparent;

  &.selected {
    border-left: 3px solid hsl(var(--primary) / 0.8);
  }

  &:hover:not(.selected) {
    border-left: 3px solid hsl(var(--primary) / 0.4);
  }
`;

const CustomSuggestionItem = styled(BaseSuggestionItem)`
  background-color: transparent;

  &.selected {
    background-color: hsl(var(--primary) / 0.08);
  }

  &:hover:not(.selected) {
    background-color: hsl(var(--primary) / 0.03);
  }
`;

const SuggestionItemContent = styled.div`
  &.default-suggestion {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
`;

const SuggestionItemLabel = styled.div`
  font-weight: 500;
  transition: all 0.2s ease;

  ${DefaultSuggestionItem}:hover &,
  ${DefaultSuggestionItem}.selected & {
    color: hsl(var(--foreground));
  }
`;

const SuggestionItemDescription = styled.div`
  font-size: 0.9em;
  color: hsl(var(--foreground) / 0.7);
  transition: all 0.2s ease;

  ${DefaultSuggestionItem}:hover &,
  ${DefaultSuggestionItem}.selected & {
    color: hsl(var(--foreground) / 0.8);
  }
`;

const SuggestionItemCategory = styled.div`
  font-size: 0.8em;
  color: hsl(var(--foreground) / 0.5);
  transition: all 0.2s ease;

  ${DefaultSuggestionItem}:hover &,
  ${DefaultSuggestionItem}.selected & {
    color: hsl(var(--foreground) / 0.7);
  }
`;

// Enhanced suggestion item styled components
const EnhancedItem = styled.div`
  cursor: pointer;
  border-bottom: 1px solid hsl(var(--foreground) / 0.05);
  background-color: transparent;
  display: flex;
  justify-content: space-between;
  gap: 8px;

  &:last-child {
    border-bottom: none;
  }
`;

const SuggestionContent = styled.div`
  flex: 1;
`;

const DocsLink = styled.a`
  color: hsl(var(--primary));
  font-size: 0.875em;
  text-decoration: none;
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 4px;

  &:hover {
    background-color: hsl(var(--primary) / 0.1);
  }
`;

const SuggestionLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;

  span {
    font-weight: 500;
    color: hsl(var(--foreground));
  }
`;

const SuggestionCategory = styled.span`
  font-size: 0.875em;
  color: hsl(var(--foreground) / 0.6);
  background: hsl(var(--background) / 0.8);
  padding: 2px 8px;
  border-radius: 4px;
`;

const CategoryLink = styled.a`
  color: hsl(var(--primary));
  text-decoration: underline;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 0.875em;
  padding: 2px 8px;
  border-radius: 4px;
`;

const SuggestionDescription = styled.div`
  font-size: 0.875em;
  color: hsl(var(--foreground) / 0.7);
`;

const DefaultSuggestionItemComponent = ({ item }: { item: BaseEditorItem; isSelected: boolean; isHovered: boolean }) => (
  <SuggestionItemContent className="default-suggestion">
    <SuggestionItemLabel>{item.label}</SuggestionItemLabel>
    {item.description && <SuggestionItemDescription>{item.description}</SuggestionItemDescription>}
    {item.category && <SuggestionItemCategory>{item.category}</SuggestionItemCategory>}
  </SuggestionItemContent>
);

const EnhancedSuggestionItemComponent = ({
  item,
  isSelected,
  classNames,
}: {
  item: BaseEditorItem;
  isSelected: boolean;
  isHovered: boolean;
  classNames?: {
    category?: string;
    description?: string;
  };
}) => {
  // Create a handler to stop propagation for links
  const handleLinkClick = (e: React.MouseEvent, url?: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Log for debugging
    console.log("Link clicked:", url);

    if (url) {
      try {
        // Force open in new tab without relying on window.open
        const newTab = window.open("about:blank", "_blank");
        if (newTab) {
          newTab.location.href = url;
          // Focus the new tab
          newTab.focus();
        } else {
          // Fallback if popup is blocked
          console.log("New tab blocked, creating link and clicking it");
          const a = document.createElement("a");
          a.href = url;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.style.display = "none";
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
          }, 100);
        }
      } catch (error) {
        console.error("Error opening link:", error);
        // Last resort fallback
        window.open(url, "_blank");
      }

      // Prevent the dropdown from closing by stopping event propagation
      e.preventDefault();
      e.stopPropagation();

      // Return focus to editor after a short delay
      setTimeout(() => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }, 100);
    }
  };

  return (
    <EnhancedItem className={`enhanced-suggestion-item ${isSelected ? "selected" : ""}`}>
      <SuggestionContent>
        <SuggestionLabel>
          <span>{item.label}</span>
          {item.category &&
            (item.link ? (
              <CategoryLink
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e: React.MouseEvent) => handleLinkClick(e, item.link)}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                className={classNames?.category}
              >
                {item.category}
              </CategoryLink>
            ) : (
              <SuggestionCategory className={classNames?.category}>{item.category}</SuggestionCategory>
            ))}
        </SuggestionLabel>
        {item.description && <SuggestionDescription className={classNames?.description}>{item.description}</SuggestionDescription>}
      </SuggestionContent>
      {item.docs && (
        <DocsLink
          href={item.docs}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e: React.MouseEvent) => handleLinkClick(e, item.docs)}
          onMouseDown={(e: React.MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          Docs
        </DocsLink>
      )}
    </EnhancedItem>
  );
};

/**
 * Enhanced Suggestions component with integrated suggestion management
 */
export const Suggestions: React.FC<SuggestionsProps> = ({ quillInstance, suggestions, trigger = "{{", closingChar = "}}", renderItem, classNames, maxHeight = 300, minWidth = 200, maxWidth = 400 }) => {
  // State for suggestions dropdown
  const [state, setState] = useState({
    isOpen: false,
    items: suggestions,
    filteredItems: suggestions,
    query: "",
    selectedIndex: 0,
    triggerPosition: { top: 0, left: 0 },
  });

  // Refs for tracking positions and selection
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLDivElement>(null);
  const triggerPositionRef = useRef<number | null>(null);
  const selectedIndexRef = useRef<number>(0);
  const lastUsedIndexRef = useRef<number>(0);
  const prevQueryRef = useRef<string>("");
  const prevIsOpenRef = useRef<boolean>(false);

  // State for tracking hover in the dropdown
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const previousSelectedIndex = useRef<number>(-1);
  const isFirstRender = useRef<boolean>(true);

  // Function to check for trigger characters in the text
  const checkForTrigger = useCallback(() => {
    if (!quillInstance) return;

    const selection = quillInstance.getSelection();
    if (!selection) return;

    const cursorPosition = selection.index;
    const text = quillInstance.getText();

    // Check if we just typed the trigger character
    const beforeCursor = text.slice(Math.max(0, cursorPosition - trigger.length), cursorPosition);

    if (beforeCursor === trigger) {
      const bounds = quillInstance.getBounds(cursorPosition);
      if (!bounds) return false;

      // Get the editor's position
      const editorRect = quillInstance.root.getBoundingClientRect();

      // Store trigger position for later use
      triggerPositionRef.current = cursorPosition - trigger.length;

      // Use the last used index instead of resetting to 0
      const indexToUse = lastUsedIndexRef.current;
      selectedIndexRef.current = indexToUse;

      // Guard: Only update if not already open with empty query
      if (!prevIsOpenRef.current || prevQueryRef.current !== "") {
        setState((prev) => ({
          ...prev,
          isOpen: true,
          query: "",
          filteredItems: suggestions,
          selectedIndex: indexToUse, // Use stored index instead of 0
          triggerPosition: {
            top: editorRect.top + bounds.top + bounds.height + 5, // Add 5px padding
            left: editorRect.left + bounds.left,
          },
        }));
      }

      return true;
    }

    // Check if we're inside an existing template that's being typed
    const textBeforeCursor = text.slice(0, cursorPosition);
    const lastTriggerPos = textBeforeCursor.lastIndexOf(trigger);

    if (lastTriggerPos >= 0) {
      const hasClosing = text.indexOf(closingChar, lastTriggerPos) > -1;
      if (!hasClosing || text.indexOf(closingChar, lastTriggerPos) > cursorPosition) {
        const query = text.slice(lastTriggerPos + trigger.length, cursorPosition);

        // Guard: If the query hasn't changed and dropdown is already open, don't update state
        if (query === prevQueryRef.current && prevIsOpenRef.current) {
          return true;
        }

        const bounds = quillInstance.getBounds(lastTriggerPos);
        if (!bounds) return false;

        // Get the editor's position
        const editorRect = quillInstance.root.getBoundingClientRect();

        // Store trigger position for later use
        triggerPositionRef.current = lastTriggerPos;

        const filteredItems = suggestions.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()) || item.value.toLowerCase().includes(query.toLowerCase()));

        // When filtering changes we do reset the index for better UX
        const indexToUse = 0;
        selectedIndexRef.current = indexToUse;

        setState((prev) => ({
          ...prev,
          isOpen: true,
          query,
          filteredItems,
          selectedIndex: indexToUse,
          triggerPosition: {
            top: editorRect.top + bounds.top + bounds.height + 5, // Add 5px padding
            left: editorRect.left + bounds.left,
          },
        }));

        return true;
      }
    }

    // Don't close if it's already closed (guard against unnecessary updates)
    if (!prevIsOpenRef.current) {
      return false;
    }

    setState((prev) => ({ ...prev, isOpen: false }));
    triggerPositionRef.current = null;
    return false;
  }, [quillInstance, suggestions, trigger, closingChar]);

  // Insert text at the trigger position
  const insertAtTrigger = useCallback(
    (content: string, triggerPos: number) => {
      if (!quillInstance) return;

      try {
        // Focus the editor first to ensure it's ready to receive changes
        quillInstance.focus();

        // Small delay to ensure focus has taken effect
        setTimeout(() => {
          try {
            // Get current selection to calculate what to delete
            let selection = quillInstance.getSelection();
            if (!selection) {
              // If no selection, set one at the trigger position
              quillInstance.setSelection(triggerPos, 0);

              // Short delay to ensure selection is set
              setTimeout(() => {
                try {
                  // Try getting selection again
                  selection = quillInstance.getSelection();

                  // If still null, use a default
                  if (!selection) {
                    // Create a safe default
                    selection = { index: triggerPos, length: 0 };
                  }

                  // Calculate delete length (from trigger to cursor)
                  const deleteLength = selection.index - triggerPos + selection.length;
                  if (deleteLength > 0) {
                    quillInstance.deleteText(triggerPos, deleteLength);
                  }

                  // Insert the new content
                  quillInstance.insertText(triggerPos, content);

                  // Move cursor after the inserted content
                  quillInstance.setSelection(triggerPos + content.length, 0);
                } catch (error) {
                  console.error("Error in delayed insertion:", error);
                }
              }, 10);
            } else {
              // We have a selection, proceed normally
              const deleteLength = selection.index - triggerPos + selection.length;
              if (deleteLength > 0) {
                quillInstance.deleteText(triggerPos, deleteLength);
              }

              // Insert the new content
              quillInstance.insertText(triggerPos, content);

              // Move cursor after the inserted content
              quillInstance.setSelection(triggerPos + content.length, 0);
            }
          } catch (error) {
            console.error("Error inserting content:", error);
          }
        }, 10);
      } catch (error) {
        console.error("Error in insertAtTrigger:", error);
      }
    },
    [quillInstance]
  );

  // Insert the selected suggestion
  const insertSuggestion = useCallback(
    (item: BaseEditorItem) => {
      if (!quillInstance || triggerPositionRef.current === null) return;

      // Save the current index before closing
      const currentIndex = selectedIndexRef.current;
      lastUsedIndexRef.current = currentIndex;

      // First make sure we close the dropdown
      setState((prev) => ({ ...prev, isOpen: false }));

      // Wait a moment for the UI to update
      setTimeout(() => {
        try {
          // Focus editor first
          quillInstance.focus();

          // Create the full template text
          const templateText = `${trigger}${item.value}${closingChar}`;

          // Insert at the stored trigger position
          insertAtTrigger(templateText, triggerPositionRef.current as number);

          // Reset the trigger position
          triggerPositionRef.current = null;
        } catch (error) {
          console.error("Error inserting suggestion:", error);
        }
      }, 0);
    },
    [quillInstance, trigger, closingChar, insertAtTrigger]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!state.isOpen) return;

      console.log(`Key pressed: ${e.key}, current index: ${selectedIndexRef.current}, items: ${state.filteredItems.length}`);

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          e.stopPropagation();
          {
            // Calculate new index using the ref for current value
            const nextDownIndex = Math.min(selectedIndexRef.current + 1, state.filteredItems.length - 1);
            console.log(`🔽 ArrowDown: ${selectedIndexRef.current} → ${nextDownIndex}`);

            // Update both the ref and the state
            selectedIndexRef.current = nextDownIndex;
            lastUsedIndexRef.current = nextDownIndex;
            setState((prev) => ({
              ...prev,
              selectedIndex: nextDownIndex,
            }));
          }
          break;

        case "ArrowUp":
          e.preventDefault();
          e.stopPropagation();
          {
            // Calculate new index using the ref for current value
            const nextUpIndex = Math.max(selectedIndexRef.current - 1, 0);
            console.log(`🔼 ArrowUp: ${selectedIndexRef.current} → ${nextUpIndex}`);

            // Update both the ref and the state
            selectedIndexRef.current = nextUpIndex;
            lastUsedIndexRef.current = nextUpIndex;
            setState((prev) => ({
              ...prev,
              selectedIndex: nextUpIndex,
            }));
          }
          break;

        case "Enter":
        case "Tab":
          e.preventDefault();
          e.stopPropagation();
          {
            // Use the ref to ensure we have the latest index
            const currentIndex = selectedIndexRef.current;
            lastUsedIndexRef.current = currentIndex;

            if (state.filteredItems[currentIndex]) {
              console.log(`Inserting: ${state.filteredItems[currentIndex].label}`);
              insertSuggestion(state.filteredItems[currentIndex]);
            } else {
              console.error(`No item at index ${currentIndex}`);
            }
          }
          break;

        case "Escape":
          e.preventDefault();
          e.stopPropagation();
          setState((prev) => ({ ...prev, isOpen: false }));
          break;
      }
    },
    [state.isOpen, state.filteredItems, insertSuggestion]
  );

  // Keep selectedIndexRef in sync with state
  useEffect(() => {
    selectedIndexRef.current = state.selectedIndex;
    // Also update lastUsedIndexRef when the dropdown is open
    if (state.isOpen) {
      lastUsedIndexRef.current = state.selectedIndex;
    }

    // Update previous state refs
    prevQueryRef.current = state.query;
    prevIsOpenRef.current = state.isOpen;
  }, [state.selectedIndex, state.isOpen, state.query]);

  // Add keyboard event listeners when dropdown is open
  useEffect(() => {
    if (!state.isOpen) return;

    console.log(`🎹 Keyboard navigation attached, selectedIndex: ${state.selectedIndex}, lastUsedIndex: ${lastUsedIndexRef.current}`);

    // Add event listener with capture to ensure we get the event first
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      console.log("🎹 Keyboard navigation detached");
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [state.isOpen, handleKeyDown]);

  // Setup Quill text-change handler
  useEffect(() => {
    if (!quillInstance) return;

    const handleTextChange = () => {
      checkForTrigger();
    };

    quillInstance.on("text-change", handleTextChange);
    quillInstance.on("selection-change", handleTextChange);

    return () => {
      quillInstance.off("text-change", handleTextChange);
      quillInstance.off("selection-change", handleTextChange);
    };
  }, [quillInstance, checkForTrigger]);

  // Handle editor blur
  const handleEditorBlur = useCallback((event: FocusEvent) => {
    // Check if the related target is part of the suggestions dropdown
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (relatedTarget?.closest(".suggestions-dropdown")) {
      return;
    }

    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Setup editor blur handler
  useEffect(() => {
    if (!quillInstance) return;

    quillInstance.root.addEventListener("blur", handleEditorBlur);

    return () => {
      quillInstance.root.removeEventListener("blur", handleEditorBlur);
    };
  }, [quillInstance, handleEditorBlur]);

  // Document click handler
  const handleDocumentClick = useCallback((e: MouseEvent) => {
    // Check if the click was on a link
    const target = e.target as HTMLElement;

    // Don't close the dropdown if clicking on a link or link container
    if (target.tagName === "A" || target.closest("a")) {
      console.log("Click on link detected, keeping dropdown open");
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Check if clicking inside the suggestions dropdown
    if (target.closest(".suggestions-dropdown")) {
      console.log("Click inside dropdown detected, keeping open");
      return;
    }

    // For any other click, close the dropdown
    console.log("Outside click detected, closing dropdown");
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Add document click listener
  useEffect(() => {
    if (!state.isOpen) return;

    document.addEventListener("mousedown", handleDocumentClick);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, [state.isOpen, handleDocumentClick]);

  // Handle viewport positioning
  useEffect(() => {
    if (!state.isOpen || !dropdownRef.current) return;

    try {
      // Adjust position to ensure dropdown is visible
      const dropdown = dropdownRef.current;
      const rect = dropdown.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      // Check if dropdown would go below viewport
      if (state.triggerPosition.top + rect.height > viewportHeight) {
        dropdown.style.top = `${state.triggerPosition.top - rect.height}px`;
      } else {
        dropdown.style.top = `${state.triggerPosition.top + window.scrollY}px`;
      }

      // Check if dropdown would go beyond right edge
      if (state.triggerPosition.left + rect.width > viewportWidth) {
        dropdown.style.left = `${viewportWidth - rect.width - 10}px`;
      } else {
        dropdown.style.left = `${state.triggerPosition.left}px`;
      }
    } catch (error) {
      console.error("Error positioning dropdown:", error);
    }
  }, [state.isOpen, state.triggerPosition]);

  // Scroll to selected item whenever dropdown opens or selectedIndex changes
  useEffect(() => {
    if (!state.isOpen || !selectedItemRef.current) return;

    // On first render when dropdown opens, always scroll
    if (isFirstRender.current && state.isOpen) {
      isFirstRender.current = false;
      try {
        console.log(`📌 Initial scroll to item ${state.selectedIndex} of ${state.filteredItems.length}`);
        selectedItemRef.current.scrollIntoView({
          block: "nearest",
        });
      } catch (error) {
        console.error("Error during initial scroll:", error);
      }
      previousSelectedIndex.current = state.selectedIndex;
      return;
    }

    // On subsequent renders, only scroll when selectedIndex changes
    if (previousSelectedIndex.current !== state.selectedIndex) {
      try {
        selectedItemRef.current.scrollIntoView({
          block: "nearest",
        });
      } catch (error) {
        console.error("Error scrolling to selection:", error);
      }

      previousSelectedIndex.current = state.selectedIndex;
    }
  }, [state.isOpen, state.selectedIndex, state.filteredItems.length]);

  // Reset first render flag when dropdown closes
  useEffect(() => {
    if (!state.isOpen) {
      isFirstRender.current = true;
    }
  }, [state.isOpen]);

  // Reset hovered index when dropdown opens/closes or selection changes
  useEffect(() => {
    setHoveredIndex(null);
  }, [state.isOpen, state.selectedIndex, state.filteredItems]);

  // Handle mouse enter for hover effect
  const handleItemMouseEnter = useCallback((index: number) => {
    setHoveredIndex(index);
  }, []);

  // Handle mouse leave for hover effect
  const handleItemMouseLeave = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  // Safe way to handle item selection
  const handleItemSelect = useCallback(
    (item: BaseEditorItem) => {
      try {
        // Create a promise to handle the selection
        setTimeout(() => {
          insertSuggestion(item);
        }, 10);
      } catch (error) {
        console.error("Error selecting item:", error);
      }
    },
    [insertSuggestion]
  );

  // Safer mousedown handler
  const handleItemMouseDown = useCallback(
    (e: React.MouseEvent, item: BaseEditorItem) => {
      try {
        // Prevent default behavior and stop event propagation
        e.preventDefault();
        e.stopPropagation();

        // Check if the click came from a link element
        const target = e.target as HTMLElement;
        if (target.tagName === "A" || target.closest("a")) {
          // If it's a link, don't select the item
          return;
        }

        // Defer selection to prevent focus issues
        handleItemSelect(item);
      } catch (error) {
        console.error("Error in mouseDown handler:", error);
      }
    },
    [handleItemSelect]
  );

  // Prevent container events from propagating
  const handleContainerMouseDown = useCallback((e: React.MouseEvent) => {
    // Check if the click was on a link
    const target = e.target as HTMLElement;
    if (target.tagName === "A" || target.closest("a")) {
      // Let the link's own handler handle it
      return;
    }

    // Otherwise prevent default for container clicks
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Don't render anything if not open or if no items
  if (!state.isOpen || !state.filteredItems || state.filteredItems.length === 0) {
    return null;
  }

  return (
    <SuggestionsDropdown
      ref={dropdownRef}
      className={`suggestions-dropdown ${classNames?.suggestions || ""}`}
      style={{
        top: state.triggerPosition.top + window.scrollY,
        left: state.triggerPosition.left,
        maxHeight,
        minWidth,
        maxWidth,
      }}
      onMouseDown={handleContainerMouseDown}
      data-testid="suggestions-dropdown"
    >
      {state.filteredItems.map((item, index) => {
        const isSelected = index === state.selectedIndex;
        const isHovered = index === hoveredIndex;
        const hasCustomRenderer = !!renderItem;

        // Choose the appropriate styled component based on whether we have a custom renderer
        const ItemComponent = hasCustomRenderer ? CustomSuggestionItem : DefaultSuggestionItem;

        // Class names for the item
        const itemClassNames = `
          ${isSelected ? "selected" : ""} 
          ${classNames?.suggestion || ""} 
          ${isSelected ? classNames?.suggestionSelected || "" : ""} 
          ${isHovered ? classNames?.suggestionHovered || "" : ""}
        `;

        return (
          <ItemComponent
            key={item.id || `suggestion-${index}`}
            ref={isSelected ? selectedItemRef : null}
            onMouseDown={(e: React.MouseEvent) => handleItemMouseDown(e, item)}
            onMouseEnter={() => handleItemMouseEnter(index)}
            onMouseLeave={handleItemMouseLeave}
            className={itemClassNames}
            data-index={index}
          >
            {renderItem ? (
              renderItem(item, isSelected, isHovered)
            ) : item.docs || item.link ? (
              <EnhancedSuggestionItemComponent
                item={item}
                isSelected={isSelected}
                isHovered={isHovered}
                classNames={{
                  category: classNames?.category,
                  description: classNames?.description,
                }}
              />
            ) : (
              <DefaultSuggestionItemComponent item={item} isSelected={isSelected} isHovered={isHovered} />
            )}
          </ItemComponent>
        );
      })}
    </SuggestionsDropdown>
  );
};

export default Suggestions;
