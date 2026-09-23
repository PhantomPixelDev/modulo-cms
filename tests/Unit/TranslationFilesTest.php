<?php

/**
 * A repeated key in a PHP array literal is not an error: the later value
 * silently wins. In the language files that shipped as the Themes and Media
 * pages showing the word "Description" instead of their descriptions, because
 * a field label further down reused the section's key.
 */
function duplicateArrayKeys(string $file): array
{
    $duplicates = [];
    $stack = [[]];
    $pending = null;

    foreach (token_get_all((string) file_get_contents($file)) as $token) {
        if ($token === '[') {
            $stack[] = [];
            $pending = null;

            continue;
        }

        if ($token === ']') {
            array_pop($stack);
            $pending = null;

            continue;
        }

        if (is_array($token)) {
            if (in_array($token[0], [T_WHITESPACE, T_COMMENT, T_DOC_COMMENT], true)) {
                continue;
            }

            if ($token[0] === T_CONSTANT_ENCAPSED_STRING) {
                $pending = [$token[1], $token[2]];

                continue;
            }

            if ($token[0] === T_DOUBLE_ARROW && $pending !== null) {
                $level = array_key_last($stack);
                [$key, $line] = $pending;

                if (isset($stack[$level][$key])) {
                    $duplicates[] = basename(dirname($file)).'/'.basename($file).":{$line} {$key} (first on line {$stack[$level][$key]})";
                } else {
                    $stack[$level][$key] = $line;
                }
            }
        }

        $pending = null;
    }

    return $duplicates;
}

it('has no duplicate keys in the language files', function () {
    $duplicates = collect(glob(dirname(__DIR__, 2).'/lang/*/*.php'))
        ->flatMap(fn (string $file) => duplicateArrayKeys($file))
        ->all();

    expect($duplicates)->toBe([]);
});
