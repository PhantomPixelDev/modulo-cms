<?php

use App\Services\HookRegistry;

it('passes a value through filters in priority order', function () {
    add_filter('site_name', fn (string $name) => $name.' B', 20);
    add_filter('site_name', fn (string $name) => $name.' A', 10);

    // Used to throw ArgumentCountError: the event listener wrapper needs two arguments
    expect(apply_filters('site_name', 'Modulo'))->toBe('Modulo A B');
});

it('passes extra arguments to filters', function () {
    add_filter('format_price', fn (float $price, string $currency) => "{$currency}{$price}");

    expect(apply_filters('format_price', 9.5, 'EUR'))->toBe('EUR9.5');
});

it('returns the value untouched when no filter is registered', function () {
    expect(apply_filters('unregistered_hook', 'value'))->toBe('value');
});

it('runs actions in priority order with their arguments', function () {
    $calls = [];
    add_action('cms_booted', function (string $who) use (&$calls) {
        $calls[] = "second:{$who}";
    }, 20);
    add_action('cms_booted', function (string $who) use (&$calls) {
        $calls[] = "first:{$who}";
    }, 5);

    do_action('cms_booted', 'tester');

    expect($calls)->toBe(['first:tester', 'second:tester']);
});

it('reports registered hooks', function () {
    $hooks = app(HookRegistry::class);
    expect($hooks->hasFilter('nope'))->toBeFalse()
        ->and($hooks->hasAction('nope'))->toBeFalse();

    add_filter('nope', fn ($v) => $v);
    expect($hooks->hasFilter('nope'))->toBeTrue();
});
