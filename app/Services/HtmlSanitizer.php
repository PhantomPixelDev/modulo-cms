<?php

namespace App\Services;

use DOMDocument;
use DOMElement;
use DOMNode;
use DOMXPath;

/**
 * Allowlist-based HTML sanitizer for user-authored content.
 *
 * Unknown elements are unwrapped (their text is kept), dangerous containers
 * are removed together with their content, and only allowlisted attributes
 * with safe URL schemes survive.
 */
class HtmlSanitizer
{
    /** Elements removed together with everything inside them. */
    protected const DROP = [
        'script', 'style', 'object', 'embed', 'applet', 'form', 'input', 'button',
        'textarea', 'select', 'option', 'link', 'meta', 'base', 'frame', 'frameset',
        'noscript', 'template', 'svg', 'math', 'title', 'head',
    ];

    /** Allowed elements mapped to their element-specific attributes. */
    protected const ALLOWED = [
        'a' => ['href', 'target', 'rel', 'name'],
        'abbr' => [], 'article' => [], 'aside' => [], 'b' => [], 'blockquote' => ['cite'],
        'br' => [], 'caption' => [], 'cite' => [], 'code' => [], 'col' => ['span'],
        'colgroup' => ['span'], 'dd' => [], 'del' => [], 'div' => [], 'dl' => [], 'dt' => [],
        'em' => [], 'figcaption' => [], 'figure' => [], 'footer' => [], 'header' => [],
        'h1' => [], 'h2' => [], 'h3' => [], 'h4' => [], 'h5' => [], 'h6' => [], 'hr' => [],
        'i' => [], 'img' => ['src', 'alt', 'width', 'height', 'loading'], 'ins' => [],
        'kbd' => [], 'li' => ['value'], 'mark' => [], 'ol' => ['start', 'type', 'reversed'],
        'p' => [], 'picture' => [], 'pre' => [], 'q' => ['cite'], 's' => [], 'section' => [],
        'small' => [], 'span' => [], 'strike' => [], 'strong' => [], 'sub' => [], 'sup' => [],
        'table' => [], 'tbody' => [], 'td' => ['colspan', 'rowspan'], 'tfoot' => [],
        'th' => ['colspan', 'rowspan', 'scope'], 'thead' => [], 'tr' => [], 'u' => [], 'ul' => [],
        'video' => ['src', 'poster', 'controls', 'width', 'height', 'loop', 'muted', 'playsinline'],
        'audio' => ['src', 'controls', 'loop', 'muted'],
        'source' => ['src', 'type'],
        'iframe' => ['src', 'width', 'height', 'title', 'allow', 'allowfullscreen', 'frameborder', 'loading'],
    ];

    protected const GLOBAL_ATTRIBUTES = ['class', 'id', 'title', 'lang', 'dir'];

    protected const URL_ATTRIBUTES = ['href', 'src', 'cite', 'poster'];

    protected const SAFE_SCHEMES = ['http', 'https', 'mailto', 'tel'];

    /** Only iframes pointing at these embed endpoints are kept. */
    protected const EMBED_PATTERNS = [
        '#^https://(www\.)?youtube(-nocookie)?\.com/embed/#i',
        '#^https://player\.vimeo\.com/video/#i',
    ];

    protected const ROOT_ID = 'modulo-sanitizer-root';

    public function sanitize(?string $html): string
    {
        if ($html === null || $html === '') {
            return '';
        }

        // Plain text cannot contain markup.
        if (! str_contains($html, '<')) {
            return $html;
        }

        $doc = new DOMDocument('1.0', 'UTF-8');
        $previous = libxml_use_internal_errors(true);
        $doc->loadHTML(
            '<?xml encoding="UTF-8"><div id="'.self::ROOT_ID.'">'.$html.'</div>',
            LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD | LIBXML_NONET
        );
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        $root = (new DOMXPath($doc))->query('//div[@id="'.self::ROOT_ID.'"]')->item(0);
        if (! $root instanceof DOMElement) {
            return e($html);
        }

        $this->cleanChildren($root);

        $output = '';
        foreach ($root->childNodes as $child) {
            $output .= $doc->saveHTML($child);
        }

        return $output;
    }

    public static function isSafeUrl(string $url): bool
    {
        // Browsers ignore control characters and whitespace inside schemes ("java\tscript:").
        $normalized = preg_replace('/[\x00-\x20\x7F]+/', '', html_entity_decode($url, ENT_QUOTES | ENT_HTML5, 'UTF-8'));

        if ($normalized === '' || $normalized === null) {
            return true;
        }

        if (preg_match('/^([a-z][a-z0-9+.\-]*):/i', $normalized, $matches)) {
            return in_array(strtolower($matches[1]), self::SAFE_SCHEMES, true);
        }

        return true;
    }

    protected function cleanChildren(DOMNode $node): void
    {
        foreach (iterator_to_array($node->childNodes, false) as $child) {
            if ($child instanceof DOMElement) {
                $this->cleanElement($child);
            } elseif ($child->nodeType !== XML_TEXT_NODE) {
                // Comments, processing instructions, CDATA
                $node->removeChild($child);
            }
        }
    }

    protected function cleanElement(DOMElement $element): void
    {
        $tag = strtolower($element->localName ?? $element->nodeName);
        $parent = $element->parentNode;

        if (in_array($tag, self::DROP, true) || ($tag === 'iframe' && ! $this->isAllowedEmbed($element))) {
            $parent->removeChild($element);

            return;
        }

        if (! array_key_exists($tag, self::ALLOWED)) {
            // Unknown element: keep its (cleaned) children, drop the wrapper.
            $this->cleanChildren($element);
            while ($element->firstChild) {
                $parent->insertBefore($element->firstChild, $element);
            }
            $parent->removeChild($element);

            return;
        }

        $this->cleanAttributes($element, $tag);
        $this->cleanChildren($element);
    }

    protected function cleanAttributes(DOMElement $element, string $tag): void
    {
        $allowed = array_merge(self::GLOBAL_ATTRIBUTES, self::ALLOWED[$tag]);

        foreach (iterator_to_array($element->attributes, false) as $attribute) {
            $name = strtolower($attribute->nodeName);

            if (! in_array($name, $allowed, true)
                || (in_array($name, self::URL_ATTRIBUTES, true) && ! self::isSafeUrl($attribute->value))) {
                $element->removeAttribute($attribute->nodeName);
            }
        }

        if ($tag === 'a' && $element->hasAttribute('target')) {
            $target = strtolower($element->getAttribute('target'));
            if ($target === '_blank') {
                $element->setAttribute('rel', 'noopener noreferrer');
            } elseif ($target !== '_self') {
                $element->removeAttribute('target');
            }
        }
    }

    protected function isAllowedEmbed(DOMElement $iframe): bool
    {
        $src = trim($iframe->getAttribute('src'));

        foreach (self::EMBED_PATTERNS as $pattern) {
            if (preg_match($pattern, $src)) {
                return true;
            }
        }

        return false;
    }
}
