import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// Environment-based configuration
const viteHost = process.env.VITE_HOST || 'localhost';
const vitePort = parseInt(process.env.VITE_PORT || '5173', 10);
const serverHost = process.env.VITE_SERVER_HOST || (process.env.VITE_HOST?.includes('localhost') ? '0.0.0.0' : 'localhost');
const isDocker = !!process.env.VITE_HOST && process.env.VITE_HOST !== 'localhost';
const hmrEnabled = process.env.VITE_HMR_ENABLED !== 'false';

// Set dev server URL for Laravel Vite plugin
process.env.VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || `http://localhost:${vitePort}`;

export default defineConfig(({ command }) => ({
    base: command === 'build' ? '/build/' : '/',
    server: {
        host: serverHost,
        port: vitePort,
        strictPort: process.env.VITE_SERVER_STRICT_PORT === 'true',
        origin: command === 'serve' ? (process.env.VITE_DEV_SERVER_URL || undefined) : undefined,
        cors: true,
        hmr: hmrEnabled ? {
            host: process.env.VITE_HMR_HOST || (isDocker ? viteHost : 'localhost'),
            port: parseInt(process.env.VITE_HMR_PORT || (isDocker ? '80' : vitePort.toString()), 10),
            clientPort: parseInt(process.env.VITE_HMR_CLIENT_PORT || (isDocker ? '8443' : vitePort.toString()), 10),
            protocol: process.env.VITE_HMR_PROTOCOL || 'ws',
            path: '/vite-hmr',
        } : false,
        watch: {
            usePolling: process.env.VITE_WATCH_USE_POLLING === 'true',
            interval: parseInt(process.env.VITE_WATCH_INTERVAL || '1000', 10),
        },
    },
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: process.env.VITE_LARAVEL_SSR === 'true' ? 'resources/js/ssr.tsx' : undefined,
            refresh: process.env.VITE_LARAVEL_REFRESH === 'true',
            buildDirectory: process.env.VITE_BUILD_OUTDIR || 'build',
            valetTls: null,
            detectTls: null,
        }),
        react(),
        tailwindcss(),
    ],
    // Warmup main entry points for faster initial load
    preview: {
        port: 5173,
    },
    build: {
        outDir: process.env.VITE_BUILD_OUTDIR || 'build',
        target: process.env.VITE_BUILD_TARGET || 'es2020',
        minify: process.env.VITE_BUILD_MINIFY !== 'false' ? 'esbuild' : false,
        sourcemap: process.env.VITE_BUILD_SOURCEMAP === 'true',
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', '@inertiajs/react'],
                    ui: [
                        '@radix-ui/react-dialog',
                        '@radix-ui/react-dropdown-menu',
                        '@radix-ui/react-select',
                        '@radix-ui/react-tabs',
                        '@radix-ui/react-tooltip',
                        '@headlessui/react',
                    ],
                    editor: ['slate', 'slate-react', 'slate-history', 'slate-dom'],
                    utils: ['date-fns', 'clsx', 'tailwind-merge', 'class-variance-authority'],
                },
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './resources/js'),
            '@themes': path.resolve(__dirname, './resources/themes'),
        },
    },
}));



