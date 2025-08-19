<article id="page-{{ $id ?? '' }}" class="page page-{{ $slug ?? '' }} status-{{ $status ?? '' }}">
    @if (!empty($featured_image))
        <div class="page-thumbnail">
            <img src="{{ $featured_image }}" alt="{{ $title ?? '' }}" class="featured-image">
        </div>
    @endif
    
    <header class="page-header">
        @if (!empty($breadcrumbs))
            <nav class="breadcrumbs">
                {!! $breadcrumbs !!}
            </nav>
        @endif
        
        <h1 class="page-title">{{ $title ?? '' }}</h1>
        
        @if (!empty($excerpt))
            <div class="page-excerpt">
                <p>{{ $excerpt }}</p>
            </div>
        @endif
        
        @if (!empty($updated_at))
            <div class="page-meta">
                <span class="last-updated">
                    Last updated: <time datetime="{{ $updated_at_iso ?? '' }}">{{ $updated_at }}</time>
                </span>
            </div>
        @endif
    </header>
    
    <div class="page-content">
        {!! $content ?? '' !!}
    </div>
    
    @if (!empty($child_pages))
        <div class="child-pages">
            <h3>Sub-pages</h3>
            <ul class="child-pages-list">
                {!! $child_pages !!}
            </ul>
        </div>
    @endif
    
    @if (!empty($contact_form))
        <div class="contact-form-section">
            <h3>Get in Touch</h3>
            {!! $contact_form !!}
        </div>
    @endif
</article>
