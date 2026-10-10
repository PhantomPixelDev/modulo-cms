<?php

use App\Services\PostgresDumpCompatibility;

beforeEach(function () {
    $this->dump = tempnam(sys_get_temp_dir(), 'modulo-dump-');
});

afterEach(function () {
    unlink($this->dump);
});

it('repairs only the PG17 timeout preamble and preserves stored text and byte offsets', function () {
    $sql = "--\n-- PostgreSQL database dump\n--\n\nSET statement_timeout = 0;\nSET transaction_timeout = 0;\nSET row_security = off;\nCOPY example FROM stdin;\nSET transaction_timeout = 0;\n\\.\n";
    file_put_contents($this->dump, $sql);
    (new PostgresDumpCompatibility)->prepare($this->dump, 160015);
    $fixed = file_get_contents($this->dump);
    expect(strlen($fixed))->toBe(strlen($sql))
        ->and($fixed)->toContain("SET row_security = off;\nCOPY example FROM stdin;\nSET transaction_timeout = 0;")
        ->and(substr_count($fixed, 'SET transaction_timeout = 0;'))->toBe(1);
});

it('leaves compatible servers and unrecognized dump headers untouched', function (string $sql, int $version) {
    file_put_contents($this->dump, $sql);
    (new PostgresDumpCompatibility)->prepare($this->dump, $version);
    expect(file_get_contents($this->dump))->toBe($sql);
})->with([
    ['-- custom SQL'."\nSET transaction_timeout = 0;\nSET row_security = off;\n", 160015],
    ["--\n-- PostgreSQL database dump\n--\n\nSET transaction_timeout = 0;\nSET row_security = off;\n", 170011],
    ["--\n-- PostgreSQL database dump\n--\n\nSET transaction_timeout = 0;\n", 160015],
]);
