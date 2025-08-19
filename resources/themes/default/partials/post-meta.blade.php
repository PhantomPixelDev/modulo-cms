<div class="post-meta">
    @if({{post_author_name}})
        <span class="author">By {{post_author_name}}</span>
    @endif
    @if({{post_published_at}})
        <time datetime="{{post_published_at_iso}}">{{post_published_at}}</time>
    @endif
</div>
