<?php

use Illuminate\Session\CacheBasedSessionHandler;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Tests\Fixtures\RedisCompatibilityJob;

beforeEach(function () {
    if (getenv('MODULO_REDIS_TESTS') !== 'true') {
        $this->markTestSkipped('Requires the explicitly enabled isolated Redis service.');
    }
    expect(app()->environment('testing'))->toBeTrue();
});

it('supports cache expiry, sessions and mutually exclusive locks', function () {
    $key = 'compat:'.Str::uuid();
    $cache = Cache::store('redis');
    $session = new CacheBasedSessionHandler($cache, 1);
    try {
        $cache->put($key, 'cached value', 60);
        expect($cache->get($key))->toBe('cached value');
        $session->write($key.':session', '{"user_id":42}');
        expect($session->read($key.':session'))->toBe('{"user_id":42}');
        $lock = $cache->lock($key.':lock', 10);
        expect($lock->get())->toBeTrue();
        expect($cache->lock($key.':lock', 10)->get())->toBeFalse();
        $lock->release();
        $next = $cache->lock($key.':lock', 10);
        expect($next->get())->toBeTrue();
        $next->release();
    } finally {
        $cache->forget($key);
        $session->destroy($key.':session');
    }
});

it('processes queued delivery with retries without duplicating the final result', function () {
    $probe = 'compat:'.Str::uuid();
    // The test itself runs in RefreshDatabase's transaction; this explicitly
    // tests the Redis transport while other tests cover after-commit dispatch.
    config(['queue.connections.redis.after_commit' => false]);
    $queue = Queue::connection('redis');
    try {
        $queue->push(new RedisCompatibilityJob($probe), '', $probe);
        expect($queue->size($probe))->toBe(1);
        for ($attempt = 0; $attempt < 3; $attempt++) {
            Artisan::call('queue:work', ['connection' => 'redis', '--queue' => $probe, '--once' => true, '--sleep' => 0, '--tries' => 3]);
        }
        expect((int) Cache::store('redis')->get($probe.':attempts'))->toBe(3);
        expect(Cache::store('redis')->get($probe.':delivered'))->toBeTrue();
        expect($queue->size($probe))->toBe(0);
    } finally {
        $queue->clear($probe);
        Cache::store('redis')->forget($probe.':attempts');
        Cache::store('redis')->forget($probe.':delivered');
    }
});
