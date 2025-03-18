import { useMemo } from 'react';

interface UseRegexReturn {
    /**
     * Checks if text matches the pattern
     */
    isMatch: (text: string) => boolean;

    /**
     * Extracts all matches from text
     */
    extractMatches: (text: string) => string[];

    /**
     * Checks if cursor is within a pattern match
     */
    isCursorInMatch: (text: string, cursorIndex: number) => boolean;

    /**
     * Gets the current match at cursor position
     */
    getMatchAtCursor: (text: string, cursorIndex: number) => {
        match: string;
        start: number;
        end: number;
    } | null;
}

export const useRegex = (
    pattern: string | RegExp,
    globalFlag: boolean = true
): UseRegexReturn => {
    const regex = useMemo(() => {
        if (typeof pattern === 'string') {
            const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return new RegExp(escapedPattern, globalFlag ? 'g' : '');
        }
        return pattern;
    }, [pattern, globalFlag]);

    const isMatch = (text: string): boolean => {
        const regexCopy = new RegExp(regex);
        return regexCopy.test(text);
    };

    const extractMatches = (text: string): string[] => {
        const matches: string[] = [];
        const regexCopy = new RegExp(regex);

        if (!globalFlag) {
            const match = text.match(regexCopy);
            if (match) matches.push(match[0]);
            return matches;
        }

        let match;
        while ((match = regexCopy.exec(text)) !== null) {
            matches.push(match[0]);
        }
        return matches;
    };

    const isCursorInMatch = (text: string, cursorIndex: number): boolean => {
        const regexCopy = new RegExp(regex);

        if (!globalFlag) {
            const match = text.match(regexCopy);
            if (!match) return false;

            const index = text.indexOf(match[0]);
            return cursorIndex >= index && cursorIndex <= index + match[0].length;
        }

        let match;
        while ((match = regexCopy.exec(text)) !== null) {
            const start = match.index;
            const end = start + match[0].length;

            if (cursorIndex >= start && cursorIndex <= end) {
                return true;
            }
        }
        return false;
    };

    const getMatchAtCursor = (text: string, cursorIndex: number) => {
        const regexCopy = new RegExp(regex);

        if (!globalFlag) {
            const match = text.match(regexCopy);
            if (!match) return null;

            const start = text.indexOf(match[0]);
            const end = start + match[0].length;

            if (cursorIndex >= start && cursorIndex <= end) {
                return { match: match[0], start, end };
            }
            return null;
        }

        let match;
        while ((match = regexCopy.exec(text)) !== null) {
            const start = match.index;
            const end = start + match[0].length;

            if (cursorIndex >= start && cursorIndex <= end) {
                return { match: match[0], start, end };
            }
        }
        return null;
    };

    return {
        isMatch,
        extractMatches,
        isCursorInMatch,
        getMatchAtCursor
    };
};

export default useRegex;