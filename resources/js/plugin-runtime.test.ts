import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The plugin runtime is the seam between the core bundle and a plugin's own.
 * These cover the contract; the end-to-end behaviour (a real bundle rendering
 * with working hooks) is exercised in the browser.
 */
describe('plugin runtime', () => {
    beforeEach(async () => {
        vi.resetModules();
        delete (window as unknown as { Modulo?: unknown }).Modulo;
        await import('./plugin-runtime');
    });

    it('publishes React on window so plugins do not bundle their own', () => {
        const modulo = window.Modulo!;

        // Two copies of React means two hook dispatchers, and every plugin
        // component crashes on its first hook.
        expect(modulo.vendor.react).toBeDefined();
        expect(modulo.vendor.reactDOM).toBeDefined();
        expect(modulo.vendor.inertia).toBeDefined();
        expect(modulo.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('records what a plugin registers', () => {
        const Screen = () => null;
        window.Modulo!.registerComponents('demo', { Screen });

        expect(window.Modulo!.getComponent('demo', 'Screen')).toBe(Screen);
        expect(window.Modulo!.registered()).toEqual({ demo: ['Screen'] });
    });

    it('merges further registrations rather than replacing them', () => {
        window.Modulo!.registerComponents('demo', { One: () => null });
        window.Modulo!.registerComponents('demo', { Two: () => null });

        expect(window.Modulo!.registered().demo.sort()).toEqual(['One', 'Two']);
    });

    it('returns a registered component untouched', async () => {
        const { resolvePluginComponent } = await import('./plugin-runtime');
        const Screen = () => null;
        window.Modulo!.registerComponents('demo', { Screen });

        // Crucially not called: invoking a function component outside a render
        // is what produces "invalid hook call".
        await expect(resolvePluginComponent('demo', 'Screen')).resolves.toEqual({ default: Screen });
    });

    it('awaits a lazy entry declared as { load }', async () => {
        const { resolvePluginComponent } = await import('./plugin-runtime');
        const Lazy = () => null;
        window.Modulo!.registerComponents('demo', { Reports: { load: async () => ({ default: Lazy }) } });

        await expect(resolvePluginComponent('demo', 'Reports')).resolves.toEqual({ default: Lazy });
    });

    it('refuses a slug that could point the loader elsewhere', async () => {
        const { resolvePluginComponent } = await import('./plugin-runtime');

        // The bundle URL is built from the slug, so this is what stops a
        // crafted page prop loading an arbitrary script.
        await expect(resolvePluginComponent('../../evil', 'Screen')).rejects.toThrow('invalid slug');
        await expect(resolvePluginComponent('https://evil.test/x', 'Screen')).rejects.toThrow('invalid slug');
    });

    it('says what a plugin actually provides when a component is missing', async () => {
        const { resolvePluginComponent } = await import('./plugin-runtime');
        window.Modulo!.registerComponents('demo', { Screen: () => null });

        await expect(resolvePluginComponent('demo', 'Nope')).rejects.toThrow('It registered: Screen');
    });
});
