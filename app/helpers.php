<?php

use Illuminate\Support\Facades\Event;

if (!function_exists('add_action')) {
    /**
     * Register an action hook.
     */
    function add_action(string $hook, $callback, int $priority = 0)
    {
        Event::listen("action:{$hook}", $callback, $priority);
    }
}

if (!function_exists('do_action')) {
    /**
     * Execute an action hook.
     */
    function do_action(string $hook, ...$args)
    {
        Event::dispatch("action:{$hook}", $args);
    }
}

if (!function_exists('add_filter')) {
    /**
     * Register a filter hook.
     */
    function add_filter(string $hook, $callback, int $priority = 0)
    {
        Event::listen("filter:{$hook}", $callback, $priority);
    }
}

if (!function_exists('apply_filters')) {
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
