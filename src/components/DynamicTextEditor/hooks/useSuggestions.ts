import { useState, useCallback, useEffect, useRef } from 'react';
import Quill from 'quill';
import { BaseEditorItem } from '../types';
import useRegex from './useRegex';

interface SuggestionState {
    isOpen: boolean;
    items: BaseEditorItem[];
    filteredItems: BaseEditorItem[];
    query: string;
    selectedIndex: number;
    triggerPosition: { top: number; left: number };
}

interface UseSuggestionsOptions {
    quillInstance: Quill | null;
    suggestions: BaseEditorItem[];
    trigger: string;
    closingChar?: string;
}

export const useSuggestions = ({
    quillInstance,
    suggestions,
    trigger = '{{',
    closingChar = '}}'
}: UseSuggestionsOptions) => {
    const [state, setState] = useState<SuggestionState>({
        isOpen: false,
        items: suggestions,
        filteredItems: suggestions,
        query: '',
        selectedIndex: 0,
        triggerPosition: { top: 0, left: 0 }
    });

    // Create a ref for trigger position tracking
    const triggerPositionRef = useRef<number | null>(null);

    // Create a ref to track the current selectedIndex to prevent state closure issues
    const selectedIndexRef = useRef<number>(0);

    // Keep track of the last used index to preserve between dropdown openings
    const lastUsedIndexRef = useRef<number>(0);

    // Create regex for matching {{template}}
    const templateRegex = useRegex(
        new RegExp(`${trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^${closingChar}]*)${closingChar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g')
    );

    // Keep selectedIndexRef in sync with state
    useEffect(() => {
        selectedIndexRef.current = state.selectedIndex;
        // Also update lastUsedIndexRef when the dropdown is open
        if (state.isOpen) {
            lastUsedIndexRef.current = state.selectedIndex;
        }
    }, [state.selectedIndex, state.isOpen]);

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

            setState(prev => ({
                ...prev,
                isOpen: true,
                query: '',
                filteredItems: suggestions,
                selectedIndex: indexToUse, // Use stored index instead of 0
                triggerPosition: {
                    top: editorRect.top + bounds.top + bounds.height + 5, // Add 5px padding
                    left: editorRect.left + bounds.left
                }
            }));

            return true;
        }

        // Check if we're inside an existing template that's being typed
        const textBeforeCursor = text.slice(0, cursorPosition);
        const lastTriggerPos = textBeforeCursor.lastIndexOf(trigger);

        if (lastTriggerPos >= 0) {
            const hasClosing = text.indexOf(closingChar, lastTriggerPos) > -1;
            if (!hasClosing || text.indexOf(closingChar, lastTriggerPos) > cursorPosition) {
                const query = text.slice(lastTriggerPos + trigger.length, cursorPosition);
                const bounds = quillInstance.getBounds(lastTriggerPos);
                if (!bounds) return false;

                // Get the editor's position
                const editorRect = quillInstance.root.getBoundingClientRect();

                // Store trigger position for later use
                triggerPositionRef.current = lastTriggerPos;

                const filteredItems = suggestions.filter(
                    item =>
                        item.label.toLowerCase().includes(query.toLowerCase()) ||
                        item.value.toLowerCase().includes(query.toLowerCase())
                );

                // When filtering changes we do reset the index for better UX
                const indexToUse = 0;
                selectedIndexRef.current = indexToUse;

                setState(prev => ({
                    ...prev,
                    isOpen: true,
                    query,
                    filteredItems,
                    selectedIndex: indexToUse,
                    triggerPosition: {
                        top: editorRect.top + bounds.top + bounds.height + 5, // Add 5px padding
                        left: editorRect.left + bounds.left
                    }
                }));

                return true;
            }
        }

        setState(prev => ({ ...prev, isOpen: false }));
        triggerPositionRef.current = null;
        return false;
    }, [quillInstance, suggestions, trigger, closingChar]);

    // A separate function to safely insert text at the trigger position
    const insertAtTrigger = useCallback((content: string, triggerPos: number) => {
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
                                console.error('Error in delayed insertion:', error);
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
                    console.error('Error inserting content:', error);
                }
            }, 10);
        } catch (error) {
            console.error('Error in insertAtTrigger:', error);
        }
    }, [quillInstance]);

    const insertSuggestion = useCallback((item: BaseEditorItem) => {
        if (!quillInstance || triggerPositionRef.current === null) return;

        // Save the current index before closing
        const currentIndex = selectedIndexRef.current;
        lastUsedIndexRef.current = currentIndex;

        // First make sure we close the dropdown
        setState(prev => ({ ...prev, isOpen: false }));

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
                console.error('Error inserting suggestion:', error);
            }
        }, 0);
    }, [quillInstance, trigger, closingChar, insertAtTrigger]);

    // Simplified handleKeyDown function with direct state updates to ensure they persist
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!state.isOpen) return;

        console.log(`Key pressed: ${e.key}, current index: ${selectedIndexRef.current}, items: ${state.filteredItems.length}`);

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                e.stopPropagation();

                // Calculate new index using the ref for current value
                const nextDownIndex = Math.min(selectedIndexRef.current + 1, state.filteredItems.length - 1);
                console.log(`🔽 ArrowDown: ${selectedIndexRef.current} → ${nextDownIndex}`);

                // Update both the ref and the state
                selectedIndexRef.current = nextDownIndex;
                lastUsedIndexRef.current = nextDownIndex;
                setState(prev => ({
                    ...prev,
                    selectedIndex: nextDownIndex
                }));
                break;

            case 'ArrowUp':
                e.preventDefault();
                e.stopPropagation();

                // Calculate new index using the ref for current value
                const nextUpIndex = Math.max(selectedIndexRef.current - 1, 0);
                console.log(`🔼 ArrowUp: ${selectedIndexRef.current} → ${nextUpIndex}`);

                // Update both the ref and the state
                selectedIndexRef.current = nextUpIndex;
                lastUsedIndexRef.current = nextUpIndex;
                setState(prev => ({
                    ...prev,
                    selectedIndex: nextUpIndex
                }));
                break;

            case 'Enter':
            case 'Tab':
                e.preventDefault();
                e.stopPropagation();

                // Use the ref to ensure we have the latest index
                const currentIndex = selectedIndexRef.current;
                lastUsedIndexRef.current = currentIndex;

                if (state.filteredItems[currentIndex]) {
                    console.log(`Inserting: ${state.filteredItems[currentIndex].label}`);
                    insertSuggestion(state.filteredItems[currentIndex]);
                } else {
                    console.error(`No item at index ${currentIndex}`);
                }
                break;

            case 'Escape':
                e.preventDefault();
                e.stopPropagation();
                setState(prev => ({ ...prev, isOpen: false }));
                break;
        }
    }, [state.isOpen, state.filteredItems, insertSuggestion]);

    // Add console logs to useEffect for keydown listener
    useEffect(() => {
        if (!state.isOpen) return;

        console.log(`🎹 Keyboard navigation attached, selectedIndex: ${state.selectedIndex}, lastUsedIndex: ${lastUsedIndexRef.current}`);

        // Add event listener with capture to ensure we get the event first
        document.addEventListener('keydown', handleKeyDown, true);

        return () => {
            console.log('🎹 Keyboard navigation detached');
            document.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [state.isOpen, handleKeyDown]);

    // Setup Quill text-change handler
    useEffect(() => {
        if (!quillInstance) return;

        const handleTextChange = () => {
            checkForTrigger();
        };

        quillInstance.on('text-change', handleTextChange);
        quillInstance.on('selection-change', handleTextChange);

        return () => {
            quillInstance.off('text-change', handleTextChange);
            quillInstance.off('selection-change', handleTextChange);
        };
    }, [quillInstance, checkForTrigger]);

    // Highlight all template matches
    const highlightTemplates = useCallback(() => {
        if (!quillInstance) return;

        try {
            const text = quillInstance.getText();
            templateRegex.extractMatches(text);
        } catch (error) {
            console.error('Error highlighting templates:', error);
        }
    }, [quillInstance, templateRegex]);

    // Apply highlighting on editor content changes
    useEffect(() => {
        if (!quillInstance) return;

        const handleHighlight = () => {
            highlightTemplates();
        };

        quillInstance.on('text-change', handleHighlight);

        return () => {
            quillInstance.off('text-change', handleHighlight);
        };
    }, [quillInstance, highlightTemplates]);

    // Handle editor blur
    const handleEditorBlur = useCallback((event: FocusEvent) => {
        // Check if the related target is part of the suggestions dropdown
        const relatedTarget = event.relatedTarget as HTMLElement;
        if (relatedTarget?.closest('.suggestions-dropdown')) {
            return;
        }

        setState(prev => ({ ...prev, isOpen: false }));
    }, []);

    // Setup editor blur handler
    useEffect(() => {
        if (!quillInstance) return;

        quillInstance.root.addEventListener('blur', handleEditorBlur);

        return () => {
            quillInstance.root.removeEventListener('blur', handleEditorBlur);
        };
    }, [quillInstance, handleEditorBlur]);

    return {
        suggestionState: {
            ...state,
            filteredItems: state.filteredItems
        },
        checkForTrigger,
        insertSuggestion,
        closeSuggestions: () => setState(prev => ({ ...prev, isOpen: false }))
    };
};

export default useSuggestions;
