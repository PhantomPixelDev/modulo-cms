import { Component, memo, Suspense, useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { resolveThemePartial, type ContentPartial, type ThemePartialProps } from '../../theme-partials';

const emptyPartials: ContentPartial[] = [];

interface ContentRendererProps {
    html: string;
    partials?: ContentPartial[];
    className?: string;
}

class PartialBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
    state = { failed: false };
    static getDerivedStateFromError() {
        return { failed: true };
    }
    componentDidCatch(error: Error) {
        console.warn('[Modulo] Theme partial failed; keeping fallback content.', error);
    }
    render() {
        return this.state.failed ? null : this.props.children;
    }
}

function MountedPartial({
    component: Partial,
    partial,
    partials,
    fallback,
}: {
    component: ComponentType<ThemePartialProps>;
    partial: ContentPartial;
    partials: ContentPartial[];
    fallback: HTMLElement;
}) {
    // Suspense prevents this effect until the module successfully commits.
    useEffect(() => {
        fallback.hidden = true;
        return () => {
            fallback.hidden = false;
        };
    }, [fallback]);

    return (
        <Partial name={partial.name} attributes={partial.attributes}>
            <ContentRenderer html={partial.html} partials={partials} />
        </Partial>
    );
}

// Keep React from replacing HTML managed by plugin shortcodes or portal mounts.
const HtmlHost = memo(function HtmlHost({
    html,
    className,
    hostRef,
}: {
    html: string;
    className?: string;
    hostRef: React.RefObject<HTMLDivElement | null>;
}) {
    return <div ref={hostRef} className={className} dangerouslySetInnerHTML={{ __html: html }} />;
});

function ContentInstance({ html, partials = emptyPartials, className }: ContentRendererProps) {
    const host = useRef<HTMLDivElement>(null);
    const [targets, setTargets] = useState<{ partial: ContentPartial; mount: HTMLElement; fallback: HTMLElement }[]>([]);

    useEffect(() => {
        const root = host.current;
        if (!root) return;
        const registered = new Map(partials.map((partial) => [partial.id, partial]));
        const found: typeof targets = [];
        for (const marker of root.querySelectorAll<HTMLElement>('[data-modulo-partial]')) {
            const ancestor = marker.parentElement?.closest('[data-modulo-partial]');
            // Nested modules are handled by their parent's ContentRenderer.
            if (ancestor && root.contains(ancestor)) continue;
            const partial = registered.get(marker.dataset.moduloPartial ?? '');
            const mount = marker.querySelector<HTMLElement>(':scope > [data-modulo-mount]');
            const fallback = marker.querySelector<HTMLElement>(':scope > [data-modulo-fallback]');
            if (partial && mount && fallback) found.push({ partial, mount, fallback });
        }
        setTargets(found);
    }, [html, partials]);

    return (
        <>
            <HtmlHost html={html} className={className} hostRef={host} />
            {targets.map(({ partial, mount, fallback }) => {
                const component = resolveThemePartial(partial.component);
                return component
                    ? createPortal(
                          <PartialBoundary>
                              <Suspense fallback={null}>
                                  <MountedPartial component={component} partial={partial} partials={partials} fallback={fallback} />
                              </Suspense>
                          </PartialBoundary>,
                          mount,
                          partial.id,
                      )
                    : null;
            })}
        </>
    );
}

/** Safe server HTML with optional React islands; portals retain the Inertia context. */
export default function ContentRenderer(props: ContentRendererProps) {
    return <ContentInstance key={props.html} {...props} />;
}
