<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Plugins\ContactForm\ContactFormServiceProvider;
use Plugins\ContactForm\src\Mail\ContactFormSubmitted;
use Plugins\ContactForm\src\Models\ContactSubmission;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->app->register(ContactFormServiceProvider::class);
    config(['mail.admin_address' => 'admin@example.com']);
    $this->artisan('migrate', [
        '--path' => 'plugins/ContactForm/database/migrations',
    ]);
});

test('contact form submission stores data and sends email', function () {
    Mail::fake();

    $payload = [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'subject' => 'Contact',
        'message' => 'Hello from the test suite.',
    ];

    $response = $this->post('/contact-form/submit', $payload);

    $response->assertRedirect();

    $this->assertDatabaseHas('contact_submissions', [
        'name' => $payload['name'],
        'email' => $payload['email'],
        'subject' => $payload['subject'],
    ]);

    Mail::assertSent(ContactFormSubmitted::class, function ($mail) {
        return $mail->hasTo('admin@example.com');
    });

    $submission = ContactSubmission::first();
    expect($submission)->not->toBeNull();
});
