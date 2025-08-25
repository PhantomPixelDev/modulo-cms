@extends('themes::flexia.templates.layout')

@section('content')
<section class="stack-lg">
    <h1 class="h2">{{ $title ?? 'Archive' }}</h1>
    <ul class="list-none stack-md">
        @foreach(($posts ?? []) as $post)
            <li>
                <a href="{{ optional($post->postType)->route_prefix ? url('/' . ltrim($post->postType->route_prefix, '/') . '/' . $post->slug) : url('/' . $post->slug) }}" class="inline-link">{{ $post->title }}</a>
            </li>
        @endforeach
    </ul>
</section>
@endsection
