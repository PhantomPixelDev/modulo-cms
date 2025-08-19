<?php

use App\Models\User;
use App\Models\Taxonomy;
use App\Models\TaxonomyTerm;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

function termUser(array $perms = []): User {
    $user = User::factory()->create();
    foreach ($perms as $perm) {
        Permission::findOrCreate($perm, 'web');
    }
    if ($perms) $user->givePermissionTo($perms);
    return $user;
}

function ensureTaxonomy(): Taxonomy {
    return Taxonomy::firstOrCreate([
        'name' => 'category'
    ], [
        'label' => 'Category',
        'plural_label' => 'Categories',
        'description' => null,
        'slug' => 'category',
        'is_hierarchical' => true,
        'is_public' => true,
        'post_types' => [],
        'show_in_menu' => true,
        'menu_icon' => null,
        'menu_position' => 5,
    ]);
}

it('denies taxonomy terms index without permission', function () {
    // Ensure permission exists; user does not have it
    Permission::findOrCreate('view taxonomy terms', 'web');
    $u = termUser();
    $this->actingAs($u)->get(route('dashboard.admin.taxonomy-terms.index'))->assertForbidden();
});

it('allows taxonomy terms index with permission', function () {
    $u = termUser(['view taxonomy terms']);
    $this->actingAs($u)->get(route('dashboard.admin.taxonomy-terms.index'))->assertOk();
});

it('creates, updates and deletes a taxonomy term with permissions', function () {
    $u = termUser(['create taxonomy terms','edit taxonomy terms','delete taxonomy terms','view taxonomy terms']);
    $this->actingAs($u);

    $tax = ensureTaxonomy();

    // Create
    $resp = $this->post(route('dashboard.admin.taxonomy-terms.store'), [
        'taxonomy_id' => $tax->id,
        'name' => 'News',
        'description' => 'desc',
        'term_order' => 1,
    ]);
    $resp->assertRedirect(route('dashboard.admin.taxonomy-terms.index'));
    $term = TaxonomyTerm::where('taxonomy_id',$tax->id)->where('name','News')->first();
    expect($term)->not->toBeNull();

    // Update
    $resp2 = $this->put(route('dashboard.admin.taxonomy-terms.update', $term), [
        'taxonomy_id' => $tax->id,
        'name' => 'News Updated',
        'description' => 'desc2',
        'term_order' => 2,
    ]);
    $resp2->assertRedirect(route('dashboard.admin.taxonomy-terms.index'));
    $term->refresh();
    expect($term->name)->toBe('News Updated');

    // Delete
    $resp3 = $this->delete(route('dashboard.admin.taxonomy-terms.destroy', $term));
    $resp3->assertSessionHas('success');
    expect(TaxonomyTerm::where('id', $term->id)->exists())->toBeFalse();
});

it('enforces unique slug per taxonomy by auto-incrementing', function () {
    $u = termUser(['create taxonomy terms']);
    $this->actingAs($u);
    $tax = ensureTaxonomy();

    $this->post(route('dashboard.admin.taxonomy-terms.store'), [
        'taxonomy_id' => $tax->id,
        'name' => 'Duplicate',
        'description' => null,
    ])->assertRedirect();
    $this->post(route('dashboard.admin.taxonomy-terms.store'), [
        'taxonomy_id' => $tax->id,
        'name' => 'Duplicate',
        'description' => null,
    ])->assertRedirect();

    $terms = TaxonomyTerm::where('taxonomy_id',$tax->id)->where('name','Duplicate')->orderBy('id')->get();
    expect($terms->count())->toBe(2);
    expect($terms[0]->slug)->not->toBe($terms[1]->slug);
});

it('prevents deleting a term that has children', function () {
    $u = termUser(['create taxonomy terms','delete taxonomy terms']);
    $this->actingAs($u);
    $tax = ensureTaxonomy();

    $parent = TaxonomyTerm::create([
        'taxonomy_id' => $tax->id,
        'name' => 'Parent',
        'slug' => 'parent',
        'term_order' => 0,
    ]);
    $child = TaxonomyTerm::create([
        'taxonomy_id' => $tax->id,
        'name' => 'Child',
        'slug' => 'child',
        'parent_id' => $parent->id,
        'term_order' => 0,
    ]);

    $this->delete(route('dashboard.admin.taxonomy-terms.destroy', $parent))
        ->assertSessionHas('error');
    expect(TaxonomyTerm::whereKey($parent->id)->exists())->toBeTrue();
    expect(TaxonomyTerm::whereKey($child->id)->exists())->toBeTrue();
});

it('denies create/edit/update/destroy without respective permissions', function () {
    // Ensure permissions exist but are not granted (except view)
    foreach (['create taxonomy terms','edit taxonomy terms','delete taxonomy terms'] as $p) {
        Permission::findOrCreate($p, 'web');
    }
    $u = termUser(['view taxonomy terms']);
    $this->actingAs($u);

    $this->get(route('dashboard.admin.taxonomy-terms.create'))->assertForbidden();
    $this->post(route('dashboard.admin.taxonomy-terms.store'), [])->assertForbidden();

    $tax = ensureTaxonomy();
    $term = TaxonomyTerm::create([
        'taxonomy_id' => $tax->id,
        'name' => 'Some',
        'slug' => 'some',
    ]);

    $this->get(route('dashboard.admin.taxonomy-terms.edit', $term))->assertForbidden();
    $this->put(route('dashboard.admin.taxonomy-terms.update', $term), [
        'taxonomy_id' => $tax->id,
        'name' => 'Some',
    ])->assertForbidden();
    $this->delete(route('dashboard.admin.taxonomy-terms.destroy', $term))->assertForbidden();
});
