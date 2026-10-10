<?php

it('validates malformed email input before login and reset handling', function (string $path) {
    $this->postJson($path, ['email' => ['unexpected'], 'password' => 'not-a-valid-password'])
        ->assertUnprocessable()->assertJsonValidationErrors('email');
})->with(['/login', '/forgot-password']);
