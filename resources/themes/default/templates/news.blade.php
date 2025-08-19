@extends('layout')

@section('content')
<div class="container mx-auto px-4 py-8">
    <header class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Latest News</h1>
        @if(isset($description) && $description)
            <p class="mt-2 text-lg text-gray-600 dark:text-gray-300">{{ $description }}</p>
        @endif
    </header>

    <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        @forelse($posts as $post)
            <article class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                @if($post->featured_image)
                    <a href="{{ route('content.show', ['postTypeSlug' => 'news', 'slug' => $post->slug]) }}">
                        <img src="{{ $post->featured_image }}" alt="{{ $post->title }}" class="w-full h-48 object-cover">
                    </a>
                @endif
                
                <div class="p-6">
                    <div class="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                        <time datetime="{{ $post->published_at->toIso8601String() }}">
                            {{ $post->published_at->format('F j, Y') }}
                        </time>
                        @if($post->author)
                            <span class="mx-2">•</span>
                            <span>{{ $post->author->name }}</span>
                        @endif
                    </div>
                    
                    <h2 class="text-xl font-semibold mb-2">
                        <a href="{{ route('content.show', ['postTypeSlug' => 'news', 'slug' => $post->slug]) }}" 
                           class="text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                            {{ $post->title }}
                        </a>
                    </h2>
                    
                    @if($post->excerpt)
                        <p class="text-gray-600 dark:text-gray-300 mb-4">{{ $post->excerpt }}</p>
                    @endif
                    
                    <a href="{{ route('content.show', ['postTypeSlug' => 'news', 'slug' => $post->slug]) }}" 
                       class="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-medium">
                        Read more
                        <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                    </a>
                </div>
            </article>
        @empty
            <div class="col-span-full text-center py-12">
                <p class="text-gray-500 dark:text-gray-400">No news articles found.</p>
            </div>
        @endforelse
    </div>

    @if($posts->hasPages())
        <div class="mt-8">
            {{ $posts->links() }}
        </div>
    @endif
</div>
@endsection
