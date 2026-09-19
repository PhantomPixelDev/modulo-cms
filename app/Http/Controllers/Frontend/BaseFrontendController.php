<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use App\Presenters\PostPresenter;
use App\Services\FrontendTemplateResolver;
use App\Services\ReactTemplateRenderer;
use Inertia\Inertia;

abstract class BaseFrontendController extends Controller
{
    public function __construct(
        protected ReactTemplateRenderer $reactRenderer,
        protected FrontendTemplateResolver $templateResolver,
        protected PostPresenter $postPresenter
    ) {}

    protected function getPerPage(): int
    {
        return (int) SiteSetting::get('posts_per_page', 10);
    }

    protected function shouldUseReact(): bool
    {
        return $this->reactRenderer->isReactTheme();
    }

    protected function requireReactTheme()
    {
        if (!$this->shouldUseReact()) {
            return Inertia::render('Setup/ThemeMissing', [
                'message' => 'No active React theme detected. Install and activate a React theme to render the public site.',
            ]);
        }

        return null;
    }

    protected function renderContent($content, $template, $dataKey)
    {
        if ($resp = $this->requireReactTheme()) {
            return $resp;
        }

        if (!$content) {
            abort(404);
        }

        try {
            // Query-builder increment: doesn't touch updated_at or fire model events
            \App\Models\Post::whereKey($content->id)->toBase()->increment('view_count');
        } catch (\Throwable $e) {}

        // Comments are never cached with the post; always load fresh so new ones show immediately
        // (load(), not loadMissing(): in-memory cache stores may hand back the same instance)
        $content->load(['allComments.user']);

        $templateName = $template;
        try {
            if ($templateName === 'post' && $content instanceof \App\Models\Post) {
                $prefix = $content->postType?->route_prefix;
                $prefix = ($prefix === null || $prefix === '' || $prefix === '/') ? null : ltrim((string) $prefix, '/');
                if ($prefix) {
                    $candidate = $prefix . '-single';
                    if ($this->reactRenderer->canRender($candidate)) {
                        $templateName = $candidate;
                    }
                }
            }
        } catch (\Throwable $e) {
            // Silent fallback to default template
        }

        if (!$this->reactRenderer->canRender($templateName)) {
            abort(500, "React template not found: {$templateName}");
        }

        return $this->reactRenderer->render($templateName, [
            $dataKey => $this->postPresenter->presentPost($content),
        ]);
    }
}
