<?php

namespace Tests\Feature;

use App\Models\Template;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TemplatesCrudTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_templates_crud_forbidden_with_only_access_admin()
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->givePermissionTo('access admin');

        // Create
        $this->actingAs($user)
            ->post('/dashboard/admin/templates', [
                'name' => 'Tpl 1',
                'type' => 'blade',
                'content' => '<div>Hi</div>',
            ])
            ->assertStatus(403);

        // Create resource directly to test update/delete forbidden
        $tpl = Template::create([
            'name' => 'Tpl Forbidden',
            'type' => 'blade',
            'content' => '<div>Body</div>',
            'variables' => [],
            'is_default' => false,
            'is_active' => true,
            'created_by' => $user->id,
        ]);

        // Update
        $this->actingAs($user)
            ->patch("/dashboard/admin/templates/{$tpl->id}", [
                'name' => 'Tpl Forbidden Edit',
                'type' => 'blade',
                'content' => '<div>Updated</div>',
            ])
            ->assertStatus(403);

        // Delete
        $this->actingAs($user)
            ->delete("/dashboard/admin/templates/{$tpl->id}")
            ->assertStatus(403);
    }

    public function test_templates_crud_succeeds_with_permissions()
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->givePermissionTo('access admin');
        $user->givePermissionTo('create templates');
        $user->givePermissionTo('edit templates');
        $user->givePermissionTo('delete templates');
        $user->givePermissionTo('view templates');

        // Create
        $create = $this->actingAs($user)
            ->post('/dashboard/admin/templates', [
                'name' => 'Tpl OK',
                'type' => 'blade',
                'content' => '<div>Hi</div>',
                'is_active' => true,
            ]);
        $create->assertStatus(302); // redirect after store

        $tpl = Template::where('name', 'Tpl OK')->firstOrFail();

        // Update
        $update = $this->actingAs($user)
            ->patch("/dashboard/admin/templates/{$tpl->id}", [
                'name' => 'Tpl OK Edited',
                'type' => 'blade',
                'content' => '<div>Updated</div>',
                'is_active' => false,
            ]);
        $update->assertStatus(302);

        // Delete
        $delete = $this->actingAs($user)->delete("/dashboard/admin/templates/{$tpl->id}");
        $delete->assertStatus(302);
        $this->assertDatabaseMissing('templates', ['id' => $tpl->id]);
    }
}
