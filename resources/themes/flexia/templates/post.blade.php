@extends('themes::flexia.templates.layout')

@section('content')
<article class="post stack-lg">
    <h1 class="post-title h2">{{ $title ?? ($post->title ?? '') }}</h1>
    @if(!empty($post->author_name) || !empty($post->author))
        <p class="post-meta">
            @if(!empty($post->author_name))
                <span>By {{ $post->author_name }}</span>
            @elseif(!empty($post->author))
                <span>By {{ $post->author->name }}</span>
            @endif
            @if(!empty($post->published_at))
                <span>• {{ \Carbon\Carbon::parse($post->published_at)->format('M d, Y') }}</span>
            @endif
        </p>
    @endif
    @if(!empty($featured_image))
        <figure class="post-featured">{!! $featured_image !!}</figure>
    @elseif(!empty($post->featured_image))
        <figure class="post-featured">
            <img src="{{ $post->featured_image }}" alt="{{ $post->title }}" class="featured-image w-full h-64 object-cover" />
        </figure>
    @endif
    @if(!empty($post->taxonomyTerms) && $post->taxonomyTerms->count())
        @php
            $groups = $post->taxonomyTerms->groupBy(function($t){
                return $t->taxonomy->label ?? $t->taxonomy->name ?? 'Taxonomy';
            });
        @endphp
        <div class="post-taxonomies stack-xs">
            @foreach($groups as $taxonomyLabel => $terms)
                <div class="taxonomy-group row wrap items-center gap-sm">
                    <span class="tax-label text-muted">{{ $taxonomyLabel }}:</span>
                    <ul class="tax-terms row wrap gap-xs" aria-label="{{ $taxonomyLabel }} terms">
                        @foreach($terms as $term)
                            @php
                                $taxSlug = $term->taxonomy->slug ?? \Illuminate\Support\Str::slug($taxonomyLabel);
                                $href = url('/' . $taxSlug . '/' . $term->slug);
                            @endphp
                            <li class="tax-term">
                                <a class="badge" href="{{ $href }}" rel="tag">{{ $term->name }}</a>
                            </li>
                        @endforeach
                    </ul>
                </div>
            @endforeach
        </div>
    @endif
    <div class="content rich-text">
        {!! $content ?? ($post->content ?? '') !!}
    </div>
</article>
@endsection
