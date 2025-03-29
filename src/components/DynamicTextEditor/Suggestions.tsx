import React, { useEffect, useRef, useCallback, useState } from "react";
import { BaseEditorItem } from "./types";
import "./styles/suggestions.css";

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

const DefaultSuggestionItem = ({ item, isSelected, isHovered }: { item: BaseEditorItem; isSelected: boolean; isHovered: boolean }) => (
  <div className="suggestion-item-content default-suggestion">
    <div className="suggestion-item-label">{item.label}</div>
    {item.description && <div className="suggestion-item-description">{item.description}</div>}
    {item.category && <div className="suggestion-item-category">{item.category}</div>}
  </div>
);

const EnhancedSuggestionItem = ({
  item,
  isSelected,
  isHovered,
  classNames,
}: {
  item: BaseEditorItem;
  isSelected: boolean;
  isHovered: boolean;
  classNames?: {
    category?: string;
    description?: string;
  };
}) => (
  <div className="enhanced-suggestion-item">
    <div className="suggestion-content">
      <div className="suggestion-label">
        <span>{item.label}</span>
        {item.category &&
          (item.link ? (
            <a href={item.link} className="category-link" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
              {item.category}
            </a>
          ) : (
            <span className={`suggestion-category ${classNames?.category || ""}`}>{item.category}</span>
          ))}
      </div>
      {item.description && <div className={`suggestion-description ${classNames?.description || ""}`}>{item.description}</div>}
    </div>
    {item.docs && (
      <a href={item.docs} className="docs-link" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
        Docs
      </a>
    )}
  </div>
);

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
    e.preventDefault();
    e.stopPropagation();
  }, []);

  if (!isOpen || !items || items.length === 0) {
    return null;
  }

  // CSS for the dropdown container
  const dropdownStyle: React.CSSProperties = {
    position: "fixed",
    top: position.top + window.scrollY,
    left: position.left,
    zIndex: 9999,
    maxHeight,
    minWidth,
    maxWidth,
    overflowY: "auto", // Enable vertical scrolling
    overflowX: "hidden", // Prevent horizontal scrolling
  };

  return (
    <div ref={dropdownRef} className={`suggestions-dropdown ${classNames?.suggestions || ""}`} style={dropdownStyle} onMouseDown={handleContainerMouseDown} data-testid="suggestions-dropdown">
      {items.map((item, index) => {
        const isSelected = index === selectedIndex;
        const isHovered = index === hoveredIndex;
        const hasCustomRenderer = !!renderItem;

        // Class names for the item - apply different classes based on whether this uses a custom renderer
        const itemClassNames = `
                    suggestion-item 
                    ${!hasCustomRenderer ? "default-suggestion-item" : "custom-suggestion-item"}
                    ${isSelected ? "selected" : ""} 
                    ${classNames?.suggestion || ""} 
                    ${isSelected ? classNames?.suggestionSelected || "" : ""} 
                    ${isHovered ? classNames?.suggestionHovered || "" : ""}
                `;

        return (
          <div
            key={item.id || `suggestion-${index}`}
            ref={isSelected ? selectedItemRef : null}
            onMouseDown={(e) => handleItemMouseDown(e, item)}
            onMouseEnter={() => handleItemMouseEnter(index)}
            onMouseLeave={handleItemMouseLeave}
            className={itemClassNames}
            data-index={index}
            style={hasCustomRenderer && isSelected ? { backgroundColor: "rgba(0, 120, 212, 0.08)" } : undefined}
          >
            {renderItem ? (
              renderItem(item, isSelected, isHovered)
            ) : item.docs || item.link ? (
              <EnhancedSuggestionItem
                item={item}
                isSelected={isSelected}
                isHovered={isHovered}
                classNames={{
                  category: classNames?.category,
                  description: classNames?.description,
                }}
              />
            ) : (
              <DefaultSuggestionItem item={item} isSelected={isSelected} isHovered={isHovered} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Suggestions;
