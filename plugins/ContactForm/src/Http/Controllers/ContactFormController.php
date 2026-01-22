<?php

namespace Plugins\ContactForm\src\Http\Controllers;

use App\Models\Plugin;
use App\Models\SiteSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Plugins\ContactForm\src\Mail\ContactFormSubmitted;
use Plugins\ContactForm\src\Models\ContactSubmission;

class ContactFormController
{
    public function store(Request $request): JsonResponse|RedirectResponse
    {
        if (!Schema::hasTable('contact_submissions')) {
            $message = 'Contact form storage is not available yet. Run migrations to create the table.';
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => $message], 503);
            }
            return back()->withErrors(['contact_form' => $message]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'subject' => 'nullable|string|max:255',
            'message' => 'required|string|max:5000',
        ]);

        $settings = $this->getSettings();
        $subject = $validated['subject'] ?: ($settings['default_subject'] ?? null);

        $submission = ContactSubmission::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'subject' => $subject,
            'message' => $validated['message'],
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 255),
        ]);

        $recipient = $settings['recipient_email']
            ?? SiteSetting::get('admin_email', config('mail.admin_address'))
            ?: config('mail.admin_address');

        if ($recipient) {
            try {
                Mail::to($recipient)->send(new ContactFormSubmitted($submission));
            } catch (\Throwable $e) {
                logger()->error('Failed to send contact form email: ' . $e->getMessage());
            }
        }

        if ($request->wantsJson()) {
            return response()->json(['success' => true]);
        }

        return back()->with(
            'contact_form_success',
            $settings['success_message'] ?? 'Thanks! Your message has been sent.'
        );
    }

    protected function getSettings(): array
    {
        return Plugin::where('slug', 'contact-form')->value('settings') ?? [];
    }
}
