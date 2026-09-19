<?php

use App\Services\HtmlSanitizer;

function sanitizeHtml(string $html): string
{
    return (new HtmlSanitizer)->sanitize($html);
}

it('keeps safe formatting markup', function () {
    $html = '<p>Hello <strong>world</strong> <a href="https://example.com" title="x">link</a></p>';

    expect(sanitizeHtml($html))->toBe($html);
});

it('returns plain text unchanged', function () {
    expect(sanitizeHtml('Just text & [contact_form]'))->toBe('Just text & [contact_form]');
});

it('removes script and style elements with their content', function () {
    $out = sanitizeHtml('<p>ok</p><script>alert(1)</script><style>body{}</style>');

    expect($out)->toBe('<p>ok</p>')
        ->not->toContain('alert');
});

it('strips event handler attributes', function () {
    $out = sanitizeHtml('<img src="/a.png" onerror="alert(1)"><p onclick="x()">t</p>');

    expect($out)->not->toContain('onerror')
        ->not->toContain('onclick')
        ->toContain('src="/a.png"');
});

it('drops javascript and data urls, including obfuscated ones', function (string $href) {
    $out = sanitizeHtml('<a href="'.$href.'">x</a>');

    expect($out)->toBe('<a>x</a>');
})->with([
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    "java\tscript:alert(1)",
    'javascript&#58;alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
]);

it('keeps relative, mailto and tel urls', function (string $href) {
    expect(sanitizeHtml('<a href="'.$href.'">x</a>'))->toContain('href=');
})->with(['/about', '#top', 'page.html', 'mailto:a@b.c', 'tel:+123', '//cdn.example.com/x']);

it('forces rel noopener on target blank links', function () {
    expect(sanitizeHtml('<a href="https://x.test" target="_blank">x</a>'))
        ->toContain('rel="noopener noreferrer"');
});

it('only keeps iframes from allowed embed providers', function () {
    $yt = sanitizeHtml('<iframe src="https://www.youtube.com/embed/abc"></iframe>');
    $evil = sanitizeHtml('<iframe src="https://evil.test/"></iframe><p>t</p>');

    expect($yt)->toContain('youtube.com/embed/abc')
        ->and($evil)->toBe('<p>t</p>');
});

it('unwraps unknown elements but keeps their text', function () {
    expect(sanitizeHtml('<custom-el><b>bold</b></custom-el>'))->toBe('<b>bold</b>');
});

it('removes svg payloads and comments', function () {
    $out = sanitizeHtml('<svg onload="alert(1)"><circle/></svg><!-- secret --><p>t</p>');

    expect($out)->toBe('<p>t</p>');
});

it('preserves utf-8 text', function () {
    expect(sanitizeHtml('<p>Ünïcödé — 日本語</p>'))->toBe('<p>Ünïcödé — 日本語</p>');
});
