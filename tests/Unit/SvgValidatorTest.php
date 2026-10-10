<?php

use App\Services\SvgValidator;

it('accepts static UTF-8 SVG including XML-decoded safe attributes', function () {
    expect((new SvgValidator)->isSafe('<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg"><title>Café</title><path fill="url(#paint)" /></svg>'))->toBeTrue();
});

it('refuses alternate encodings and declarations before XML parsing', function (string $svg) {
    expect((new SvgValidator)->isSafe($svg))->toBeFalse();
})->with([
    'internal subset' => '<!DOCTYPE svg [<!ENTITY title "sample">]><svg xmlns="http://www.w3.org/2000/svg"><title>&title;</title></svg>',
    'external subset' => '<!DOCTYPE svg SYSTEM "https://example.test/svg.dtd"><svg xmlns="http://www.w3.org/2000/svg"/>',
    'UTF-16' => "\xFF\xFE".mb_convert_encoding('<svg xmlns="http://www.w3.org/2000/svg"/>', 'UTF-16LE', 'UTF-8'),
    'alternate declared encoding' => '<?xml version="1.0" encoding="UTF-7"?><svg xmlns="http://www.w3.org/2000/svg"/>',
    'invalid UTF-8' => '<svg xmlns="http://www.w3.org/2000/svg"><title>'."\xFF".'</title></svg>',
]);
