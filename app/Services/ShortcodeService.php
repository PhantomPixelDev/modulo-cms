<?php

namespace App\Services;

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
        return $this->parseWith($content, $this->shortcodes);
    }

    /**
     * Parse using request-local handlers, without changing the plugin registry.
     * Code examples are literal; balanced tags support nested modules.
     *
     * @param  array<string, callable>  $handlers
     */
    public function parseWith(string $content, array $handlers): string
    {
        return $this->expand($content, $handlers, 0);
    }

    /** @param array<string, callable> $handlers */
    private function expand(string $content, array $handlers, int $depth): string
    {
        if ($depth >= 16) {
            return $content;
        }

        $pattern = '~\[(/?)([a-zA-Z_][\w-]*)((?:&quot;.*?&quot;|&#0*39;.*?&#0*39;|"[^"]*"|\x27[^\x27]*\x27|[^\]"\x27])*)\]~s';
        preg_match_all($pattern, $content, $tokens, PREG_SET_ORDER | PREG_OFFSET_CAPTURE);
        preg_match_all('~<(pre|code)\b[^>]*>.*?</\1>~is', $content, $literal, PREG_OFFSET_CAPTURE);
        // A shortcode is content, never part of an HTML attribute.
        preg_match_all('~<(?:[^>"\x27]|"[^"]*"|\x27[^\x27]*\x27)*>~s', $content, $htmlTags, PREG_OFFSET_CAPTURE);
        $literal[0] = array_merge($literal[0], $htmlTags[0]);
        $tokens = array_values(array_filter($tokens, function ($token) use ($literal) {
            foreach ($literal[0] as [$html, $start]) {
                if ($token[0][1] >= $start && $token[0][1] < $start + strlen($html)) {
                    return false;
                }
            }

            return true;
        }));
        $result = '';
        $cursor = 0;

        foreach ($tokens as $index => $token) {
            [$opening, $offset] = $token[0];
            if ($offset < $cursor || $token[1][0] === '/') {
                continue;
            }
            $tag = $token[2][0];
            $end = $offset + strlen($opening);
            $inner = '';
            $closing = '';
            if (! str_ends_with(rtrim($token[3][0]), '/')) {
                $balance = 1;
                for ($i = $index + 1, $count = count($tokens); $i < $count; $i++) {
                    $next = $tokens[$i];
                    if ($next[2][0] !== $tag) {
                        continue;
                    }
                    if ($next[1][0] === '/') {
                        $balance--;
                    } elseif (! str_ends_with(rtrim($next[3][0]), '/')) {
                        $balance++;
                    }
                    if ($balance === 0) {
                        $inner = substr($content, $end, $next[0][1] - $end);
                        $closing = $next[0][0];
                        $end = $next[0][1] + strlen($closing);
                        break;
                    }
                }
            }
            $result .= substr($content, $cursor, $offset - $cursor);
            $inner = $this->expand($inner, $handlers, $depth + 1);
            $result .= isset($handlers[$tag])
                ? (string) $handlers[$tag]($this->parseAttributes($token[3][0]), $inner)
                : $opening.$inner.$closing;
            $cursor = $end;
        }

        return $result.substr($content, $cursor);
    }

    /**
     * Parse shortcode attributes string into array
     */
    protected function parseAttributes(string $attrString): array
    {
        $attrs = [];
        // Slate escapes quotes in text. Decode only attributes, never body HTML.
        $attrString = html_entity_decode($attrString, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        preg_match_all('/([\w-]+)\s*=\s*(?:"([^"]*)"|\x27([^\x27]*)\x27|([^\s\]]+))/', $attrString, $matches, PREG_SET_ORDER | PREG_UNMATCHED_AS_NULL);

        foreach ($matches as $match) {
            $attrs[$match[1]] = html_entity_decode($match[2] ?? $match[3] ?? $match[4] ?? '', ENT_QUOTES | ENT_HTML5, 'UTF-8');
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
            if (! HtmlSanitizer::isSafeUrl($url)) {
                $url = '#';
            }
            $class = $attrs['class'] ?? 'btn btn-primary';
            $target = isset($attrs['new_tab']) ? ' target="_blank" rel="noopener noreferrer"' : '';

            return sprintf('<a href="%s" class="%s"%s>%s</a>', e($url), e($class), $target, e($content));
        });

        // [columns] shortcode
        $this->register('columns', function ($attrs, $content) {
            $cols = max(1, min(12, (int) ($attrs['count'] ?? 2)));

            return sprintf('<div class="grid grid-cols-%s gap-4">%s</div>', $cols, $content);
        });

        // [column] shortcode
        $this->register('column', function ($attrs, $content) {
            return sprintf('<div class="col-span-1">%s</div>', $content);
        });

        // [youtube] shortcode
        $this->register('youtube', function ($attrs) {
            $id = $attrs['id'] ?? '';
            if (! is_string($id) || ! preg_match('/^[A-Za-z0-9_-]{11}$/', $id)) {
                return '';
            }

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
