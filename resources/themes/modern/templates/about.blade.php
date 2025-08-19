@extends('themes::modern.templates.layout')

@section('content')
ABOUT WORKING FROM THEME
<article class="page">
    <h1 class="mb-2">{{ $page->title ?? ($post->title ?? '') }}</h1>
    <div class="content">
        {!! $page->content ?? ($post->content ?? '') !!}
    </div>
</article>
@endsection
