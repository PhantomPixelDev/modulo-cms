@extends('themes::flexia.templates.layout')

@section('content')
<section class="stack-lg">
    <h1 class="h2">{{ $title ?? 'Posts' }}</h1>
    <div class="grid cols-1 md:cols-2 lg:cols-3 gap-md">
        @forelse(($posts ?? []) as $post)
            <article class="card">
                <a href="{{ optional($post->postType)->route_prefix ? url('/' . ltrim($post->postType->route_prefix, '/') . '/' . $post->slug) : url('/' . $post->slug) }}" class="card__link">
                    <h3 class="card__title">{{ $post->title }}</h3>
                    @if(!empty($post->excerpt))
                        <p class="card__excerpt">{{ $post->excerpt }}</p>
                    @endif
                </a>
            </article>
        @empty
            <p>No posts yet.</p>
        @endforelse
    </div>
</section>
@endsection
