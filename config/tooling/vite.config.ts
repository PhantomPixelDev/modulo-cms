import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { fileURLToPath } from 'node:url';
import path from 'path';
import { defineConfig } from 'vite';

// Environment-based configuration
const viteHost = process.env.VITE_HOST || 'localhost';
const vitePort = parseInt(process.env.VITE_PORT || '5173', 10);
const serverHost = process.env.VITE_SERVER_HOST || (process.env.VITE_HOST?.includes('localhost') ? '0.0.0.0' : 'localhost');
const isDocker = !!process.env.VITE_HOST && process.env.VITE_HOST !== 'localhost';
const hmrEnabled = process.env.VITE_HMR_ENABLED !== 'false';
const projectRoot = fileURLToPath(new URL('../../', import.meta.url));

// Set dev server URL for Laravel Vite plugin
process.env.VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || `http://localhost:${vitePort}`;

export default defineConfig(({ command, isSsrBuild }) => ({
    base: command === 'build' ? '/build/' : '/',
    server: {
        host: serverHost,
        port: vitePort,
        strictPort: process.env.VITE_SERVER_STRICT_PORT === 'true',
        origin: command === 'serve' ? process.env.VITE_DEV_SERVER_URL || undefined : undefined,
        cors: true,
        hmr: hmrEnabled
            ? {
                  host: process.env.VITE_HMR_HOST || (isDocker ? viteHost : 'localhost'),
                  port: parseInt(process.env.VITE_HMR_PORT || (isDocker ? '80' : vitePort.toString()), 10),
                  clientPort: parseInt(process.env.VITE_HMR_CLIENT_PORT || (isDocker ? '8000' : vitePort.toString()), 10),
                  protocol: process.env.VITE_HMR_PROTOCOL || 'ws',
                  path: '/vite-hmr',
              }
            : false,
        watch: {
            // Windows bind mounts do not deliver inotify events into the
            // container, so the dev stack polls. Polling stats every watched
            // file on each interval, which costs ~2ms per file over that
            // mount -- watching the whole tree (.git and storage alone are
            // ~3k files Vite never serves) saturates the same mount PHP
            // reads from and pegs a core for nothing.
            usePolling: process.env.VITE_WATCH_USE_POLLING === 'true',
            interval: parseInt(process.env.VITE_WATCH_INTERVAL || '3000', 10),
            ignored: (filePath: string) => /[/](?:[.]git|vendor|node_modules|storage|bootstrap[/]cache|public[/]build)[/]/.test(filePath + '/'),
        },
        // Compile the entries and the active theme up front, so the first
        // navigation does not pay for a cold transform.
        warmup: {
            // Warmup transforms the listed files but does not follow their
            // imports, so the shell app.tsx pulls in on every page has to be
            // named explicitly -- cold, those cost seconds each.
            clientFiles: [
                './resources/css/app.css',
                './resources/js/app.tsx',
                './resources/js/ErrorBoundary.tsx',
                './resources/js/components/admin/AdminToastProvider.tsx',
                './resources/js/hooks/use-appearance.tsx',
                './resources/themes/*/components/*.tsx',
            ],
        },
    },
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: isSsrBuild || process.env.VITE_LARAVEL_SSR === 'true' ? 'resources/js/ssr.tsx' : undefined,
            refresh: process.env.VITE_LARAVEL_REFRESH === 'true',
            // Relative to public/; must match what Laravel's @vite expects (public/build)
            buildDirectory: 'build',
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
        target: process.env.VITE_BUILD_TARGET || 'es2020',
        minify: process.env.VITE_BUILD_MINIFY !== 'false',
        sourcemap: process.env.VITE_BUILD_SOURCEMAP === 'true',
        rolldownOptions: {
            output: {
                manualChunks: isSsrBuild
                    ? undefined
                    : (id: string) => {
                          const module = id.replaceAll('\\', '/');
                          if (!module.includes('/node_modules/')) return;
                          if (/\/node_modules\/(react|react-dom|@inertiajs)\//.test(module)) return 'vendor';
                          if (/\/node_modules\/(slate|slate-react|slate-history|slate-dom)\//.test(module)) return 'editor';
                          if (/\/node_modules\/(@radix-ui|@headlessui)\//.test(module)) return 'ui';
                          if (/\/node_modules\/(date-fns|clsx|tailwind-merge|class-variance-authority)\//.test(module)) return 'utils';
                      },
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(projectRoot, 'resources/js'),
            '@themes': path.resolve(projectRoot, 'resources/themes'),
        },
    },
}));
