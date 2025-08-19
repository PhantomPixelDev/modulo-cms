@extends('themes::modern.templates.layout')

@section('content')
1111
<section class="content-list">
    <h1 class="mb-4">{{ $page_title ?? 'Posts' }}</h1>

    @forelse(($posts ?? []) as $post)
        <article class="card mb-6">
            <header class="mb-3">
                @php
                    $prefix = $post->postType->route_prefix ?? '';
                    $url = $prefix ? '/' . trim($prefix, '/') . '/' . $post->slug : '/' . $post->slug;
                @endphp
                <h2 class="mb-1"><a href="{{ $url }}">{{ $post->title }}</a></h2>
                @includeIf('themes::modern.partials.post-meta', ['post' => $post])
            </header>

            @if(!empty($post->featured_image))
                <a href="{{ $url }}" class="block mb-3">
                    <img src="{{ $post->featured_image }}" alt="{{ $post->title }}"
                         class="w-full h-auto rounded shadow" />
                </a>
            @endif

            <p class="excerpt">{{ $post->excerpt ?? Str::limit(strip_tags($post->content ?? ''), 180) }}</p>
        </article>
    @empty
        <p>No posts found.</p>
    @endforelse

    {{-- Simple pagination (if available) --}}
    @if(method_exists(($posts ?? null), 'links'))
        <div class="mt-8">
            {!! $posts->links() !!}
        </div>
    @endif
</section>
@endsection
