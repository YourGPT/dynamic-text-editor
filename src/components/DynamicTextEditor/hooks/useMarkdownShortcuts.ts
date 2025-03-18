import { useEffect, useCallback, useRef, MutableRefObject } from 'react';
import Quill from 'quill';

/**
 * Hook to implement Markdown-style formatting shortcuts
 * - *text* to make text bold (strict matching, only exactly one asterisk on each side)
 * - Auto-pairs the syntax and applies formatting
 * - Removes formatting when asterisks are deleted
 * - Preserves native bold functionality (toolbar button and Ctrl+B)
 */
const useMarkdownShortcuts = (quill: Quill | null, isModifyingText?: MutableRefObject<boolean>) => {
    // Keep track of the last processed text to detect asterisk removals
    const lastProcessedText = useRef<string>('');

    // Track currently formatted regions
    const formattedRegions = useRef<Array<{ start: number; end: number }>>([]);

    // Track if we're currently processing markdown to avoid conflicts
    const isProcessingMarkdown = useRef<boolean>(false);

    // Process Markdown syntax and apply formatting
    const processMarkdown = useCallback(() => {
        if (!quill) return;

        // Set the processing flag to prevent recursion
        if (isProcessingMarkdown.current) return;

        // Skip processing if text is being modified by another process (like suggestions)
        if (isModifyingText?.current === true) return;

        isProcessingMarkdown.current = true;

        const text = quill.getText();

        // Store current text for comparison in the next update
        lastProcessedText.current = text;

        // Clear tracked formatted regions
        formattedRegions.current = [];

        // Instead of removing all bold formatting, we'll only handle the asterisk patterns
        // This way, bold formatting applied through the toolbar or Ctrl+B remains untouched

        // Match text between exactly one asterisk on each side (strict matching)
        const boldPattern = /(?<!\*)\*([^*]+)\*(?!\*)/g;
        let match;

        // Find all valid bold patterns
        while ((match = boldPattern.exec(text)) !== null) {
            const startIndex = match.index;
            const contentLength = match[1].length; // length of text between asterisks
            const endIndex = startIndex + contentLength + 1; // end of content before closing asterisk

            // Additional validation: ensure we have exactly one asterisk on each side
            const openingChar = text[startIndex];
            const closingChar = text[startIndex + contentLength + 1];

            if (openingChar !== '*' || closingChar !== '*') {
                console.debug('Invalid format detected, skipping:', match[0]);
                continue; // Skip this match
            }

            try {
                // Apply bold formatting to the content between the asterisks
                quill.formatText(startIndex + 1, contentLength, { bold: true });

                // Track this formatted region
                formattedRegions.current.push({
                    start: startIndex,
                    end: endIndex
                });
            } catch (error) {
                console.error("Error applying bold formatting:", error);
            }
        }

        // Reset the processing flag
        isProcessingMarkdown.current = false;
    }, [quill, isModifyingText]);

    // Handle asterisk auto-pairing with strict validation
    const handleAsteriskInput = useCallback((event: KeyboardEvent) => {
        if (!quill || event.key !== '*') return;

        // Skip if text is being modified by another process (like suggestions)
        if (isModifyingText?.current === true) return;

        // Get current selection
        const selection = quill.getSelection();
        if (!selection) return;

        // Prevent default to handle it ourselves
        event.preventDefault();

        const cursorPosition = selection.index;
        const text = quill.getText();

        // Strict validation: check for exact pattern conditions
        // Check if already have multiple asterisks in a row
        const hasPreviousAsterisk = cursorPosition > 0 && text[cursorPosition - 1] === '*';
        const hasNextAsterisk = cursorPosition < text.length && text[cursorPosition] === '*';

        // Check for multiple asterisks before current position
        const hasMultipleAsterisks =
            (cursorPosition > 1 && text[cursorPosition - 1] === '*' && text[cursorPosition - 2] === '*') ||
            (cursorPosition < text.length - 1 && text[cursorPosition] === '*' && text[cursorPosition + 1] === '*');

        // Check if this would create an invalid pattern
        if (hasMultipleAsterisks) {
            // Just insert a single asterisk without auto-pairing
            quill.insertText(cursorPosition, '*');
            quill.setSelection(cursorPosition + 1, 0);
            return;
        }

        // Check if there's selected text to wrap
        if (selection.length > 0) {
            // Get selected text
            const selectedText = quill.getText(selection.index, selection.length);

            // Delete selection first
            quill.deleteText(selection.index, selection.length);

            // Insert asterisks with the selected text in the middle
            // This is still valid since we're creating a proper *text* pattern
            quill.insertText(selection.index, '*');
            quill.insertText(selection.index + 1, selectedText);
            quill.insertText(selection.index + 1 + selectedText.length, '*');

            // Format the text as bold
            quill.formatText(selection.index + 1, selectedText.length, { bold: true });

            // Track this newly formatted region
            formattedRegions.current.push({
                start: selection.index,
                end: selection.index + selectedText.length + 1
            });

            // Place cursor after the inserted content
            quill.setSelection(selection.index + selectedText.length + 2, 0);
        } else if (hasPreviousAsterisk || hasNextAsterisk) {
            // If we already have an asterisk before or after, just move the cursor
            // This prevents creating invalid patterns like ** or ***
            quill.setSelection(cursorPosition + (hasNextAsterisk ? 1 : 0), 0);
        } else {
            // No asterisks nearby, so it's safe to auto-pair
            // Insert a pair of asterisks and place cursor between them
            quill.insertText(cursorPosition, '**');
            quill.setSelection(cursorPosition + 1, 0);
        }
    }, [quill, isModifyingText]);

    // Check if an asterisk was deleted and remove any associated formatting
    const checkForDeletedAsterisks = useCallback((currentText: string) => {
        if (!quill || !lastProcessedText.current) return;

        // Skip if text is being modified by another process (like suggestions)
        if (isModifyingText?.current === true) return;

        // Simple length check to avoid complex processing when not needed
        if (currentText.length >= lastProcessedText.current.length) {
            return;
        }

        // Find removed asterisks
        for (let i = 0; i < currentText.length; i++) {
            // If characters don't match, we might have deletion
            if (currentText[i] !== lastProcessedText.current[i]) {
                // Check if an asterisk was removed
                if (lastProcessedText.current[i] === '*') {
                    console.debug('Asterisk removed at position', i);

                    // Find the formatted region this asterisk belongs to
                    const affectedRegion = formattedRegions.current.find(
                        region => region.start === i || region.end === i
                    );

                    if (affectedRegion) {
                        // Remove formatting for this region
                        console.debug('Removing formatting for region', affectedRegion);
                        quill.formatText(
                            affectedRegion.start + 1,
                            affectedRegion.end - affectedRegion.start - 1,
                            { bold: false }
                        );
                    }
                }
                break;
            }
        }
    }, [quill, isModifyingText]);

    // Set up event listeners
    useEffect(() => {
        if (!quill) return;

        // Skip setting up if we're currently modifying text
        if (isModifyingText?.current === true) return;

        // Process existing markdown when initialized
        processMarkdown();

        // Listen for asterisk input
        const editorElement = quill.root;
        editorElement.addEventListener('keydown', handleAsteriskInput);

        // Process markdown on text changes
        const handleTextChange = () => {
            // Don't process if we're already doing it (prevents recursion)
            if (isProcessingMarkdown.current) return;

            // Skip if text is being modified by another process (like suggestions)
            if (isModifyingText?.current === true) return;

            const currentText = quill.getText();

            // Check if asterisks were deleted
            checkForDeletedAsterisks(currentText);

            // Then process markdown formatting
            // Use a small delay to ensure text is fully updated
            setTimeout(processMarkdown, 10);
        };

        quill.on('text-change', handleTextChange);

        return () => {
            editorElement.removeEventListener('keydown', handleAsteriskInput);
            quill.off('text-change', handleTextChange);
        };
    }, [quill, handleAsteriskInput, processMarkdown, checkForDeletedAsterisks, isModifyingText]);

    // Add CSS to style asterisks
    useEffect(() => {
        // Add CSS to make asterisks more subtle but still visible
        const style = document.createElement('style');
        style.textContent = `
            .ql-editor .markdown-asterisk {
                opacity: 0.5;
                color: #666;
                user-select: none;
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    // Register a custom blot for markdown syntax characters
    useEffect(() => {
        if (!quill) return;

        // Register a custom format if not already registered
        if (!Quill.imports['formats/markdown-syntax']) {
            const Inline = Quill.import('blots/inline') as typeof import('quill/blots/inline').default;

            class MarkdownSyntaxBlot extends Inline {
                static blotName = 'markdown-syntax';
                static tagName = 'span';
                static className = 'markdown-syntax';
            }

            Quill.register('formats/markdown-syntax', MarkdownSyntaxBlot);
        }
    }, [quill]);

    return {
        processMarkdown
    };
};

export default useMarkdownShortcuts;