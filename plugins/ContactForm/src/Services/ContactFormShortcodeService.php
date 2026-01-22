<?php

namespace Plugins\ContactForm\src\Services;

use App\Services\ShortcodeService;
use Illuminate\Support\Facades\View;

class ContactFormShortcodeService
{
    public function __construct(protected ShortcodeService $shortcodeService)
    {
        $this->registerShortcodes();
    }

    protected function registerShortcodes(): void
    {
        $this->shortcodeService->register('contact_form', [$this, 'renderContactForm']);
    }

    public function renderContactForm(array $attrs): string
    {
        $subject = $attrs['subject'] ?? null;

        return View::make('contact-form::shortcodes.contact-form', [
            'subject' => $subject,
        ])->render();
    }
}
