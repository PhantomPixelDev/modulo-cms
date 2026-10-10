<?php

namespace App\Services;

use DOMDocument;
use DOMElement;

/** Static SVG only: XML decoding must happen before checking URL attributes. */
class SvgValidator
{
    private const ELEMENTS = [
        'svg', 'g', 'defs', 'symbol', 'use', 'path', 'rect', 'circle', 'ellipse',
        'line', 'polyline', 'polygon', 'text', 'tspan', 'textPath', 'title', 'desc',
        'linearGradient', 'radialGradient', 'stop', 'clipPath', 'mask', 'pattern',
        'image', 'a', 'filter', 'feBlend', 'feColorMatrix', 'feComponentTransfer',
        'feComposite', 'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap',
        'feDistantLight', 'feDropShadow', 'feFlood', 'feFuncA', 'feFuncB', 'feFuncG',
        'feFuncR', 'feGaussianBlur', 'feMerge', 'feMergeNode', 'feMorphology',
        'feOffset', 'fePointLight', 'feSpecularLighting', 'feSpotLight', 'feTile',
        'feTurbulence',
    ];

    public function isSafe(string $svg): bool
    {
        // Reject declarations before libxml sees the internal subset. Checking
        // DOMDocument::doctype afterwards is too late for parser-level bugs.
        // A single byte encoding makes this preflight unambiguous.
        if (! mb_check_encoding($svg, 'UTF-8') || str_contains($svg, "\0")
            || preg_match('/<!DOCTYPE|<!ENTITY/i', $svg)) {
            return false;
        }
        if (preg_match('/<\?xml[^>]*\bencoding\s*=\s*["\']([^"\']+)["\']/i', $svg, $encoding)
            && ! in_array(strtolower($encoding[1]), ['utf-8', 'utf8', 'us-ascii', 'ascii'], true)) {
            return false;
        }
        $doc = new DOMDocument;
        $previous = libxml_use_internal_errors(true);
        try {
            // No entity expansion or external DTD loading; reject DTDs altogether.
            if (! $doc->loadXML($svg, LIBXML_NONET) || $doc->doctype !== null) {
                return false;
            }
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($previous);
        }

        $root = $doc->documentElement;
        if (! $root instanceof DOMElement || $root->localName !== 'svg') {
            return false;
        }

        foreach ($doc->getElementsByTagName('*') as $element) {
            if ($element->namespaceURI !== 'http://www.w3.org/2000/svg'
                || ! in_array($element->localName, self::ELEMENTS, true)) {
                return false;
            }

            foreach ($element->attributes as $attribute) {
                $name = strtolower($attribute->localName);
                $value = $attribute->value;
                if (str_starts_with($name, 'on')
                    || ($name === 'base' && $attribute->namespaceURI === 'http://www.w3.org/XML/1998/namespace')
                    || (in_array($name, ['href', 'src'], true) && ! HtmlSanitizer::isSafeUrl($value))) {
                    return false;
                }

                // Presentation attributes may reference local paint servers, never remote content.
                $withoutLocalUrls = preg_replace('/url\(\s*["\']?#[a-z0-9_.:-]+["\']?\s*\)/i', '', $value);
                if (preg_match('/url\s*\(|@import|expression\s*\(/i', (string) $withoutLocalUrls)) {
                    return false;
                }
            }
        }

        // A processing instruction can load an external XML stylesheet.
        foreach ($doc->childNodes as $node) {
            if ($node->nodeType === XML_PI_NODE) {
                return false;
            }
        }

        return true;
    }
}
