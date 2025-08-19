<article class="post">
    <h1 class="mb-2">{{ $title ?? ($post->title ?? '') }}</h1>
    @includeIf('themes::modern.partials.post-meta', ['post' => $post])
    @if(!empty($featured_image))
        <figure class="post-featured my-4">
            {!! $featured_image !!}
        </figure>
    @elseif(!empty($post->featured_image))
        <figure class="post-featured my-4">
            <img src="{{ $post->featured_image }}" alt="{{ $post->title }}" class="w-full h-auto rounded shadow" />
        </figure>
    @endif
    <div class="content rich-text">
        {!! $content ?? ($post->content ?? '') !!}
    </div>
</article>
