import React, { useEffect, useRef, useCallback, useState } from "react";
import { BaseEditorItem } from "./types";
import { styled, keyframes } from "styled-components";

interface SuggestionsProps {
  isOpen: boolean;
  items: BaseEditorItem[];
  position: { top: number; left: number };
  selectedIndex: number;
  onSelect: (item: BaseEditorItem) => void;
  renderItem?: (item: BaseEditorItem, isSelected: boolean, isHovered: boolean) => React.ReactNode;
  classNames?: {
    suggestions?: string;
    suggestion?: string;
    suggestionSelected?: string;
    suggestionHovered?: string;
    category?: string;
    description?: string;
  };
  maxHeight?: number;
  minWidth?: number;
  maxWidth?: number;
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
  overflow: hidden;
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

  /* &.selected {
    background-color: hsl(var(--primary) / 0.1);
  } */
  /* 
  &:hover {
    background-color: hsl(var(--primary) / 0.05);
  } */

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
                onClick={(e) => handleLinkClick(e, item.link)}
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
          onClick={(e) => handleLinkClick(e, item.docs)}
          onMouseDown={(e) => {
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

export const Suggestions: React.FC<SuggestionsProps> = ({ isOpen, items, position, selectedIndex, onSelect, renderItem, classNames, maxHeight = 300, minWidth = 200, maxWidth = 400 }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const previousSelectedIndex = useRef<number>(-1); // Start with -1 to ensure first render scrolls
  const isFirstRender = useRef<boolean>(true);

  // Handle viewport positioning
  useEffect(() => {
    if (!isOpen || !dropdownRef.current) return;

    try {
      // Adjust position to ensure dropdown is visible
      const dropdown = dropdownRef.current;
      const rect = dropdown.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      // Check if dropdown would go below viewport
      if (position.top + rect.height > viewportHeight) {
        dropdown.style.top = `${position.top - rect.height}px`;
      } else {
        dropdown.style.top = `${position.top + window.scrollY}px`;
      }

      // Check if dropdown would go beyond right edge
      if (position.left + rect.width > viewportWidth) {
        dropdown.style.left = `${viewportWidth - rect.width - 10}px`;
      } else {
        dropdown.style.left = `${position.left}px`;
      }
    } catch (error) {
      console.error("Error positioning dropdown:", error);
    }
  }, [isOpen, position]);

  // Scroll to selected item whenever dropdown opens or selectedIndex changes
  useEffect(() => {
    if (!isOpen || !selectedItemRef.current) return;

    // On first render when dropdown opens, always scroll
    if (isFirstRender.current && isOpen) {
      isFirstRender.current = false;
      try {
        console.log(`📌 Initial scroll to item ${selectedIndex} of ${items.length}`);
        selectedItemRef.current.scrollIntoView({
          block: "nearest",
        });
      } catch (error) {
        console.error("Error during initial scroll:", error);
      }
      previousSelectedIndex.current = selectedIndex;
      return;
    }

    // On subsequent renders, only scroll when selectedIndex changes
    if (previousSelectedIndex.current !== selectedIndex) {
      console.log(`📌 Scrolling to item ${selectedIndex} of ${items.length}`);

      try {
        selectedItemRef.current.scrollIntoView({
          block: "nearest",
        });
      } catch (error) {
        console.error("Error scrolling to selection:", error);
      }

      previousSelectedIndex.current = selectedIndex;
    }
  }, [isOpen, selectedIndex, items.length]);

  // Reset first render flag when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      isFirstRender.current = true;
    }
  }, [isOpen]);

  // Reset hovered index when dropdown opens/closes or selection changes
  useEffect(() => {
    setHoveredIndex(null);
  }, [isOpen, selectedIndex, items]);

  // Safe way to handle item selection
  const handleItemSelect = useCallback(
    (item: BaseEditorItem) => {
      try {
        // Create a promise to handle the selection
        setTimeout(() => {
          onSelect(item);
        }, 10);
      } catch (error) {
        console.error("Error selecting item:", error);
      }
    },
    [onSelect]
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

  // Handle mouse enter for hover effect
  const handleItemMouseEnter = useCallback((index: number) => {
    setHoveredIndex(index);
  }, []);

  // Handle mouse leave for hover effect
  const handleItemMouseLeave = useCallback(() => {
    setHoveredIndex(null);
  }, []);

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

  if (!isOpen || !items || items.length === 0) {
    return null;
  }

  return (
    <SuggestionsDropdown
      ref={dropdownRef}
      className={classNames?.suggestions}
      style={{
        top: position.top + window.scrollY,
        left: position.left,
        maxHeight,
        minWidth,
        maxWidth,
      }}
      onMouseDown={handleContainerMouseDown}
      data-testid="suggestions-dropdown"
    >
      {items.map((item, index) => {
        const isSelected = index === selectedIndex;
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
            onMouseDown={(e) => handleItemMouseDown(e, item)}
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
