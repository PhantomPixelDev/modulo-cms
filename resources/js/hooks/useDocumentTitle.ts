import { useEffect } from 'react';

/**
 * Keep the browser tab title in sync with react-rendered pages.
 * Falls back to no-op during SSR.
 */
export function useDocumentTitle(title?: string | null) {
    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        if (title) {
            document.title = title;
        }
    }, [title]);
}
