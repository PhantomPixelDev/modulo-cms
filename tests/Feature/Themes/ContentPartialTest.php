<?php

use App\Models\Theme;
use App\Presenters\PostPresenter;
use App\Services\ThemePartialService;
use App\Services\ThemeValidator;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia;

beforeEach(fn () => activateReactTheme());

it('exposes opted-in modules on public pages without exposing structural partials', function () {
    $page = makePublishedPage(['slug' => 'modules', 'content' => '[partial name="callout" title="Hello world" tone="success"]<p>Useful text</p>[/partial]']);
    $this->get('/modules')->assertOk()->assertInertia(fn (AssertableInertia $response) => $response
        ->has('page.content_partials', 1)
        ->where('page.content_partials.0.name', 'callout')
        ->where('page.content_partials.0.attributes.title', 'Hello world')
        ->where('page.content_partials.0.attributes.tone', 'success')
        ->where('page.content_partials.0.component', 'modern-react/components/partials/Callout.tsx'));
    $result = app(ThemePartialService::class)->render('[partial name="navigation"]Fallback[/partial]');
    expect($result)->toBe(['html' => 'Fallback', 'partials' => []]);
});

it('renders Slate module attributes and sanitizes author body without accepting forged markers', function () {
    $page = makePublishedPage(['content' => json_encode([
        ['type' => 'paragraph', 'children' => [['text' => '[partial name="callout" title="Two words"]Body[/partial]']]],
    ])]);
    $presented = app(PostPresenter::class)->presentPost($page);
    expect($presented['content_partials'][0]['attributes']['title'])->toBe('Two words')
        ->and($presented['content'])->not->toStartWith('<p>');
    $page->content = '<div data-modulo-partial="forged">[partial name="callout"]<script>alert(1)</script><img src="javascript:x" onerror="oops"><b>Safe</b>[/partial]</div>';
    $presented = app(PostPresenter::class)->presentPost($page);
    expect($presented['content'])->not->toContain('forged', '<script', 'onerror', 'javascript:')
        ->and($presented['content_partials'][0]['html'])->toContain('<b>Safe</b>');
});

it('keeps nested modules and leaves code examples literal', function () {
    $result = app(ThemePartialService::class)->render('[partial name="callout"]Outer[partial name="disclosure" title="More"]Inner[/partial]<code>[partial name="callout" /]</code>[/partial]');
    expect($result['partials'])->toHaveCount(2)
        ->and($result['partials'][1]['html'])->toContain('data-modulo-partial', '<code>[partial name="callout" /]</code>');
    expect(app(ThemePartialService::class)->render('[partial name="missing"]Keep me[/partial]'))
        ->toBe(['html' => 'Keep me', 'partials' => []]);
});

it('inherits bundled parent modules for a runtime child and can disable an inherited module', function () {
    $parent = Theme::where('slug', 'modern-react')->firstOrFail();
    $child = Theme::create([
        'name' => 'Child', 'slug' => 'partial-child', 'directory_path' => 'partial-child',
        'version' => '1.0.0', 'parent_theme_id' => $parent->id, 'partials' => [],
    ]);
    $service = app(ThemePartialService::class);
    expect($service->registry($child)['callout']['component'])->toBe('modern-react/components/partials/Callout.tsx');
    $child->partials = ['callout' => ['shortcode' => false]];
    expect($service->registry($child))->not->toHaveKey('callout');
    $child->partials = ['callout' => ['component' => '../../pages/admin.tsx', 'shortcode' => true]];
    expect($service->registry($child))->not->toHaveKey('callout');
});

it('rejects invalid manifest module paths and non-string defaults', function () {
    $config = json_decode(file_get_contents(resource_path('themes/modern-react/theme.json')), true);
    $config['partials']['unsafe'] = ['component' => '../secrets.tsx', 'shortcode' => true];
    $config['partials']['callout']['defaults'] = ['title' => ['unsafe']];
    $validator = app(ThemeValidator::class);
    expect($validator->validate($config, resource_path('themes/modern-react')))->toBeFalse()
        ->and(implode(' ', $validator->getErrors()))->toContain('Invalid content partial', 'string values');
});

it('skips partial rendering on archive cards', function () {
    $page = makePublishedPage(['content' => '[partial name="callout"]Body[/partial]']);
    expect(app(PostPresenter::class)->presentPost($page, full: false)['content_partials'])->toBe([]);
});

it('caps modules and retains the remaining fallback body', function () {
    $result = app(ThemePartialService::class)->render(str_repeat('[partial name="callout"]Body[/partial]', 102));
    expect($result['partials'])->toHaveCount(100)
        ->and($result['html'])->toEndWith('BodyBody');
});

it('uses translated modules in signed non-indexable previews without changing saved content', function () {
    $page = makePublishedPage(['content' => 'English body']);
    $page->setTranslation('es', [
        'title' => 'Página', 'slug' => 'pagina',
        'content' => '[partial name="callout" title="Información"]Texto traducido[/partial]',
    ]);
    $url = URL::temporarySignedRoute('content.preview', now()->addMinutes(10), ['postId' => $page->id, 'locale' => 'es']);
    $this->get($url)->assertOk()->assertHeader('X-Robots-Tag', 'noindex, nofollow')
        ->assertInertia(fn (AssertableInertia $response) => $response
            ->where('page.content_partials.0.attributes.title', 'Información')
            ->where('page.seo.noindex', true));
    expect($page->fresh()->content)->toBe('English body');
});
