import { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import 'quill/dist/quill.bubble.css';

type ToolbarConfig = Array<
    | string[]
    | { [key: string]: any }[]
>;

type useDynamicTextEditorProps = {
    theme?: 'snow' | 'bubble';
    placeholder?: string;
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
};

type useDynamicTextEditorReturn = {
    quillRef: React.RefObject<HTMLDivElement>;
    quillInstance: Quill | null;
    editorState: string;
    setEditorState: (content: string) => void;
    clearContent: () => void;
    focus: () => void;
    blur: () => void;
};

const defaultToolbarOptions = [
    ['bold', 'italic', 'underline'],
    ['blockquote', 'code-block'],
    [{ 'header': 1 }, { 'header': 2 }],
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
    formats = [],
    onChange,
    onFocus,
    onBlur
}: useDynamicTextEditorProps = {}): useDynamicTextEditorReturn => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [quillInstance, setQuillInstance] = useState<Quill | null>(null);
    const [editorState, setEditorState] = useState<string>(defaultValue);

    // Initialize Quill
    useEffect(() => {
        if (!containerRef.current || quillInstance) return;

        // Clear any existing content and create editor container
        containerRef.current.innerHTML = '<div class="editor-content"></div>';
        const editorElement = containerRef.current.querySelector('.editor-content');

        // Create Quill instance
        const quill = new Quill(editorElement as Element, {
            theme,
            placeholder,
            readOnly,
            modules: {
                ...(toolbar !== false && {
                    toolbar: toolbar === true ? defaultToolbarOptions : toolbar
                }),
                history: {
                    userOnly: true
                }
            },
            formats: formats.length > 0 ? formats : undefined
        });

        // Apply styles
        quill.root.style.fontSize = fontSize;
        quill.root.style.lineHeight = lineHeight;
        quill.root.style.width = width;
        quill.root.style.height = height;

        // Set initial content
        if (value !== undefined) {
            quill.clipboard.dangerouslyPasteHTML(value);
        } else if (defaultValue) {
            quill.clipboard.dangerouslyPasteHTML(defaultValue);
        }

        // Save instance
        setQuillInstance(quill);

        // Listen for content changes
        const handleTextChange = () => {
            setEditorState(quill.root.innerHTML);
            onChange?.(quill.root.innerHTML);
        };

        quill.on('text-change', handleTextChange);

        // Handle focus/blur
        const handleFocus = () => onFocus?.();
        const handleBlur = () => onBlur?.();

        quill.root.addEventListener('focus', handleFocus);
        quill.root.addEventListener('blur', handleBlur);

        // Clean up
        return () => {
            quill.off('text-change', handleTextChange);
            quill.root.removeEventListener('focus', handleFocus);
            quill.root.removeEventListener('blur', handleBlur);
            quill.disable();
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
            setQuillInstance(null);
        };
    }, []);

    // Handle prop changes after initial mount
    useEffect(() => {
        if (!quillInstance) return;

        // Update styles
        quillInstance.root.style.fontSize = fontSize;
        quillInstance.root.style.lineHeight = lineHeight;
        quillInstance.root.style.width = width;
        quillInstance.root.style.height = height;

        // Update readOnly state
        quillInstance.enable(!readOnly);

        // Reinitialize Quill if toolbar changes
        if (toolbar !== undefined && containerRef.current) {
            const content = quillInstance.root.innerHTML;
            quillInstance.disable();
            containerRef.current.innerHTML = '<div class="editor-content"></div>';
            const editorElement = containerRef.current.querySelector('.editor-content');

            const newQuill = new Quill(editorElement as Element, {
                theme,
                placeholder,
                readOnly,
                modules: {
                    ...(toolbar !== false && {
                        toolbar: toolbar === true ? defaultToolbarOptions : toolbar
                    }),
                    history: {
                        userOnly: true
                    }
                },
                formats: formats.length > 0 ? formats : undefined
            });

            newQuill.clipboard.dangerouslyPasteHTML(content);
            setQuillInstance(newQuill);
        }
    }, [theme, fontSize, lineHeight, width, height, readOnly, toolbar]);

    // Handle value changes separately
    useEffect(() => {
        if (!quillInstance || value === undefined) return;
        if (value !== quillInstance.root.innerHTML) {
            quillInstance.clipboard.dangerouslyPasteHTML(value);
        }
    }, [value]);

    // Utility functions
    const clearContent = () => {
        if (quillInstance) {
            quillInstance.setText('');
        }
    };

    const focus = () => {
        quillInstance?.focus();
    };

    const blur = () => {
        if (quillInstance) {
            (quillInstance.root as HTMLElement).blur();
        }
    };

    return {
        quillRef: containerRef,
        quillInstance,
        editorState,
        setEditorState: (content: string) => {
            if (quillInstance) {
                quillInstance.clipboard.dangerouslyPasteHTML(content);
            }
        },
        clearContent,
        focus,
        blur
    };
};

export type { useDynamicTextEditorProps, useDynamicTextEditorReturn };
export default useDynamicTextEditor;
