@extends('themes::modern.templates.layout')

@section('content')
<section class="search-results">
    <h1 class="mb-4">Search results for "{{ $query ?? '' }}"</h1>
    @forelse(($results ?? []) as $post)
        <article class="card mb-4">
            <h2><a href="/{{ $post->postType->slug ?? 'post' }}/{{ $post->slug }}">{{ $post->title }}</a></h2>
        </article>
    @empty
        <p>No results found.</p>
    @endforelse
</section>
@endsection
