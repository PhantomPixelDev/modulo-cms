import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { exportsOf, SHIMS, uiExports } from '../../scripts/build-plugin-shims.mjs';

/**
 * The shims in public/modulo-sdk re-export the core's React & co. to plugin
 * bundles. If a dependency upgrade adds an export the shim lacks, a plugin
 * importing it gets a module link error in the browser; catch that here.
 */
describe('plugin SDK shims', () => {
    for (const [file, { specifier, vendor }] of Object.entries(SHIMS as Record<string, { specifier: string; vendor: string }>)) {
        it(`${file} re-exports everything ${specifier} exports`, async () => {
            const source = readFileSync(resolve(__dirname, '../../public/modulo-sdk', file), 'utf8');
            const names: string[] = await exportsOf(specifier);

            expect(source).toContain(`window.Modulo.vendor.${vendor}`);
            for (const name of names) {
                expect(source, `missing export "${name}" -- run npm run build:shims`).toContain(`export const ${name} = m.${name};`);
            }
        });
    }

    it('is wired into the page by an import map', () => {
        const blade = readFileSync(resolve(__dirname, '../views/app.blade.php'), 'utf8');
        for (const { specifier } of Object.values(SHIMS as Record<string, { specifier: string }>)) {
            expect(blade).toContain(`"${specifier}":`);
        }
        expect(blade).toContain('"@modulo/ui":');
    });

    it('ui.js re-exports the whole admin kit', () => {
        // Read, not imported: importing the kit would pull every admin component into this run
        const source = readFileSync(resolve(__dirname, '../../public/modulo-sdk/ui.js'), 'utf8');
        const names: string[] = uiExports();

        expect(names.length).toBeGreaterThan(40);
        expect(source).toContain('window.Modulo.ui');
        for (const name of names) {
            expect(source, `missing export "${name}" -- run npm run build:shims`).toContain(`export const ${name} = m.${name};`);
        }
    });
});
