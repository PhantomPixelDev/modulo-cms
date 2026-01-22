<div class="contact-form-wrapper">
    @if (session('contact_form_success'))
        <div class="mb-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {{ session('contact_form_success') }}
        </div>
    @endif

    @if ($errors->any())
        <div class="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <ul class="list-disc pl-5">
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    <form method="POST" action="{{ route('contact-form.submit') }}" class="space-y-4">
        @csrf
        <div>
            <label class="block text-sm font-medium text-foreground" for="contact_name">Name</label>
            <input
                id="contact_name"
                name="name"
                type="text"
                value="{{ old('name') }}"
                required
                class="mt-1 w-full rounded-md border border-border px-3 py-2"
            />
        </div>
        <div>
            <label class="block text-sm font-medium text-foreground" for="contact_email">Email</label>
            <input
                id="contact_email"
                name="email"
                type="email"
                value="{{ old('email') }}"
                required
                class="mt-1 w-full rounded-md border border-border px-3 py-2"
            />
        </div>
        <div>
            <label class="block text-sm font-medium text-foreground" for="contact_subject">Subject</label>
            <input
                id="contact_subject"
                name="subject"
                type="text"
                value="{{ old('subject', $subject) }}"
                class="mt-1 w-full rounded-md border border-border px-3 py-2"
            />
        </div>
        <div>
            <label class="block text-sm font-medium text-foreground" for="contact_message">Message</label>
            <textarea
                id="contact_message"
                name="message"
                rows="6"
                required
                class="mt-1 w-full rounded-md border border-border px-3 py-2"
            >{{ old('message') }}</textarea>
        </div>
        <button type="submit" class="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Send message
        </button>
    </form>
</div>
