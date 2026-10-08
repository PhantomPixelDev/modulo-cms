<?php

namespace App\Services;

use App\Models\Theme;
use Illuminate\Support\Str;

/** Theme code is trusted; shortcode attributes and body are author-controlled. */
class ThemePartialService
{
    public const COMPONENT_PATTERN = '~^(?:components/partials|partials)/(?:[A-Za-z0-9_-]+/)*[A-Za-z0-9_-]+\.tsx$~D';

    /**
     * @return array<string, array{component: string, defaults: array<string, string>, label: string, description: string, body: bool}>
     */
    public function registry(?Theme $theme): array
    {
        $registry = [];
        $seen = [];
        for ($current = $theme; $current !== null && ! in_array($current->id, $seen, true); $current = $current->parent) {
            $seen[] = $current->id;
            $definitions = $current->config['partials'] ?? $current->partials ?? [];
            if (! is_array($definitions)) {
                continue;
            }
            foreach ($definitions as $name => $definition) {
                if (array_key_exists($name, $registry)) {
                    continue;
                }
                // A child's declaration also lets it disable an inherited shortcode.
                $registry[$name] = null;
                if (! is_array($definition) || ($definition['shortcode'] ?? false) !== true
                    || ! preg_match('/^[a-z][a-z0-9_-]*$/D', (string) $name)) {
                    continue;
                }
                $path = $definition['component'] ?? '';
                if (! is_string($path) || ! preg_match(self::COMPONENT_PATTERN, $path)) {
                    continue;
                }
                $owner = app(ThemeManager::class)->componentThemeFor($current, $path);
                // Runtime packages can reuse bundled parent code, never import uploaded code.
                if ($owner->isRuntimeInstalled() || ! is_file($owner->full_path.'/'.$path)
                    || ! preg_match('/^[a-z0-9-]+$/D', (string) $owner->directory_path)) {
                    continue;
                }
                $defaults = $definition['defaults'] ?? [];
                $registry[$name] = [
                    'component' => $owner->directory_path.'/'.$path,
                    'defaults' => is_array($defaults) ? array_filter($defaults, fn ($value) => is_string($value)) : [],
                    'label' => is_string($definition['label'] ?? null) ? $definition['label'] : (string) $name,
                    'description' => is_string($definition['description'] ?? null) ? $definition['description'] : '',
                    'body' => ($definition['body'] ?? true) !== false,
                ];
            }
        }

        return array_filter($registry);
    }

    /**
     * Opaque markers are generated after author HTML is sanitized. Descriptors
     * travel separately in Inertia props, so content cannot forge component imports.
     *
     * @return array{html: string, partials: list<array{id: string, name: string, component: string, attributes: array<string, string>, html: string}>}
     */
    public function render(string $html): array
    {
        if (! str_contains($html, '[partial')) {
            return ['html' => $html, 'partials' => []];
        }
        $registry = $this->registry(app(ThemeManager::class)->getActiveTheme());
        $partials = [];
        $markers = [];
        $html = app(ShortcodeService::class)->parseWith($html, [
            'partial' => function (array $attributes, string $body) use ($registry, &$partials, &$markers): string {
                $name = $attributes['name'] ?? '';
                unset($attributes['name']);
                if (! isset($registry[$name]) || count($partials) >= 100) {
                    // Theme changes never remove the author's fallback text.
                    return $body;
                }
                // Protect only markers we just created for nested partials; all
                // other HTML and attributes go through the standard sanitizer.
                $body = strtr($body, array_flip($markers));
                $body = app(HtmlSanitizer::class)->sanitize($body);
                $body = strtr($body, $markers);
                $id = (string) Str::uuid();
                $partials[] = [
                    'id' => $id,
                    'name' => $name,
                    'component' => $registry[$name]['component'],
                    'attributes' => array_merge($registry[$name]['defaults'], $attributes),
                    'html' => $body,
                ];
                $marker = '<div data-modulo-partial="'.$id.'"><div data-modulo-fallback>'.$body.'</div><div data-modulo-mount></div></div>';
                $markers['MODULOPARTIAL'.str_replace('-', '', $id)] = $marker;

                return $marker;
            },
        ]);
        // A block shortcode on its own Slate paragraph must not leave an empty p.
        foreach ($markers as $marker) {
            $html = str_replace(['<p>'.$marker.'</p>', '<p> '.$marker.' </p>'], $marker, $html);
        }

        return ['html' => $html, 'partials' => $partials];
    }
}
