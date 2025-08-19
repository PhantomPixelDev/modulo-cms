<div class="posts-index">
    @if (!empty($page_title) || !empty($page_description))
        <header class="archive-header">
            @if (!empty($page_title))
                <h1 class="archive-title">{{ $page_title }}</h1>
            @endif
            @if (!empty($page_description))
                <div class="archive-description">
                    <p>{{ $page_description }}</p>
                </div>
            @endif
        </header>
    @endif

    @if (!empty($posts) && count($posts))
        <div class="posts-grid">
            @foreach ($posts as $post)
                <article class="post-card">
                    @if (!empty($post->featured_image))
                        <div class="post-card-image">
                            <a href="/{{ $post->slug }}">
                                <img src="{{ $post->featured_image }}" alt="{{ $post->title }}">
                            </a>
                        </div>
                    @endif

                    <div class="post-card-content">
                        <header class="post-card-header">
                            <h2 class="post-card-title">
                                <a href="/{{ $post->slug }}">{{ $post->title }}</a>
                            </h2>
                            <div class="post-card-meta">
                                @if (!empty($post->published_at))
                                    <time datetime="{{ optional($post->published_at)->toISOString() }}">{{ optional($post->published_at)->format('F j, Y') }}</time>
                                @endif
                                @if (!empty($post->author?->name))
                                    <span class="post-author">by {{ $post->author->name }}</span>
                                @endif
                            </div>
                        </header>

                        @if (!empty($post->excerpt))
                            <div class="post-card-excerpt">
                                <p>{{ $post->excerpt }}</p>
                            </div>
                        @endif

                        <footer class="post-card-footer">
                            <a href="/{{ $post->slug }}" class="read-more">Read More</a>
                        </footer>
                    </div>
                </article>
            @endforeach
        </div>
    @else
        <div class="no-posts">
            <h2>No posts found</h2>
            <p>There are no posts to display at this time.</p>
        </div>
    @endif
</div>
