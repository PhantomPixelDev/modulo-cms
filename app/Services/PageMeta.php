<?php

namespace App\Services;

use Illuminate\Http\Request;

/**
 * The <head> tags of a public page, worked out on the server.
 *
 * The React theme sets the same tags in the browser, but crawlers that don't
 * run JavaScript and link previews (chat apps, social networks) only read the
 * HTML the server sends. These are printed with Inertia's `inertia` attribute,
 * so the theme replaces them on load instead of doubling them. The rules
 * mirror the theme's Layout: keep the two in step.
 */
class PageMeta
{
    /** Pages about one visitor's session, never worth indexing. */
    public const PRIVATE_TEMPLATES = ['Shop/Cart', 'Shop/Checkout', 'Shop/OrderConfirmation', 'Shop/Account'];

    /** Titles of listing templates that carry no entity of their own. */
    protected const TEMPLATE_TITLES = [
        'Shop/Archive' => 'Shop',
        'Shop/Cart' => 'Shopping Cart',
        'Shop/Checkout' => 'Checkout',
        'Shop/Account' => 'My orders',
    ];

    /**
     * @param  array<string, mixed>  $props  What the template receives
     * @return array{title: string, description: ?string, image: ?string, canonical: string, robots: string, type: string, site: string, published: ?string, author: ?string, json_ld: list<array<string, mixed>>}
     */
    public function build(string $template, array $props, Request $request): array
    {
        $site = is_array($props['site'] ?? null) ? $props['site'] : [];
        $siteName = (string) ($site['name'] ?? config('app.name'));

        $post = is_array($props['post'] ?? null) ? $props['post'] : null;
        $page = is_array($props['page'] ?? null) ? $props['page'] : null;
        $product = is_array($props['product'] ?? null) ? $props['product'] : null;
        $entity = $post ?? $page;
        $seo = is_array($entity['seo'] ?? null) ? $entity['seo'] : [];
        $term = is_array($props['term'] ?? null) ? $props['term'] : null;
        $category = is_array($props['category'] ?? null) ? $props['category'] : null;

        $title = $this->string($seo['title'] ?? null)
            ?? $this->string($entity['title'] ?? null)
            ?? $this->string($product['title'] ?? null)
            ?? $this->string($term['name'] ?? null)
            ?? $this->string($category['name'] ?? null)
            ?? (isset($props['searchQuery']) ? 'Search: '.$props['searchQuery'] : null)
            ?? $this->string($props['postType']['plural_label'] ?? null)
            ?? (self::TEMPLATE_TITLES[$template] ?? null);
        $fullTitle = $title ? "{$title} | {$siteName}" : $siteName;

        $description = $this->string($seo['description'] ?? null)
            ?? $this->string($entity['excerpt'] ?? null)
            ?? $this->string($product['excerpt'] ?? null)
            ?? $this->string($term['description'] ?? null)
            ?? $this->string($site['description'] ?? null);
        $description = $description !== null ? mb_substr(trim(strip_tags($description)), 0, 300) : null;

        $image = $this->absolute($this->string($seo['image'] ?? null)
            ?? $this->string($entity['featured_image'] ?? null)
            ?? $this->string($product['featured_image'] ?? null));

        $canonical = $this->absolute($this->string($seo['canonical'] ?? null)) ?? $request->url();
        $noindex = ! empty($seo['noindex']) || in_array($template, self::PRIVATE_TEMPLATES, true);
        $isArticle = $post !== null && isset($post['id']);
        $published = $this->string($post['published_at'] ?? null) ?? $this->string($page['updated_at'] ?? null);
        $author = $this->string($entity['author']['name'] ?? null);

        $jsonLd = [[
            '@context' => 'https://schema.org',
            '@type' => $isArticle ? 'Article' : 'WebPage',
            'headline' => $fullTitle,
            'description' => $description,
            'author' => ['@type' => 'Person', 'name' => $author ?? $siteName],
            'publisher' => [
                '@type' => 'Organization',
                'name' => $siteName,
                'logo' => ['@type' => 'ImageObject', 'url' => $this->absolute($this->string($site['logo'] ?? null)) ?? $image],
            ],
            'datePublished' => $published,
            'dateModified' => $published,
            'image' => $image,
            'url' => $canonical,
            'mainEntityOfPage' => ['@type' => 'WebPage', '@id' => $canonical],
        ]];

        if ($product !== null) {
            $jsonLd[] = $this->productSchema($product, $canonical, $image);
        }

        return [
            'title' => $fullTitle,
            'description' => $description,
            'image' => $image,
            'canonical' => $canonical,
            'robots' => $noindex ? 'noindex, follow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
            'type' => $isArticle ? 'article' : 'website',
            'site' => $siteName,
            'published' => $isArticle ? $published : null,
            'author' => $isArticle ? $author : null,
            'json_ld' => array_map(fn (array $data) => $this->withoutNulls($data), $jsonLd),
        ];
    }

    /**
     * @param  array<string, mixed>  $product
     * @return array<string, mixed>
     */
    protected function productSchema(array $product, string $url, ?string $image): array
    {
        $variants = is_array($product['variants'] ?? null) && $product['variants'] !== [] ? $product['variants'] : [null];
        $basePrice = (float) ($product['sale_price'] ?? $product['price'] ?? 0);

        return [
            '@context' => 'https://schema.org',
            '@type' => 'Product',
            'name' => $product['title'] ?? null,
            'description' => $this->string($product['excerpt'] ?? null),
            'image' => $image,
            'sku' => $product['sku'] ?? null,
            'category' => $product['categories'][0]['name'] ?? null,
            'offers' => array_map(fn ($variant) => [
                '@type' => 'Offer',
                'name' => $variant['name'] ?? null,
                'url' => $url,
                'priceCurrency' => $product['currency'] ?? null,
                'price' => number_format(is_array($variant) ? (float) $variant['price'] : $basePrice, 2, '.', ''),
                'priceValidUntil' => ! is_array($variant) && ! empty($product['sale_ends_at']) ? substr((string) $product['sale_ends_at'], 0, 10) : null,
                'availability' => (is_array($variant) ? ($variant['in_stock'] ?? true) : ($product['in_stock'] ?? true))
                    ? 'https://schema.org/InStock'
                    : 'https://schema.org/OutOfStock',
            ], $variants),
        ];
    }

    protected function string(mixed $value): ?string
    {
        return is_string($value) && trim($value) !== '' ? $value : null;
    }

    /** Link previews need full URLs; stored images are often site-relative. */
    protected function absolute(?string $url): ?string
    {
        if ($url === null) {
            return null;
        }

        return preg_match('#^https?://#i', $url) === 1 ? $url : url($url);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function withoutNulls(array $data): array
    {
        $out = [];
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $value = array_is_list($value) ? array_map(fn ($v) => is_array($v) ? $this->withoutNulls($v) : $v, $value) : $this->withoutNulls($value);
            }
            if ($value !== null && $value !== []) {
                $out[$key] = $value;
            }
        }

        return $out;
    }
}
