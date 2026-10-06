@component('mail::message')
# New comment awaiting moderation

**{{ $comment->author_name }}** commented on {{ $post->title }}.

{{ \Illuminate\Support\Str::limit($comment->content, 500) }}

Review it in the admin comments section.

Thanks,
{{ config('app.name') }}
@endcomponent
