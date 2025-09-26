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
        alias: [
            { find: /^\/(.*)/, replacement: '/$1' },
            { find: /^~\/(.*)/, replacement: '$1' },
            { 
                find: '@', 
                replacement: resolve(__dirname, 'resources/js') 
            },
            { 
                find: 'ziggy-js', 
                replacement: resolve(__dirname, 'vendor/tightenco/ziggy') 
            },
        ],
        extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    },
    optimizeDeps: {
        include: ['react', 'react-dom', '@inertiajs/react'],
        esbuildOptions: {
            preserveSymlinks: true,
        },
    },
});
