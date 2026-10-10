import type { ThemePartialProps } from '@/theme-partials';

/** Example: [partial name="callout" title="Good to know"]Text[/partial] */
export default function Callout({ attributes, children }: ThemePartialProps) {
    const tones: Record<string, string> = {
        info: 'border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100',
        success: 'border-green-200 bg-green-50 text-green-950 dark:border-green-900 dark:bg-green-950 dark:text-green-100',
        warning: 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100',
    };
    return (
        <aside className={`my-6 rounded-xl border p-5 ${tones[attributes.tone] ?? tones.info}`}>
            {attributes.title && <h2 className="mt-0 text-lg font-semibold">{attributes.title}</h2>}
            <div className="[&>div>p:last-child]:mb-0">{children}</div>
        </aside>
    );
}
