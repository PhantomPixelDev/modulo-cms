<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminPolicyAccessExtendedTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_user_with_only_access_admin_cannot_visit_feature_indexes_without_specific_permissions()
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->givePermissionTo('access admin');

        // Each should be forbidden (403) without specific view permission
        $this->actingAs($user)->get('/dashboard/admin/templates')->assertStatus(403);
        $this->actingAs($user)->get('/dashboard/admin/themes')->assertStatus(403);
        $this->actingAs($user)->get('/dashboard/admin/menus')->assertStatus(403);
        $this->actingAs($user)->get('/dashboard/admin/taxonomies')->assertStatus(403);
        $this->actingAs($user)->get('/dashboard/admin/taxonomy-terms')->assertStatus(403);
        $this->actingAs($user)->get('/dashboard/admin/post-types')->assertStatus(403);
    }

    public function test_user_with_specific_view_permissions_can_access_corresponding_indexes()
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->givePermissionTo('access admin');
        $user->givePermissionTo('view templates');
        $user->givePermissionTo('view themes');
        $user->givePermissionTo('view menus');
        $user->givePermissionTo('view taxonomies');
        $user->givePermissionTo('view taxonomy terms');
        $user->givePermissionTo('view post types');

        $this->actingAs($user)->get('/dashboard/admin/templates')->assertStatus(200);
        $this->actingAs($user)->get('/dashboard/admin/themes')->assertStatus(200);
        $this->actingAs($user)->get('/dashboard/admin/menus')->assertStatus(200);
        $this->actingAs($user)->get('/dashboard/admin/taxonomies')->assertStatus(200);
        $this->actingAs($user)->get('/dashboard/admin/taxonomy-terms')->assertStatus(200);
        $this->actingAs($user)->get('/dashboard/admin/post-types')->assertStatus(200);
    }

    public function test_admin_role_can_access_all_feature_indexes()
    {
        $admin = User::factory()->create(['email_verified_at' => now()]);
        $admin->assignRole('admin');

        $this->actingAs($admin)->get('/dashboard/admin/templates')->assertStatus(200);
        $this->actingAs($admin)->get('/dashboard/admin/themes')->assertStatus(200);
        $this->actingAs($admin)->get('/dashboard/admin/menus')->assertStatus(200);
        $this->actingAs($admin)->get('/dashboard/admin/taxonomies')->assertStatus(200);
        $this->actingAs($admin)->get('/dashboard/admin/taxonomy-terms')->assertStatus(200);
        $this->actingAs($admin)->get('/dashboard/admin/post-types')->assertStatus(200);
    }
}
