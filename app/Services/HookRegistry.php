<?php

namespace App\Services;

/**
 * WordPress-style action and filter hooks for plugins.
 *
 * This used to be layered on Illuminate\Events: filters called the wrapped
 * listener with the wrong signature (an ArgumentCountError as soon as a filter
 * was applied) and the $priority argument was silently ignored.
 */
class HookRegistry
{
    /** @var array<string, array<int, list<callable>>> */
    protected array $actions = [];

    /** @var array<string, array<int, list<callable>>> */
    protected array $filters = [];

    public function addAction(string $hook, callable $callback, int $priority = 10): void
    {
        $this->actions[$hook][$priority][] = $callback;
    }

    public function doAction(string $hook, mixed ...$args): void
    {
        foreach ($this->callbacksFor($this->actions, $hook) as $callback) {
            $callback(...$args);
        }
    }

    public function addFilter(string $hook, callable $callback, int $priority = 10): void
    {
        $this->filters[$hook][$priority][] = $callback;
    }

    /**
     * Run $value through every filter for $hook, lowest priority first.
     */
    public function applyFilters(string $hook, mixed $value, mixed ...$args): mixed
    {
        foreach ($this->callbacksFor($this->filters, $hook) as $callback) {
            $value = $callback($value, ...$args);
        }

        return $value;
    }

    public function hasAction(string $hook): bool
    {
        return ! empty($this->actions[$hook]);
    }

    public function hasFilter(string $hook): bool
    {
        return ! empty($this->filters[$hook]);
    }

    /**
     * @param  array<string, array<int, list<callable>>>  $hooks
     * @return list<callable>
     */
    protected function callbacksFor(array $hooks, string $hook): array
    {
        if (empty($hooks[$hook])) {
            return [];
        }

        $byPriority = $hooks[$hook];
        ksort($byPriority);

        return array_merge(...array_values($byPriority));
    }
}
