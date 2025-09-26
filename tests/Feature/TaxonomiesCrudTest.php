<?php

namespace Tests\Feature;

use App\Models\Taxonomy;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaxonomiesCrudTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_taxonomies_crud_forbidden_with_only_access_admin()
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->givePermissionTo('access admin');

        // Create
        $this->actingAs($user)
            ->post('/dashboard/admin/taxonomies', [
                'name' => 'Genres',
                'label' => 'Genres',
                'plural_label' => 'Genres',
            ])
            ->assertStatus(403);

        $taxonomy = Taxonomy::create([
            'name' => 'topics',
            'label' => 'Topics',
            'plural_label' => 'Topics',
            'slug' => 'topics',
        ]);

        // Update
        $this->actingAs($user)
            ->patch("/dashboard/admin/taxonomies/{$taxonomy->id}", [
                'name' => 'topics',
                'label' => 'Topics Edited',
                'plural_label' => 'Topics',
            ])
            ->assertStatus(403);

        // Delete
        $this->actingAs($user)
            ->delete("/dashboard/admin/taxonomies/{$taxonomy->id}")
            ->assertStatus(403);
    }

    public function test_taxonomies_crud_succeeds_with_permissions()
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->givePermissionTo('access admin');
        $user->givePermissionTo('create taxonomies');
        $user->givePermissionTo('edit taxonomies');
        $user->givePermissionTo('delete taxonomies');
        $user->givePermissionTo('view taxonomies');

        // Create
        $respCreate = $this->actingAs($user)
            ->post('/dashboard/admin/taxonomies', [
                'name' => 'genres',
                'label' => 'Genres',
                'plural_label' => 'Genres',
            ]);
        $respCreate->assertStatus(302);

        $taxonomy = Taxonomy::where('name', 'genres')->firstOrFail();

        // Update
        $respUpdate = $this->actingAs($user)
            ->patch("/dashboard/admin/taxonomies/{$taxonomy->id}", [
                'name' => 'genres',
                'label' => 'Genres Edited',
                'plural_label' => 'Genres',
            ]);
        $respUpdate->assertStatus(302);

        // Delete
        $respDelete = $this->actingAs($user)
            ->delete("/dashboard/admin/taxonomies/{$taxonomy->id}");
        $respDelete->assertStatus(302);
        $this->assertDatabaseMissing('taxonomies', ['id' => $taxonomy->id]);
    }
}
