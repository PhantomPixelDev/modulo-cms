<header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
    <div class="container mx-auto px-4">
        <div class="flex items-center justify-between h-16">
            <div class="flex items-center">
                <a href="/" class="flex items-center space-x-2">
                    <img src="{{logo_url}}" alt="{{site_name}}" class="h-8 w-8">
                    <span class="text-xl font-bold text-gray-900 dark:text-white">{{site_name}}</span>
                </a>
            </div>
            
            <nav class="hidden md:flex items-center space-x-8">
                {{navigation_menu}}
            </nav>
            
            <div class="flex items-center space-x-4">
                {{search_box}}
                {{user_menu}}
            </div>
        </div>
    </div>
</header>
