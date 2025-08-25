@extends('themes::flexia.templates.layout')

@section('content')
<section class="stack-lg">
    <header class="stack-xs">
        <h1 class="h2">Category: {{ $term->name }}</h1>
        @if(!empty($term->description))
            <p class="text-muted">{{ $term->description }}</p>
        @endif
    </header>

    @if($posts->count())
        <ul class="list-none stack-md">
            @foreach($posts as $post)
                <li class="card">
                    <h2 class="card__title">
                        <a href="{{ optional($post->postType)->route_prefix ? url('/' . ltrim($post->postType->route_prefix, '/') . '/' . $post->slug) : url('/' . $post->slug) }}" class="inline-link">{{ $post->title }}</a>
                    </h2>
                    @if(!empty($post->excerpt))
                        <p class="card__excerpt">{{ $post->excerpt }}</p>
                    @endif
                </li>
            @endforeach
        </ul>
        @if(method_exists($posts, 'links'))
            <div class="pagination">{!! $posts->links() !!}</div>
        @endif
    @else
        <p>No posts found for this category.</p>
    @endif
</section>
@endsection
