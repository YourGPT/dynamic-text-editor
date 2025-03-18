import { useEffect, useRef, useState, useCallback } from 'react';
import { DynamicTextEditorProps, BaseEditorItem } from '../types';
import { useSuggestions } from './useSuggestions';
import usePaint from './usePaint';
import useQuill from './useQuill';
import Quill from 'quill';
import useMarkdownShortcuts from './useMarkdownShortcuts';

import { ToolbarConfig } from '../types';

type useDynamicTextEditorProps = {
    theme?: 'snow' | 'bubble';
    placeholder?: string;
    classNames?: object;
    value?: string;
    defaultValue?: string;
    readOnly?: boolean;
    fontSize?: string;
    lineHeight?: string;
    width?: string;
    height?: string;
    toolbar?: boolean | ToolbarConfig;
    formats?: string[];
    onChange?: (content: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    suggestions: BaseEditorItem[];
    suggestionTrigger?: string;
    suggestionClosing?: string;
};

type useDynamicTextEditorReturn = {
    quillRef: React.RefObject<HTMLDivElement>;
    quillInstance: Quill | null;
    editorState: string;
    setEditorState: (content: string) => void;
    clearContent: () => void;
    focus: () => void;
    blur: () => void;
    suggestionState: SuggestionState;
    insertSuggestion: (item: BaseEditorItem) => void;
    processMarkdown: (text: string) => void;
};

interface SuggestionState {
    isOpen: boolean;
    items: BaseEditorItem[];
    filteredItems: BaseEditorItem[];
    selectedIndex: number;
    triggerPosition: { top: number; left: number };
}

const defaultToolbarOptions: ToolbarConfig = [
    ['bold', 'italic', 'underline'],
    ['blockquote', 'code-block'],
    [{ 'header': [1, 2] }],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'align': [] }],
    ['clean']
];

export const useDynamicTextEditor = ({
    theme = 'snow',
    placeholder = 'Write something...',
    value,
    defaultValue = '',
    readOnly = false,
    fontSize = '1rem',
    lineHeight = '1.5',
    width = '100%',
    height = 'auto',
    toolbar = true,
    formats = ['bold', 'italic', 'underline', 'blockquote', 'code-block', 'header', 'list', 'align'],
    onChange,
    onFocus,
    onBlur,
    suggestions,
    suggestionTrigger = '{{',
    suggestionClosing = '}}'
}: DynamicTextEditorProps): useDynamicTextEditorReturn => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [editorState, setEditorState] = useState<string>(defaultValue);
    const prevToolbarRef = useRef(toolbar);

    // Add a flag to track if we're manually modifying text
    const isModifyingText = useRef<boolean>(false);

    // Handle text change events
    const handleTextChange = useCallback((html: string, delta: any, source: string) => {
        // Update our local state
        setEditorState(html);

        // Skip onChange if we're currently modifying text programmatically to avoid recursion
        if (isModifyingText.current) return;

        // Call the onChange callback with the HTML content
        if (onChange) {
            onChange(html);
        }
    }, [onChange]);

    // Initialize Quill using our useQuill hook
    const {
        quill: quillInstance,
        setContent,
        clearContent,
        reinitialize
    } = useQuill({
        container: containerRef,
        theme,
        placeholder,
        readOnly,
        formats: [...formats, 'template-variable'],
        toolbar: toolbar === true ? defaultToolbarOptions : toolbar,
        defaultValue: value || defaultValue,
        onTextChange: handleTextChange
    });

    // Use the suggestions hook
    const {
        suggestionState,
        insertSuggestion: insertSuggestionFromHook
    } = useSuggestions({
        quillInstance,
        suggestions,
        trigger: suggestionTrigger,
        closingChar: suggestionClosing
    });

    // Use the template highlighting hook
    const { highlightTemplates } = usePaint({
        quillInstance,
        trigger: suggestionTrigger,
        closingChar: suggestionClosing
    });

    // Initialize Markdown shortcuts with our modification tracking flag
    const { processMarkdown } = useMarkdownShortcuts(quillInstance, isModifyingText);

    // Apply custom styles to Quill
    useEffect(() => {
        if (!quillInstance) return;

        quillInstance.root.style.fontSize = fontSize;
        quillInstance.root.style.lineHeight = lineHeight;
        quillInstance.root.style.width = width;
        quillInstance.root.style.height = height;
    }, [quillInstance, fontSize, lineHeight, width, height]);

    // Add event listeners for focus/blur
    useEffect(() => {
        if (!quillInstance) return;

        if (onFocus) {
            quillInstance.root.addEventListener('focus', onFocus);
        }

        if (onBlur) {
            quillInstance.root.addEventListener('blur', onBlur);
        }

        return () => {
            if (onFocus) {
                quillInstance.root.removeEventListener('focus', onFocus);
            }

            if (onBlur) {
                quillInstance.root.removeEventListener('blur', onBlur);
            }
        };
    }, [quillInstance, onFocus, onBlur]);

    // Handle toolbar changes
    useEffect(() => {
        if (!quillInstance) return;

        // Only reinitialize if toolbar actually changed
        const toolbarChanged = JSON.stringify(prevToolbarRef.current) !== JSON.stringify(toolbar);
        prevToolbarRef.current = toolbar;

        if (!toolbarChanged) return;

        // Store selection and focus state for restoration
        const wasFocused = document.activeElement === quillInstance.root;
        const selection = quillInstance.getSelection();
        const content = quillInstance.root.innerHTML;

        // Use our reinitialize method from useQuill
        reinitialize();

        // Use setTimeout to ensure the editor is fully reinitialized
        setTimeout(() => {
            if (!quillInstance) return;

            // Restore content
            setContent(content);

            // Restore focus and selection
            if (wasFocused) {
                quillInstance.focus();
                if (selection) {
                    quillInstance.setSelection(selection.index, selection.length);
                }
            }

            // Highlight templates
            highlightTemplates();
        }, 10);
    }, [toolbar, quillInstance, reinitialize, setContent, highlightTemplates]);

    // Handle value changes from props
    useEffect(() => {
        if (!quillInstance || value === undefined) return;

        const currentContent = quillInstance.root.innerHTML;
        if (value !== currentContent) {
            setContent(value);
            highlightTemplates();
        }
    }, [value, quillInstance, setContent, highlightTemplates]);

    // Add CSS for template formatting
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            .template-variable {
            background-color: #d0e8ff;
            color: #0050b3;
            border-radius: 4px;
            padding: 2px 4px;
            font-weight: 500;
            border: 1px solid #b7daff;
            }`;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    // Utility functions
    const focus = useCallback(() => {
        quillInstance?.focus();
    }, [quillInstance]);

    const blur = useCallback(() => {
        if (quillInstance) {
            (quillInstance.root as HTMLElement).blur();
        }
    }, [quillInstance]);

    // Modified wrapper for insertSuggestion
    const insertSuggestion = useCallback((item: BaseEditorItem) => {
        if (!quillInstance) return;

        try {
            // Set flag to indicate we're manually modifying text
            isModifyingText.current = true;

            // First focus the editor
            quillInstance.focus();

            // Use a small delay to ensure focus has taken effect
            setTimeout(() => {
                try {
                    // Insert the suggestion
                    insertSuggestionFromHook(item);

                    // Apply highlighting after insertion with another delay
                    // to ensure the content is fully updated
                    setTimeout(() => {
                        try {
                            // Apply any necessary highlighting
                            highlightTemplates();

                            // Wait a bit more before allowing Markdown processing again
                            // This ensures all DOM operations are complete
                            setTimeout(() => {
                                // Reset the modification flag when completely done
                                isModifyingText.current = false;
                            }, 50);
                        } catch (error) {
                            console.error("Error in final suggestion processing:", error);
                            isModifyingText.current = false;
                        }
                    }, 30);
                } catch (error) {
                    console.error("Error inserting suggestion:", error);
                    isModifyingText.current = false;
                }
            }, 10);
        } catch (error) {
            console.error("Error in insertSuggestion:", error);
            isModifyingText.current = false;
        }
    }, [insertSuggestionFromHook, highlightTemplates, quillInstance]);

    return {
        quillRef: containerRef,
        quillInstance,
        editorState,
        setEditorState: (content: string) => {
            setContent(content);
            highlightTemplates();
        },
        clearContent: () => {
            clearContent();
            highlightTemplates();
        },
        focus,
        blur,
        suggestionState,
        insertSuggestion,
        processMarkdown
    };
};

export type { useDynamicTextEditorProps, useDynamicTextEditorReturn };
export default useDynamicTextEditor;