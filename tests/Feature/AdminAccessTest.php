<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_guest_is_redirected_from_admin()
    {
        $response = $this->get('/dashboard/admin/users');
        $response->assertStatus(302); // redirect to login
    }

    public function test_unverified_user_is_redirected_from_admin()
    {
        $user = User::factory()->create(); // email not verified

        $response = $this->actingAs($user)->get('/dashboard/admin/users');
        $response->assertStatus(302); // should redirect to email verification
    }

    public function test_authenticated_user_without_access_admin_gets_403()
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);
        // no roles/permissions

        $response = $this->actingAs($user)->get('/dashboard/admin/users');
        $response->assertStatus(403);
    }

    public function test_user_with_access_admin_permission_can_enter_admin_shell_but_blocked_on_specific_actions_without_perms()
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);
        $user->givePermissionTo('access admin');

        // Can enter general admin area (dashboard index redirect), but specific pages still need their own permissions
        $response = $this->actingAs($user)->get('/dashboard/admin');
        $response->assertStatus(302); // redirects to /dashboard

        // Try a page requiring specific permission (users index requires view users)
        $responseUsers = $this->actingAs($user)->get('/dashboard/admin/users');
        $responseUsers->assertStatus(403);

        // Try a posts index which requires view posts at route level
        $responsePosts = $this->actingAs($user)->get('/dashboard/admin/posts');
        $responsePosts->assertStatus(403);
    }

    public function test_admin_role_has_full_access_to_admin_users_index()
    {
        $admin = User::factory()->create([
            'email_verified_at' => now(),
        ]);
        $admin->assignRole('admin');

        $response = $this->actingAs($admin)->get('/dashboard/admin/users');
        $response->assertStatus(200);
    }

    public function test_user_with_view_posts_permission_can_access_posts_index()
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);
        $user->givePermissionTo('access admin');
        $user->givePermissionTo('view posts');

        $response = $this->actingAs($user)->get('/dashboard/admin/posts');
        $response->assertStatus(200);
    }
}
