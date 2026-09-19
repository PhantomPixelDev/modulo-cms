<?php

use App\Services\HookRegistry;
use Illuminate\Support\Facades\Schema;

if (! function_exists('modulo_hooks')) {
    function modulo_hooks(): HookRegistry
    {
        return app(HookRegistry::class);
    }
}

if (! function_exists('add_action')) {
    /**
     * Register an action hook. Lower priorities run first.
     */
    function add_action(string $hook, callable $callback, int $priority = 10): void
    {
        modulo_hooks()->addAction($hook, $callback, $priority);
    }
}

if (! function_exists('do_action')) {
    /**
     * Execute an action hook.
     */
    function do_action(string $hook, mixed ...$args): void
    {
        modulo_hooks()->doAction($hook, ...$args);
    }
}

if (! function_exists('add_filter')) {
    /**
     * Register a filter hook. Lower priorities run first.
     */
    function add_filter(string $hook, callable $callback, int $priority = 10): void
    {
        modulo_hooks()->addFilter($hook, $callback, $priority);
    }
}

if (! function_exists('apply_filters')) {
    /**
     * Pass a value through every registered filter for the hook.
     */
    function apply_filters(string $hook, mixed $value, mixed ...$args): mixed
    {
        return modulo_hooks()->applyFilters($hook, $value, ...$args);
    }
}

if (! function_exists('schema_has_table')) {
    /**
     * Memoized Schema::hasTable(); each call is an information_schema query on
     * PostgreSQL and many run on every request. Only positive answers are
     * remembered, so a table created later in the process is still detected.
     */
    function schema_has_table(string $table): bool
    {
        // Scoped to the application instance (one per request), never a PHP static:
        // the database can change between app instances in one process (tests, workers).
        $app = app();
        $known = $app->bound('modulo.schema_tables') ? $app->make('modulo.schema_tables') : [];

        $key = config('database.default').':'.$table;
        if (isset($known[$key])) {
            return true;
        }

        try {
            $exists = Schema::hasTable($table);
        } catch (Throwable $e) {
            // No reachable database (image builds, package:discover, fresh checkouts):
            // behave as "not installed" instead of crashing every artisan command.
            return false;
        }

        if ($exists) {
            $known[$key] = true;
            $app->instance('modulo.schema_tables', $known);
        }

        return $exists;
    }
}
