<?php

namespace App\Services;

use RuntimeException;

class PostgresDumpCompatibility
{
    /** Repair the PG17 client's default preamble when restoring to PG16. */
    public function prepare(string $dump, int $serverVersion): void
    {
        if ($serverVersion >= 170000) {
            return;
        }

        $stream = fopen($dump, 'r+b');
        if ($stream === false) {
            throw new RuntimeException('Cannot read the PostgreSQL dump.');
        }

        try {
            $prefix = fread($stream, 16384);
            if ($prefix === false || ! str_starts_with($prefix, "--\n-- PostgreSQL database dump\n--\n")) {
                return;
            }
            $end = strpos($prefix, "\nSET row_security = off;\n");
            if ($end === false) {
                return;
            }
            $header = substr($prefix, 0, $end + 1);
            $statement = "\nSET transaction_timeout = 0;\n";
            // Preserve byte offsets and never search/replace content or SQL bodies.
            $fixed = str_replace($statement, "\n".str_repeat(' ', strlen($statement) - 2)."\n", $header);
            if ($fixed !== $header) {
                rewind($stream);
                if (fwrite($stream, $fixed) !== strlen($fixed)) {
                    throw new RuntimeException('Cannot prepare the PostgreSQL dump.');
                }
            }
        } finally {
            fclose($stream);
        }
    }
}
