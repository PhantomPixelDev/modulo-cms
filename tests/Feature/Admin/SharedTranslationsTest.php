<?php

use App\Services\TranslationService;
use Tests\TestCase;

function inertiaVisit(TestCase $test, string $version, array $loadedOnce = [])
{
    return $test->get(route('dashboard'), array_filter([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => $version,
        'X-Inertia-Except-Once-Props' => implode(',', $loadedOnce),
    ]));
}

it('sends admin translations once and skips them while the browser has them', function () {
    $this->actingAs(makeAdminUserWithPermissions());

    $first = $this->get(route('dashboard'))->assertOk();
    $page = $first->viewData('page');
    $key = collect($page['onceProps'] ?? [])->search(fn ($once) => $once['prop'] === 'translations');

    expect($page['props']['translations'])->not->toBeEmpty()
        ->and($key)->toStartWith('translations.');

    $again = inertiaVisit($this, (string) $page['version'], [$key])->assertOk()->json();
    expect($again['props'])->not->toHaveKey('translations');

    // An edit changes the key, so a browser holding the old copy is sent the new one.
    app(TranslationService::class)->clearCache();

    $afterEdit = inertiaVisit($this, (string) $page['version'], [$key])->assertOk()->json();
    expect($afterEdit['props'])->toHaveKey('translations');
});
