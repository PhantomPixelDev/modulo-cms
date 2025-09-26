<?php

namespace Tests\Feature;

use App\Models\Menu;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MenusCrudTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_menus_crud_forbidden_with_only_access_admin()
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->givePermissionTo('access admin');

        // Create
        $this->actingAs($user)
            ->post('/dashboard/admin/menus', [
                'name' => 'Main',
                'slug' => 'main',
            ])
            ->assertStatus(403);

        $menu = Menu::create([
            'name' => 'Forbidden',
            'slug' => 'forbidden',
        ]);

        // Update
        $this->actingAs($user)
            ->patch("/dashboard/admin/menus/{$menu->id}", [
                'name' => 'Forbidden Edited',
                'slug' => 'forbidden',
            ])
            ->assertStatus(403);

        // Delete
        $this->actingAs($user)
            ->delete("/dashboard/admin/menus/{$menu->id}")
            ->assertStatus(403);
    }

    public function test_menus_crud_succeeds_with_permissions()
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->givePermissionTo('access admin');
        $user->givePermissionTo('create menus');
        $user->givePermissionTo('edit menus');
        $user->givePermissionTo('delete menus');
        $user->givePermissionTo('view menus');

        // Create
        $respCreate = $this->actingAs($user)
            ->post('/dashboard/admin/menus', [
                'name' => 'Main',
                'slug' => 'main',
            ]);
        $respCreate->assertStatus(302);

        $menu = Menu::where('slug', 'main')->firstOrFail();

        // Update
        $respUpdate = $this->actingAs($user)
            ->patch("/dashboard/admin/menus/{$menu->id}", [
                'name' => 'Main Edited',
                'slug' => 'main',
            ]);
        $respUpdate->assertStatus(302);

        // Delete
        $respDelete = $this->actingAs($user)
            ->delete("/dashboard/admin/menus/{$menu->id}");
        $respDelete->assertStatus(302);
        $this->assertDatabaseMissing('menus', ['id' => $menu->id]);
    }
}
