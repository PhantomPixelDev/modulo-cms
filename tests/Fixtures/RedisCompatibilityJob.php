<?php

namespace Tests\Fixtures;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Cache;
use RuntimeException;

class RedisCompatibilityJob implements ShouldQueue
{
    public int $tries = 3;

    public int $backoff = 0;

    public function __construct(public string $probe) {}

    public function handle(): void
    {
        if (Cache::store('redis')->increment($this->probe.':attempts') < 3) {
            throw new RuntimeException('Transient delivery failure');
        }
        Cache::store('redis')->put($this->probe.':delivered', true, 60);
    }
}
