<?php

use App\Models\Post;
use App\Models\PostType;
use App\Presenters\PostPresenter;

function eventType(): PostType
{
    return PostType::factory()->create([
        'name' => 'event', 'slug' => 'events', 'route_prefix' => 'events',
        'fields' => [
            ['key' => 'starts_on', 'label' => 'Starts on', 'type' => 'date', 'required' => true],
            ['key' => 'price', 'label' => 'Price', 'type' => 'number'],
            ['key' => 'size', 'label' => 'Size', 'type' => 'select', 'options' => ['S', 'M', 'L']],
            ['key' => 'sold_out', 'label' => 'Sold out', 'type' => 'toggle'],
        ],
    ]);
}

function eventPayload(PostType $type, array $fields): array
{
    return [
        'post_type_id' => $type->id, 'title' => 'Launch party', 'slug' => 'launch-party',
        'content' => 'Come along', 'status' => 'draft',
        'meta_data' => ['fields' => $fields],
    ];
}

it('saves field definitions on a post type, tidied up', function () {
    $this->actingAs(makeAdminUserWithPermissions(['create post types', 'view post types']));

    $this->post(route('dashboard.admin.post-types.store'), [
        'name' => 'product_sheet', 'label' => 'Sheet', 'plural_label' => 'Sheets', 'route_prefix' => 'sheets', 'menu_position' => 5,
        'fields' => [
            ['key' => 'colour', 'label' => 'Colour', 'type' => 'select', 'options' => ['Red', '', 'Blue'], 'help' => ''],
            ['key' => 'weight', 'label' => 'Weight', 'type' => 'number', 'options' => ['ignored']],
        ],
    ])->assertSessionHasNoErrors();

    expect(PostType::where('name', 'product_sheet')->value('fields'))->toBe([
        ['key' => 'colour', 'label' => 'Colour', 'type' => 'select', 'required' => false, 'options' => ['Red', 'Blue']],
        ['key' => 'weight', 'label' => 'Weight', 'type' => 'number', 'required' => false],
    ]);
});

it('rejects field keys a theme could not use, and duplicates', function () {
    $this->actingAs(makeAdminUserWithPermissions(['create post types', 'view post types']));

    $this->post(route('dashboard.admin.post-types.store'), [
        'name' => 'x', 'label' => 'X', 'plural_label' => 'Xs', 'menu_position' => 5,
        'fields' => [
            ['key' => 'Bad Key', 'label' => 'A', 'type' => 'text'],
            ['key' => 'dup', 'label' => 'B', 'type' => 'text'],
            ['key' => 'dup', 'label' => 'C', 'type' => 'colour'],
        ],
    ])->assertSessionHasErrors(['fields.0.key', 'fields.1.key', 'fields.2.type']);
});

it('checks field values against their definitions', function () {
    $type = eventType();
    $this->actingAs(makeAdminUserWithPermissions(['create posts']));

    $this->post(route('dashboard.admin.posts.store'), eventPayload($type, ['price' => 'free', 'size' => 'XXL']))
        ->assertSessionHasErrors([
            'meta_data.fields.starts_on' => 'The Starts on field is required.',
            'meta_data.fields.price',
            'meta_data.fields.size',
        ]);
});

it('stores field values with the post and hands them to themes', function () {
    $type = eventType();
    $this->actingAs(makeAdminUserWithPermissions(['create posts']));

    $this->post(route('dashboard.admin.posts.store'), eventPayload($type, ['starts_on' => '2026-10-01', 'price' => '12.5', 'size' => 'M', 'sold_out' => true]))
        ->assertSessionHasNoErrors();

    $post = Post::where('slug', 'launch-party')->firstOrFail();
    expect(app(PostPresenter::class)->presentPost($post)['fields'])->toBe([
        'starts_on' => '2026-10-01',
        'price' => 12.5,
        'size' => 'M',
        'sold_out' => true,
    ]);
});

it('keeps the SEO title and description the editor sends', function () {
    $type = PostType::factory()->create(['name' => 'news', 'slug' => 'news', 'route_prefix' => 'news']);
    $post = Post::factory()->create(['post_type_id' => $type->id, 'slug' => 'story', 'meta_title' => 'Old SEO', 'status' => 'draft']);
    $this->actingAs(makeAdminUserWithPermissions(['edit posts']));

    $this->put(route('dashboard.admin.posts.update', $post), [
        'post_type_id' => $type->id, 'title' => 'Story', 'slug' => 'story', 'content' => 'x', 'status' => 'draft',
        'meta_title' => 'New SEO title', 'meta_description' => 'New description',
        'meta_data' => ['noindex' => true, 'fields' => []],
    ])->assertSessionHasNoErrors();

    expect($post->fresh()->meta_title)->toBe('New SEO title')
        ->and($post->fresh()->meta_description)->toBe('New description')
        ->and($post->fresh()->meta_data['noindex'])->toBeTrue();
});
