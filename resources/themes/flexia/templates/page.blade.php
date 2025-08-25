@extends('themes::flexia.templates.layout')

@section('content')
<article class="page">
    <h1 class="page-title">{{ $title ?? ($post->title ?? '') }}</h1>
    <div class="content rich-text">
        {!! $content ?? ($post->content ?? '') !!}
    </div>
</article>
@endsection
