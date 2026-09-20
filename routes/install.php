<?php

use App\Http\Controllers\Install\InstallController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Installer
|--------------------------------------------------------------------------
|
| Registered before web.php so the front-end catch-all cannot swallow these,
| and gated by the `install.guard` alias, which returns 404 once the site has
| been set up. `install` is also listed in config/routes.php reserved slugs so
| a page cannot be given that slug.
|
*/

Route::middleware('install.guard')->prefix('install')->name('install.')->group(function () {
    Route::get('/', [InstallController::class, 'show'])->name('show');
    Route::get('/requirements', [InstallController::class, 'requirements'])->name('requirements');
    Route::post('/migrate', [InstallController::class, 'migrate'])->name('migrate');
    Route::post('/administrator', [InstallController::class, 'createAdministrator'])->name('administrator');
    Route::post('/configure', [InstallController::class, 'configure'])->name('configure');
    Route::post('/finish', [InstallController::class, 'finish'])->name('finish');
});
