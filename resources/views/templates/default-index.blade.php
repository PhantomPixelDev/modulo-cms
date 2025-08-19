<div class="space-y-8">
    <header class="text-center py-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg">
        <h1 class="text-4xl md:text-5xl font-bold mb-4">{{page_title}}</h1>
        <p class="text-xl opacity-90 max-w-2xl mx-auto">{{page_description}}</p>
        {{hero_cta}}
    </header>
    
    {{featured_content}}
    
    <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {{#each posts}}
        <article class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            {{#if featured_image}}
            <img src="{{featured_image}}" alt="{{title}}" class="w-full h-48 object-cover">
            {{/if}}
            
            <div class="p-6">
                <div class="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <time datetime="{{published_at_iso}}">{{published_at}}</time>
                    <span class="mx-2">•</span>
                    <span>{{read_time}} min read</span>
                </div>
                
                <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    <a href="{{url}}" class="hover:text-blue-600 dark:hover:text-blue-400">
                        {{title}}
                    </a>
                </h2>
                
                <p class="text-gray-600 dark:text-gray-300 mb-4">{{excerpt}}</p>
                
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <img src="{{author_avatar}}" alt="{{author_name}}" class="w-8 h-8 rounded-full mr-2">
                        <span class="text-sm text-gray-600 dark:text-gray-400">{{author_name}}</span>
                    </div>
                    
                    <a href="{{url}}" class="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
                        Read more →
                    </a>
                </div>
                
                {{taxonomy_terms}}
            </div>
        </article>
        {{/each}}
    </section>
    
    {{pagination}}
    {{sidebar}}
</div>
