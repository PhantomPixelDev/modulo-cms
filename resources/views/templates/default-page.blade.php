<article class="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
    {{featured_image}}
    
    <div class="p-8">
        <header class="mb-8">
            <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {{title}}
            </h1>
            
            {{excerpt}}
            
            <div class="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                <time datetime="{{updated_at_iso}}">Last updated: {{updated_at}}</time>
                {{breadcrumbs}}
            </div>
        </header>
        
        <div class="prose prose-lg dark:prose-invert max-w-none">
            {{content}}
        </div>
        
        {{child_pages}}
        {{contact_form}}
    </div>
</article>
