import { describe, expect, it } from 'vitest';
import { sectionMetadata } from './sectionMetadata';

describe('admin section metadata', () => {
    const t = (key: string) => key;
    it('uses create labels independently of item props and never duplicates the app name', () => {
        const metadata = sectionMetadata('dashboard.admin.pages.create', t);
        expect(metadata.title).toBe('dashboard.editor.create dashboard.nav.pages');
        expect(metadata.breadcrumbs.at(-1)?.title).toBe('dashboard.editor.create');
    });
    it('uses the maintenance screen name and retains unknown plugin metadata', () => {
        const metadata = sectionMetadata('system.backups', t);
        expect(metadata.title).toBe('dashboard.nav.backups');
        expect(metadata.breadcrumbs.at(-1)?.href).toBe('/dashboard/admin/system/backups');
        expect(sectionMetadata('example-plugin.entries', t).known).toBe(false);
    });
});
