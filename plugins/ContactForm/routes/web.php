<?php

use Illuminate\Support\Facades\Route;
use Plugins\ContactForm\src\Http\Controllers\ContactFormController;

Route::post('/contact-form/submit', [ContactFormController::class, 'store'])
    ->middleware('throttle:auth')
    ->name('contact-form.submit');
