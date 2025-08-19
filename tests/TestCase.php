<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Tests\CreatesApplication;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    protected function setUp(): void
    {
        parent::setUp();
        // Disable only the CSRF middleware for tests (support Laravel 10/11)
        if (class_exists(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)) {
            $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class);
        }
        if (class_exists(VerifyCsrfToken::class)) {
            $this->withoutMiddleware(VerifyCsrfToken::class);
        }
    }
}
