<?php

it('returns 404 json for unknown api routes', function () {
    $this->getJson('/api/does-not-exist')
        ->assertNotFound()
        ->assertJsonStructure(['message']);
});

it('returns 422 json for invalid api input', function () {
    $this->getJson('/api/menus/slug/'.rawurlencode('bad slug!'))
        ->assertUnprocessable()
        ->assertJsonValidationErrors('slug');
});

it('returns 200 json for a valid menu lookup', function () {
    $this->getJson('/api/menus/slug/main-navigation')->assertOk();
});
