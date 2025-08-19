<footer class="bg-gray-800 dark:bg-gray-900 text-white mt-12">
    <div class="container mx-auto px-4 py-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div class="col-span-1 md:col-span-2">
                <h3 class="text-lg font-semibold mb-4">{{site_name}}</h3>
                <p class="text-gray-300 mb-4">{{site_description}}</p>
                <div class="flex space-x-4">
                    {{social_links}}
                </div>
            </div>
            
            <div>
                <h4 class="text-md font-semibold mb-4">Quick Links</h4>
                <ul class="space-y-2 text-gray-300">
                    {{footer_links}}
                </ul>
            </div>
            
            <div>
                <h4 class="text-md font-semibold mb-4">Contact</h4>
                <div class="text-gray-300 space-y-2">
                    {{contact_info}}
                </div>
            </div>
        </div>
        
        <div class="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {{current_year}} {{site_name}}. All rights reserved.</p>
            {{footer_extra}}
        </div>
    </div>
</footer>
