<?php

use App\Services\ShortcodeService;

it('parses quoted spaces, empty values, encoded quotes and unquoted urls', function () {
    $service = new ShortcodeService;
    $service->register('probe', fn ($attrs, $body) => json_encode([$attrs, $body]));
    $result = json_decode($service->parse('[probe title=&quot;Two words ] here&quot; empty="" url=https://example.com/a]body[/probe]'), true);
    expect($result)->toBe([['title' => 'Two words ] here', 'empty' => '', 'url' => 'https://example.com/a'], 'body']);
});

it('balances nested same tags and self-closing shortcodes', function () {
    $service = new ShortcodeService;
    $service->register('wrap', fn ($attrs, $body) => '{'.$body.'}');
    expect($service->parse('[wrap]a[wrap]b[/wrap][wrap /]c[/wrap]'))->toBe('{a{b}{}c}');
});

it('leaves code examples literal even inside paired shortcodes', function () {
    $service = new ShortcodeService;
    $service->register('wrap', fn ($attrs, $body) => '{'.$body.'}');
    expect($service->parse('[wrap]<pre><code>[wrap]example[/wrap]</code></pre>[/wrap]'))
        ->toBe('{<pre><code>[wrap]example[/wrap]</code></pre>}');
});

it('preserves unknown syntax and plugin registration while expanding nested handlers', function () {
    $service = new ShortcodeService;
    $service->register('shop_test', fn ($attrs, $body) => 'plugin');
    expect($service->parse('[unknown][shop_test /][/unknown]'))->toBe('[unknown]plugin[/unknown]');
    expect($service->parseWith('[shop_test /][local /]', ['local' => fn () => 'local']))->toBe('[shop_test /]local');
    expect($service->parse('[shop_test /]'))->toBe('plugin');
});

it('does not expand shortcodes inside HTML attributes', function () {
    $service = new ShortcodeService;
    $service->register('wrap', fn () => 'expanded');
    $html = '<a title="example > [wrap /]">[wrap /]</a>';
    expect($service->parse($html))->toBe('<a title="example > [wrap /]">expanded</a>');
});
