import { lazy, type ReactNode } from 'react';

type SectionFactory<Context> = (context: Context) => Record<string, () => ReactNode>;

/** Keep route metadata eager and load the selected screen only when rendered. */
export function lazySections<Context>(keys: readonly string[], load: () => Promise<SectionFactory<Context>>): SectionFactory<Context> {
    const Section = lazy(async () => {
        const factory = await load();
        return {
            default: ({ context, section }: { context: Context; section: string }) => factory(context)[section]?.() ?? null,
        };
    });

    return (context) => Object.fromEntries(keys.map((section) => [section, () => <Section context={context} section={section} />]));
}
