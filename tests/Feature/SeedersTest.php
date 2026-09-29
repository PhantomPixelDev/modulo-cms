<?php

use Database\Seeders\BootstrapSeeder;
use Database\Seeders\DemoContentSeeder;
use Database\Seeders\LocaleSeeder;
use Database\Seeders\RolePermissionSeeder;
use Database\Seeders\SiteSettingsSeeder;
use Illuminate\Support\Facades\DB;

it('seeds bootstrap data correctly', function () {
    $this->artisan('db:seed', ['--class' => BootstrapSeeder::class]);

    expect(DB::table('roles')->where('name', 'super-admin')->exists())->toBeTrue()
        ->and(DB::table('roles')->where('name', 'admin')->exists())->toBeTrue()
        ->and(DB::table('roles')->where('name', 'editor')->exists())->toBeTrue()
        ->and(DB::table('roles')->where('name', 'moderator')->exists())->toBeTrue()
        ->and(DB::table('locales')->where('code', 'en')->exists())->toBeTrue()
        ->and(DB::table('post_types')->where('name', 'page')->exists())->toBeTrue()
        ->and(DB::table('post_types')->where('name', 'post')->exists())->toBeTrue()
        ->and(DB::table('site_settings')->exists())->toBeTrue();
});

it('seeds roles and permissions correctly', function () {
    $this->artisan('db:seed', ['--class' => RolePermissionSeeder::class]);

    $superAdmin = DB::table('roles')->where('name', 'super-admin')->first();
    expect($superAdmin)->not->toBeNull();

    $admin = DB::table('roles')->where('name', 'admin')->first();
    expect($admin)->not->toBeNull();

    $permissions = DB::table('role_has_permissions')
        ->where('role_id', $superAdmin->id)
        ->count();
    expect($permissions)->toBeGreaterThan(0);
});

it('seeds locales correctly', function () {
    $this->artisan('db:seed', ['--class' => LocaleSeeder::class]);

    expect(DB::table('locales')->where('code', 'en')->exists())->toBeTrue()
        ->and(DB::table('locales')->where('is_default', true)->exists())->toBeTrue();
});

it('seeds site settings correctly', function () {
    $this->artisan('db:seed', ['--class' => SiteSettingsSeeder::class]);

    expect(DB::table('site_settings')->exists())->toBeTrue();
});

it('seeds demo content correctly', function () {
    $this->artisan('db:seed', ['--class' => BootstrapSeeder::class]);
    $this->artisan('db:seed', ['--class' => DemoContentSeeder::class]);

    expect(DB::table('posts')->count())->toBeGreaterThan(0)
        ->and(DB::table('post_types')->count())->toBeGreaterThan(0);
});
