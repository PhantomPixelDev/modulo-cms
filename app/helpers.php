<?php

use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Schema;

if (! function_exists('add_action')) {
    /**
     * Register an action hook.
     */
    function add_action(string $hook, $callback, int $priority = 0)
    {
        Event::listen("action:{$hook}", $callback, $priority);
    }
}

if (! function_exists('do_action')) {
    /**
     * Execute an action hook.
     */
    function do_action(string $hook, ...$args)
    {
        Event::dispatch("action:{$hook}", $args);
    }
}

if (! function_exists('add_filter')) {
    /**
     * Register a filter hook.
     */
    function add_filter(string $hook, $callback, int $priority = 0)
    {
        Event::listen("filter:{$hook}", $callback, $priority);
    }
}

if (! function_exists('apply_filters')) {
    /**
     * Execute a filter hook.
     */
    function apply_filters(string $hook, $value, ...$args)
    {
        $listeners = Event::getListeners("filter:{$hook}");

        foreach ($listeners as $listener) {
            $value = $listener($value, ...$args);
        }

        return $value;
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
