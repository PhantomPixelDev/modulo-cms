<p class="post-meta">
    @if(!empty($post->author_name))
        <span>By {{ $post->author_name }}</span>
    @endif
    @if(!empty($post->published_at))
        <span>• {{ \Carbon\Carbon::parse($post->published_at)->format('M d, Y') }}</span>
    @endif
</p>
