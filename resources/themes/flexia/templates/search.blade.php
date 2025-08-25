@extends('themes::flexia.templates.layout')

@section('content')
<section class="stack-lg">
    <h1 class="h2">Search results for "{{ $query ?? '' }}"</h1>
    <ul class="stack-md list-none">
        @forelse(($results ?? []) as $post)
            <li>
                <a href="/{{ $post->slug }}" class="inline-link">{{ $post->title }}</a>
            </li>
        @empty
            <li>No results found.</li>
        @endforelse
    </ul>
</section>
@endsection
