<?php

namespace Tests;

use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Spatie\Permission\PermissionRegistrar;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    protected function setUp(): void
    {
        parent::setUp();

        // Render Inertia pages without requiring a Vite build or dev server
        $this->withoutVite();

        // Ensure Spatie permissions are not served from a stale cache between tests/runs.
        if (class_exists(PermissionRegistrar::class)) {
            app(PermissionRegistrar::class)->forgetCachedPermissions();
        }

        // Disable only the request forgery (CSRF) middleware for tests
        $this->withoutMiddleware(PreventRequestForgery::class);
    }
}
