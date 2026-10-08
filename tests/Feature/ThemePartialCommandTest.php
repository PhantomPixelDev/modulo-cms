<?php

use Illuminate\Support\Facades\File;

beforeEach(function () {
    $this->partialTheme = 'partial-command-'.strtolower(bin2hex(random_bytes(4)));
    $this->partialPath = resource_path('themes/'.$this->partialTheme);
    File::ensureDirectoryExists($this->partialPath);
    File::put($this->partialPath.'/theme.json', json_encode(['name' => 'Test', 'slug' => $this->partialTheme]));
});

afterEach(function () {
    File::deleteDirectory($this->partialPath);
});

it('creates a typed module and registers it without overwriting work', function () {
    $this->artisan('theme:partial', ['theme' => $this->partialTheme, 'name' => 'contact-card'])->assertSuccessful();
    $path = $this->partialPath.'/components/partials/ContactCard.tsx';
    $config = json_decode(File::get($this->partialPath.'/theme.json'), true);
    expect(File::get($path))->toContain('ThemePartialProps', 'attributes.title', '{children}')
        ->and($config['partials']['contact-card'])->toBe([
            'component' => 'components/partials/ContactCard.tsx', 'shortcode' => true,
            'label' => 'Contact Card', 'description' => '', 'defaults' => ['title' => ''],
        ]);
    File::put($path, 'keep this work');
    $this->artisan('theme:partial', ['theme' => $this->partialTheme, 'name' => 'contact-card'])->assertFailed();
    expect(File::get($path))->toBe('keep this work');
});

it('refuses path traversal and runtime themes', function () {
    $this->artisan('theme:partial', ['theme' => '../outside', 'name' => 'card'])->assertFailed();
    $this->artisan('theme:partial', ['theme' => $this->partialTheme, 'name' => '../Card'])->assertFailed();
    $this->artisan('theme:partial', ['theme' => 'missing-runtime-theme', 'name' => 'card'])->assertFailed();
    expect(File::exists($this->partialPath.'/components'))->toBeFalse();
});
