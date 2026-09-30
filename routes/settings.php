<?php

use App\Http\Controllers\Settings\ApiTokenController;
use App\Http\Controllers\Settings\AppearanceController;
use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\TwoFactorController;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {
    Route::redirect('settings', '/settings/profile');

    // CSRF is disabled for these routes only during tests to avoid 419 errors in feature tests
    $csrfMiddleware = PreventRequestForgery::class;

    $profileEdit = Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    $profileUpdate = Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    $profileDestroy = Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    if (App::environment('testing')) {
        $profileUpdate->withoutMiddleware($csrfMiddleware);
        $profileDestroy->withoutMiddleware($csrfMiddleware);
    }

    $passwordEdit = Route::get('settings/password', [PasswordController::class, 'edit'])->name('password.edit');
    $passwordUpdate = Route::put('settings/password', [PasswordController::class, 'update'])->name('password.update');

    if (App::environment('testing')) {
        $passwordUpdate->withoutMiddleware($csrfMiddleware);
    }

    // Password first, then the page: it shows the secret while setting up.
    Route::middleware('password.confirm')->group(function () {
        Route::get('settings/two-factor', [TwoFactorController::class, 'edit'])->name('two-factor.edit');
        Route::post('settings/two-factor/confirm', [TwoFactorController::class, 'confirm'])->middleware('throttle:6,1')->name('two-factor.confirm');
        Route::post('settings/two-factor', [TwoFactorController::class, 'store'])->name('two-factor.enable');
        Route::post('settings/two-factor/recovery-codes', [TwoFactorController::class, 'regenerateRecoveryCodes'])->middleware('throttle:6,1')->name('two-factor.recovery-codes');
        Route::delete('settings/two-factor', [TwoFactorController::class, 'destroy'])->middleware('throttle:6,1')->name('two-factor.disable');
    });

    // Asked when the page opens, so creating a token does not bounce through it.
    Route::get('settings/api-tokens', [ApiTokenController::class, 'index'])->middleware('password.confirm')->name('api-tokens.index');
    Route::post('settings/api-tokens', [ApiTokenController::class, 'store'])->middleware('password.confirm')->name('api-tokens.store');
    Route::delete('settings/api-tokens/{id}', [ApiTokenController::class, 'destroy'])->whereNumber('id')->name('api-tokens.destroy');

    Route::get('settings/appearance', AppearanceController::class)->name('appearance');
});
