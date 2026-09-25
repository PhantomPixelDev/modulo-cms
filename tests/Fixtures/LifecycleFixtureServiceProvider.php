<?php

namespace Plugins\LifecycleFixture;

use App\Plugins\BasePluginServiceProvider;
use RuntimeException;

/**
 * Records every lifecycle hook the plugin manager calls, so tests can check
 * which ran and with what. Loaded by hand: it lives outside plugins/.
 */
class LifecycleFixtureServiceProvider extends BasePluginServiceProvider
{
    /** @var array<int, array{0: string, 1: array<int, mixed>}> */
    public static array $calls = [];

    public static bool $failActivation = false;

    public function onActivate(): void
    {
        if (self::$failActivation) {
            throw new RuntimeException('activation refused by the plugin');
        }

        self::$calls[] = ['onActivate', []];
    }

    public function onDeactivate(): void
    {
        self::$calls[] = ['onDeactivate', []];
    }

    public function onUninstall(bool $deleteData): void
    {
        self::$calls[] = ['onUninstall', [$deleteData]];
    }

    public function onUpgrade(string $from, string $to): void
    {
        self::$calls[] = ['onUpgrade', [$from, $to]];
    }
}
