import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './resources/js'),
            '@themes': path.resolve(__dirname, './resources/themes'),
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./resources/js/test/setup.ts'],
        include: ['resources/**/*.test.{ts,tsx}'],
        restoreMocks: true,
        coverage: {
            provider: 'v8',
            reporter: ['text-summary', 'lcov'],
            // Measured over the modules the tests load; thresholds keep them from slipping.
            thresholds: { lines: 70, statements: 70, functions: 70, branches: 65 },
        },
    },
});
