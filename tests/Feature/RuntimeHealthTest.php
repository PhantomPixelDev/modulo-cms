<?php

use App\Services\RuntimeHealth;
use Illuminate\Support\Facades\Cache;

it('checks web dependencies independently of missing background services', function () {
    config(['queue.default' => 'redis']);
    $health = app(RuntimeHealth::class);
    expect($health->readiness())->toBe(['database' => true, 'cache' => true])
        ->and($health->backgroundStatus('queue'))->toBe('missing')
        ->and($health->backgroundStatus('scheduler'))->toBe('missing');
    $this->get('/health')->assertOk()->assertJsonPath('checks.cache', true);
});

it('distinguishes fresh stale and inline processing', function () {
    config(['queue.default' => 'redis']);
    $health = app(RuntimeHealth::class);
    $health->heartbeat('queue');
    $health->heartbeat('scheduler');
    expect($health->backgroundStatus('queue'))->toBe('active')->and($health->backgroundStatus('scheduler'))->toBe('active');
    $this->travel(181)->seconds();
    expect($health->backgroundStatus('queue'))->toBe('stale');
    config(['queue.default' => 'sync']);
    expect($health->backgroundStatus('queue'))->toBe('inline');
});

it('does not reuse or leave behind a shared cache probe key', function () {
    Cache::put('health:ping', 'another request');
    $health = app(RuntimeHealth::class);
    expect($health->readiness()['cache'])->toBeTrue()->and($health->readiness()['cache'])->toBeTrue()
        ->and(Cache::get('health:ping'))->toBe('another request');
});
