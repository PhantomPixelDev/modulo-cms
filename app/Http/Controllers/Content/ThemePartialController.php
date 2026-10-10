<?php

namespace App\Http\Controllers\Content;

use App\Http\Controllers\Controller;
use App\Models\Locale;
use App\Services\HtmlSanitizer;
use App\Services\ReactTemplateRenderer;
use App\Services\ThemeManager;
use App\Services\ThemePartialFields;
use App\Services\ThemePartialService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ThemePartialController extends Controller
{
    public function index(Request $request, ThemeManager $themes, ThemePartialService $partials): Response|JsonResponse
    {
        $this->authorizeCatalog($request);
        $theme = $themes->getActiveTheme();
        $items = [];
        foreach ($partials->registry($theme) as $name => $partial) {
            $items[] = [
                'name' => $name,
                'label' => $partial['label'],
                'description' => $partial['description'],
                'body' => $partial['body'],
                'defaults' => (object) $partial['defaults'],
                'fields' => $partial['fields'],
            ];
        }

        $data = [
            'adminSection' => 'partials',
            'partialCatalog' => $items,
            'themeName' => $theme?->name,
        ];

        return $request->expectsJson() && ! $request->header('X-Inertia') ? response()->json($data) : Inertia::render('admin/partials/Index', $data);
    }

    private function authorizeCatalog(Request $request): void
    {
        abort_unless($request->user()?->canAny(['view themes', 'create posts', 'edit posts', 'create pages', 'edit pages']), 403);
    }

    public function preview(Request $request, ThemeManager $themes, ThemePartialService $partials, ReactTemplateRenderer $renderer): JsonResponse
    {
        $this->authorizeCatalog($request);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'attributes' => ['present', 'array', 'max:64'],
            'attributes.*' => ['nullable', 'string', 'max:2000'],
            'body' => ['nullable', 'string', 'max:32768'],
            'locale' => ['nullable', 'string', 'max:20'],
        ]);
        $theme = $themes->getActiveTheme();
        $partial = $partials->registry($theme)[$data['name']] ?? null;
        abort_unless($theme && $partial && $theme->template_engine === 'react', 422, __('dashboard.partials.unavailable'));
        abort_unless($renderer->canRender('page'), 422, __('dashboard.partials.preview_unavailable'));
        $attributes = array_merge($partial['defaults'], array_map(fn ($value) => $value ?? '', $data['attributes']));
        foreach (array_keys($attributes) as $name) {
            if ($name === 'name' || ! preg_match('/^[a-z][a-z0-9_-]*$/D', (string) $name)) {
                throw ValidationException::withMessages(['attributes' => __('dashboard.partials.invalid_attributes')]);
            }
        }
        app(ThemePartialFields::class)->validate($partial['fields'], $attributes);
        $locale = $data['locale'] ?? Locale::defaultCode();
        abort_unless(Locale::isValidCode($locale), 422);
        $token = (string) Str::uuid();
        Cache::put('partial-preview:'.$token, [
            'owner' => $request->user()?->id, 'theme' => $theme->id, 'name' => $data['name'],
            'attributes' => $attributes, 'body' => $data['body'] ?? '', 'locale' => $locale,
        ], now()->addMinutes(10));

        return response()->json(['url' => route('dashboard.admin.partials.preview.show', $token)])
            ->header('Cache-Control', 'no-store, private');
    }

    public function showPreview(Request $request, string $token, ThemeManager $themes, ThemePartialService $partials, ReactTemplateRenderer $renderer): \Symfony\Component\HttpFoundation\Response
    {
        $this->authorizeCatalog($request);
        $data = Cache::get('partial-preview:'.$token);
        abort_unless(is_array($data), 410);
        abort_unless($data['owner'] === $request->user()?->id, 404);
        $theme = $themes->getActiveTheme();
        abort_unless($theme?->id === $data['theme'] && isset($partials->registry($theme)[$data['name']]), 409);
        app()->setLocale($data['locale']);
        $opening = '[partial name="'.$data['name'].'"';
        foreach ($data['attributes'] as $name => $value) {
            $opening .= ' '.$name.'="'.e($value).'"';
        }
        $body = app(HtmlSanitizer::class)->sanitize($data['body']);
        $content = $partials->render(app(HtmlSanitizer::class)->sanitize(e($opening.']').$body.'[/partial]'));
        abort_unless($renderer->canRender('page'), 422, __('dashboard.partials.preview_unavailable'));
        $response = $renderer->render('page', ['page' => [
            'id' => 0, 'title' => __('dashboard.partials.preview_title'), 'slug' => '',
            'content' => $content['html'], 'content_partials' => $content['partials'],
            'published_at' => '', 'updated_at' => '', 'seo' => ['noindex' => true],
        ]])->toResponse($request);
        $response->headers->set('X-Robots-Tag', 'noindex, nofollow');
        $response->headers->set('Cache-Control', 'no-store, private');

        return $response;
    }
}
