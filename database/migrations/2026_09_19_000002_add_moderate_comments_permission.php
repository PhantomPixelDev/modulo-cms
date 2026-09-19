<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * New admin Comments section. Existing installs get the permission for the
 * roles that already moderate content; the seeder covers fresh installs.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! schema_has_table('permissions') || ! schema_has_table('roles')) {
            return;
        }

        $permission = Permission::findOrCreate('moderate comments', 'web');

        Role::whereIn('name', ['super-admin', 'admin', 'moderator'])->where('guard_name', 'web')->get()
            ->each(fn (Role $role) => $role->givePermissionTo($permission));

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        Permission::where('name', 'moderate comments')->where('guard_name', 'web')->delete();
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
