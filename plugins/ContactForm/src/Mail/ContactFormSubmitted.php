<?php

namespace Plugins\ContactForm\src\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Plugins\ContactForm\src\Models\ContactSubmission;

class ContactFormSubmitted extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public ContactSubmission $submission)
    {
    }

    public function build(): self
    {
        return $this->subject('New contact form submission: ' . ($this->submission->subject ?: 'No subject'))
            ->replyTo($this->submission->email, $this->submission->name)
            ->markdown('contact-form::emails.contact-submitted', [
                'submission' => $this->submission,
            ]);
    }
}
