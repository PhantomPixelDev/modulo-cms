<?php

use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\App;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {
    Route::redirect('settings', '/settings/profile');

    // CSRF is disabled for these routes only during tests to avoid 419 errors in feature tests
    $csrfMiddleware = class_exists(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)
        ? \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class
        : (class_exists(\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class)
            ? \Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class
            : null);

    $profileEdit = Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    $profileUpdate = Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    $profileDestroy = Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    if (App::environment('testing') && $csrfMiddleware) {
        $profileUpdate->withoutMiddleware($csrfMiddleware);
        $profileDestroy->withoutMiddleware($csrfMiddleware);
    }

    $passwordEdit = Route::get('settings/password', [PasswordController::class, 'edit'])->name('password.edit');
    $passwordUpdate = Route::put('settings/password', [PasswordController::class, 'update'])->name('password.update');

    if (App::environment('testing') && $csrfMiddleware) {
        $passwordUpdate->withoutMiddleware($csrfMiddleware);
    }

    Route::get('settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->name('appearance');
});
