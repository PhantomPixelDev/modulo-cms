<?php

use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\TwoFactorController;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {
    Route::redirect('settings', '/settings/profile');

    // CSRF is disabled for these routes only during tests to avoid 419 errors in feature tests
    $csrfMiddleware = class_exists(ValidateCsrfToken::class)
        ? ValidateCsrfToken::class
        : (class_exists(VerifyCsrfToken::class)
            ? VerifyCsrfToken::class
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

    Route::get('settings/two-factor', [TwoFactorController::class, 'edit'])->name('two-factor.edit');
    Route::post('settings/two-factor/confirm', [TwoFactorController::class, 'confirm'])->name('two-factor.confirm');
    Route::middleware('password.confirm')->group(function () {
        Route::post('settings/two-factor', [TwoFactorController::class, 'store'])->name('two-factor.enable');
        Route::post('settings/two-factor/recovery-codes', [TwoFactorController::class, 'regenerateRecoveryCodes'])->name('two-factor.recovery-codes');
        Route::delete('settings/two-factor', [TwoFactorController::class, 'destroy'])->name('two-factor.disable');
    });

    Route::get('settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->name('appearance');
});
