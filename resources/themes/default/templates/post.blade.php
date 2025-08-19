<article id="post-{{ $id ?? '' }}" class="post post-{{ $post_type ?? 'post' }} status-{{ $status ?? '' }}">
    @if (!empty($featured_image))
        <div class="post-thumbnail">
            <img src="{{ $featured_image }}" alt="{{ $title ?? '' }}" class="featured-image">
        </div>
    @endif
    
    <header class="post-header">
        <h1 class="post-title">{{ $title ?? '' }}</h1>
        
        <div class="post-meta">
            <span class="post-date">
                @if (!empty($published_at))
                    <time datetime="{{ $published_at_iso ?? '' }}">{{ $published_at }}</time>
                @endif
            </span>
            
            @if (!empty($author_name))
                <span class="post-author">
                    by <a href="{{ $author_url ?? '#' }}">{{ $author_name }}</a>
                </span>
            @endif
            
            @if (!empty($categories_links))
                <span class="post-categories">
                    in {!! $categories_links !!}
                </span>
            @endif
            
            @if (!empty($reading_time))
                <span class="reading-time">{{ $reading_time }} min read</span>
            @endif
        </div>
    </header>
    
    <div class="post-content">
        @if (!empty($excerpt))
            <div class="post-excerpt">
                <p>{{ $excerpt }}</p>
            </div>
        @endif
        
        {!! $content ?? '' !!}
    </div>
    
    @if (!empty($tags_links))
        <footer class="post-footer">
            <div class="post-tags">
                <span class="tags-label">Tags:</span>
                {!! $tags_links !!}
            </div>
        </footer>
    @endif
    
    @if (!empty($share_buttons))
        <div class="post-share">
            <h4>Share this post</h4>
            <div class="share-buttons">
                {!! $share_buttons !!}
            </div>
        </div>
    @endif
    
    @if (!empty($show_author_bio))
        <div class="author-bio">
            <div class="author-avatar">
                <img src="{{ $author_avatar ?? '' }}" alt="{{ $author_name ?? '' }}">
            </div>
            <div class="author-info">
                <h4 class="author-name">{{ $author_name ?? '' }}</h4>
                <p class="author-description">{{ $author_bio ?? '' }}</p>
                @if (!empty($author_website))
                    <a href="{{ $author_website }}" class="author-website">Visit Website</a>
                @endif
            </div>
        </div>
    @endif
    
    @if (!empty($related_posts))
        <div class="related-posts">
            <h4>Related Posts</h4>
            <div class="related-posts-grid">
                {!! $related_posts !!}
            </div>
        </div>
    @endif
</article>

@if (!empty($comments))
    <div class="comments-section">
        {!! $comments !!}
    </div>
@endif
