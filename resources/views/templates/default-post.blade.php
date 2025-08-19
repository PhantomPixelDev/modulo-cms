<article class="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
    {{featured_image}}
    dsdfsdf
    <div class="p-8">
        <header class="mb-6">
            <div class="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                <time datetime="{{published_at_iso}}">{{published_at}}</time>
                <span class="mx-2">•</span>
                <span>{{read_time}} min read</span>
                <span class="mx-2">•</span>
                <span>{{view_count}} views</span>
            </div>
            
            <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {{title}}
            </h1>
            
            {{excerpt}}
            
            <div class="flex items-center mt-4">
                <img src="{{author_avatar}}" alt="{{author_name}}" class="w-10 h-10 rounded-full mr-3">
                <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{author_name}}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">{{author_role}}</p>
                </div>
            </div>
        </header>
        
        <div class="prose prose-lg dark:prose-invert max-w-none">
            {{content}}
        </div>
        
        {{taxonomy_terms}}
        
        <footer class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
                <div class="flex space-x-4">
                    {{share_buttons}}
                </div>
                
                <div class="text-sm text-gray-500 dark:text-gray-400">
                    Last updated: {{updated_at}}
                </div>
            </div>
        </footer>
    </div>
    
    {{related_posts}}
    {{comments}}
</article>
