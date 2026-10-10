import type { ThemePartialProps } from '@/theme-partials';

/** Accessible, interactive example with native keyboard controls. */
export default function Disclosure({ attributes, children }: ThemePartialProps) {
    return (
        <details className="my-6 rounded-xl border bg-card p-5" open={attributes.open === 'true'}>
            <summary className="cursor-pointer font-semibold">{attributes.title}</summary>
            <div className="mt-4">{children}</div>
        </details>
    );
}
