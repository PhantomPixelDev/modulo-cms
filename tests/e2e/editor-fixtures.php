<?php

use App\Models\Locale;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;

// CLI-only fixtures for the isolated browser-test database, after installation.
if (getenv('MODULO_E2E_FIXTURES') !== 'true') {
    throw new RuntimeException('Browser fixtures require explicit opt-in.');
}
require dirname(__DIR__, 2).'/vendor/autoload.php';
$app = require dirname(__DIR__, 2).'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
if ($app->environment('production')) {
    throw new RuntimeException('Browser fixtures cannot run in production.');
}
$user = User::updateOrCreate(['email' => 'e2e-writer@example.test'], [
    'name' => 'Browser writer', 'password' => Hash::make('a-sufficiently-long-password'),
]);
$user->forceFill(['email_verified_at' => now()])->save();
$user->syncPermissions(['access admin', 'view posts', 'create posts', 'edit posts']);
Locale::updateOrCreate(['code' => 'es'], [
    'name' => 'Spanish', 'native_name' => 'Español', 'direction' => 'ltr', 'is_active' => true, 'is_default' => false,
]);
Cache::forget('locales:active');
