<div class="post-meta text-sm text-gray-500 mb-4">
    <span>By {{ $post->author->name ?? 'Unknown' }}</span>
    <span> • </span>
    <span>{{ optional($post->created_at)->format('M d, Y') }}</span>
</div>
