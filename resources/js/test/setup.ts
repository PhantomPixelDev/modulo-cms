import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
    cleanup();
});

// jsdom does not implement these; Radix and the sidebar rely on them
window.matchMedia =
    window.matchMedia ||
    ((query: string) =>
        ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }) as unknown as MediaQueryList);

window.ResizeObserver =
    window.ResizeObserver ||
    class {
        observe() {}
        unobserve() {}
        disconnect() {}
    };
