<div class="archive-page">
    @if({{page_title}})
        <header class="archive-header">
            <h1 class="archive-title">{{page_title}}</h1>
            @if({{page_description}})
                <p class="archive-description">{{page_description}}</p>
            @endif
        </header>
    @endif

    @if({{posts}})
        <div class="posts-grid">
            {{posts_loop_start}}
            <article class="post-card">
                <h2 class="post-card-title">
                    <a href="{{post_url}}">{{post_title}}</a>
                </h2>
                @if({{post_excerpt}})
                    <p class="post-card-excerpt">{{post_excerpt}}</p>
                @endif
            </article>
            {{posts_loop_end}}
        </div>

        @if({{pagination}})
            <nav class="pagination-nav">
                {{pagination_links}}
            </nav>
        @endif
    @else
        <p>No posts found.</p>
    @endif
</div>
