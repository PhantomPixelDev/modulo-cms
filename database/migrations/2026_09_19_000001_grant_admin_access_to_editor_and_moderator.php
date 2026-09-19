<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Editors and moderators have post permissions but could not reach the admin
 * area, which requires "access admin". Fix existing installs; the seeder
 * covers fresh ones.
 */
return new class extends Migration
{
    public function up(): void
    {
        $permission = Permission::where('name', 'access admin')->where('guard_name', 'web')->first();
        if (!$permission) {
            return;
        }

        Role::whereIn('name', ['editor', 'moderator'])->where('guard_name', 'web')->get()
            ->each(fn (Role $role) => $role->givePermissionTo($permission));

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        // Intentionally left in place; revoking would lock these roles out again.
    }
};
