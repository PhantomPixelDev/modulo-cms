import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        port: 5173,
        host: '0.0.0.0',
        cors: {
            origin: ['http://localhost:8080', 'http://127.0.0.1:8080'],
            credentials: true,
        },
        hmr: {
            host: 'localhost',
            port: 5173,
        },
    },
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    esbuild: {
        jsx: 'automatic',
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'resources/js'),
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
        },
    },
});
