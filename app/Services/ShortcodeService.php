<?php

namespace App\Services;

use Illuminate\Support\Facades\View;
use Illuminate\Support\Str;

class ShortcodeService
{
    protected array $shortcodes = [];

    public function __construct()
    {
        $this->registerDefaultShortcodes();
    }

    /**
     * Register a shortcode handler
     */
    public function register(string $tag, callable $handler): void
    {
        $this->shortcodes[$tag] = $handler;
    }

    /**
     * Parse and render all shortcodes in content
     */
    public function parse(string $content): string
    {
        // Pattern matches [tag], [tag attr="value"], [tag]content[/tag]
        $pattern = '/\[(\w+)([^\]]*)\](?:(.+?)\[\/\1\])?/s';

        return preg_replace_callback($pattern, function ($matches) {
            $tag = $matches[1];
            $attrString = $matches[2] ?? '';
            $innerContent = $matches[3] ?? '';

            if (!isset($this->shortcodes[$tag])) {
                return $matches[0]; // Return unchanged if shortcode not registered
            }

            $attrs = $this->parseAttributes($attrString);
            return call_user_func($this->shortcodes[$tag], $attrs, $innerContent);
        }, $content);
    }

    /**
     * Parse shortcode attributes string into array
     */
    protected function parseAttributes(string $attrString): array
    {
        $attrs = [];
        // Match key="value" or key='value' or key=value
        preg_match_all('/(\w+)\s*=\s*["\']?([^"\'>\s]+)["\']?/', $attrString, $matches, PREG_SET_ORDER);
        
        foreach ($matches as $match) {
            $attrs[$match[1]] = $match[2];
        }

        return $attrs;
    }

    /**
     * Register default CMS shortcodes
     */
    protected function registerDefaultShortcodes(): void
    {
        // [button] shortcode
        $this->register('button', function ($attrs, $content) {
            $url = $attrs['url'] ?? '#';
            $class = $attrs['class'] ?? 'btn btn-primary';
            $target = isset($attrs['new_tab']) ? ' target="_blank"' : '';
            return sprintf('<a href="%s" class="%s"%s>%s</a>', e($url), e($class), $target, e($content));
        });

        // [columns] shortcode
        $this->register('columns', function ($attrs, $content) {
            $cols = $attrs['count'] ?? 2;
            return sprintf('<div class="grid grid-cols-%s gap-4">%s</div>', (int)$cols, $content);
        });

        // [column] shortcode
        $this->register('column', function ($attrs, $content) {
            return sprintf('<div class="col-span-1">%s</div>', $content);
        });

        // [youtube] shortcode
        $this->register('youtube', function ($attrs) {
            $id = $attrs['id'] ?? '';
            if (!$id) return '';
            return sprintf(
                '<div class="aspect-video"><iframe src="https://www.youtube.com/embed/%s" frameborder="0" allowfullscreen class="w-full h-full"></iframe></div>',
                e($id)
            );
        });

        // [alert] shortcode
        $this->register('alert', function ($attrs, $content) {
            $type = $attrs['type'] ?? 'info';
            $classes = [
                'info' => 'bg-blue-100 text-blue-800 border-blue-200',
                'success' => 'bg-green-100 text-green-800 border-green-200',
                'warning' => 'bg-yellow-100 text-yellow-800 border-yellow-200',
                'error' => 'bg-red-100 text-red-800 border-red-200',
            ];
            $class = $classes[$type] ?? $classes['info'];
            return sprintf('<div class="p-4 border rounded %s">%s</div>', $class, $content);
        });
    }

    /**
     * Get all registered shortcode tags
     */
    public function getRegisteredTags(): array
    {
        return array_keys($this->shortcodes);
    }
}
