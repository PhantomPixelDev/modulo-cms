@component('mail::message')
# New contact form submission

**Name:** {{ $submission->name }}  
**Email:** {{ $submission->email }}  
**Subject:** {{ $submission->subject ?: 'No subject' }}

**Message:**

{{ $submission->message }}

@endcomponent
