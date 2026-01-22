<?php

namespace App\Services;

use App\Models\PostType;
use App\Services\ReactTemplateRenderer;

class FrontendTemplateResolver
{
    protected ReactTemplateRenderer $reactRenderer;

    public function __construct(ReactTemplateRenderer $reactRenderer)
    {
        $this->reactRenderer = $reactRenderer;
    }

    public function indexTemplate(): string
    {
        return 'index';
    }

    public function taxonomyTemplate(): string
    {
        return $this->reactRenderer->canRender('taxonomy') ? 'taxonomy' : 'archive';
    }

    public function searchTemplate(): string
    {
        return 'search';
    }

    public function singlePostTemplate(): string
    {
        return 'post';
    }

    public function pageTemplate(): string
    {
        return 'page';
    }

    public function postsIndexTemplate(?PostType $postType): string
    {
        if ($postType && !empty($postType->route_prefix)) {
            $candidate = ltrim((string) $postType->route_prefix, '/');
            if ($candidate !== '' && $this->reactRenderer->canRender($candidate)) {
                return $candidate;
            }
        }

        return 'posts';
    }
}
