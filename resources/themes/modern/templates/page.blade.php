@extends('themes::modern.templates.layout')

@section('content')
<article class="page">
    <h1 class="mb-2">{{ $page->title ?? ($post->title ?? '') }}</h1>
    <div class="content rich-text">
        {!! $page->content ?? ($post->content ?? '') !!}
    </div>
</article>
@endsection
