<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\SiteSetting;
use App\Services\SiteSettingsService;
use App\Models\PostType;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SiteSettingsController extends Controller
{
    public function __construct(
        protected SiteSettingsService $settings
    ) {}

    /**
     * Display site settings
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', SiteSetting::class);

        $group = $request->query('group', 'general');
        $currentLocale = $request->query('locale', \App\Models\Locale::getDefault()?->code ?? config('app.fallback_locale', 'en'));
        $locales = \App\Models\Locale::getActive();
        $validGroups = ['general', 'reading', 'writing', 'permalinks', 'seo', 'social', 'analytics', 'media', 'advanced'];
        
        if (!in_array($group, $validGroups)) {
            $group = 'general';
        }

        // Get all settings organized by group
        $allSettings = $this->settings->getAllByGroup($currentLocale);
        $defaults = SiteSetting::getDefaults();

        // Merge with defaults to ensure all keys exist
        foreach ($defaults as $groupName => $groupSettings) {
            if (!isset($allSettings[$groupName])) {
                $allSettings[$groupName] = [];
            }
            foreach ($groupSettings as $key => $data) {
                if (!isset($allSettings[$groupName][$key])) {
                    $allSettings[$groupName][$key] = $data['value'];
                }
            }
        }

        // Get pages for front page selection
        $pages = Post::where('status', 'published')
            ->whereHas('postType', fn($q) => $q->where('name', 'page'))
            ->orderBy('title')
            ->get(['id', 'title']);

        // Get all post types for writing settings
        $postTypes = PostType::orderBy('label')->get(['id', 'name', 'label']);

        return Inertia::render('Dashboard', [
            'adminSection' => 'site-settings',
            'settingsGroup' => $group,
            'settings' => $allSettings,
            'pages' => $pages,
            'postTypes' => $postTypes,
            'timezones' => $this->getTimezones(),
            'locales' => $locales,
            'currentLocale' => $currentLocale,
        ]);
    }

    /**
     * Update settings for a group
     */
    public function update(Request $request, string $group)
    {
        $this->authorize('update', SiteSetting::class);

        $validGroups = ['general', 'reading', 'writing', 'permalinks', 'seo', 'social', 'analytics', 'media', 'advanced'];
        
        if (!in_array($group, $validGroups)) {
            return back()->withErrors(['group' => 'Invalid settings group']);
        }

        $rules = $this->getValidationRules($group);
        $currentLocale = $request->input('locale');
        $data = $request->validate($rules);

        $this->settings->updateGroup($group, $data, $currentLocale);

        return back()->with('success', ucfirst($group) . ' settings updated successfully');
    }

    /**
     * Clear settings cache
     */
    public function clearCache()
    {
        $this->authorize('update', SiteSetting::class);
        
        $this->settings->clearCache();

        return back()->with('success', 'Settings cache cleared');
    }

    /**
     * Get validation rules for each group
     */
    protected function getValidationRules(string $group): array
    {
        return match ($group) {
            'general' => [
                'site_name' => 'required|string|max:255',
                'site_tagline' => 'nullable|string|max:500',
                'site_url' => 'required|url|max:255',
                'admin_email' => 'nullable|email|max:255',
                'timezone' => 'required|string|max:100',
                'date_format' => 'required|string|max:50',
                'time_format' => 'required|string|max:50',
            ],
            'reading' => [
                'posts_per_page' => 'required|integer|min:1|max:100',
                'show_on_front' => 'required|in:posts,page',
                'front_page_id' => 'nullable|integer',
                'posts_page_id' => 'nullable|integer',
                'feed_limit' => 'required|integer|min:1|max:100',
            ],
            'writing' => [
                'default_post_status' => 'required|in:draft,published,pending',
                'default_post_type' => 'required|string|max:50',
            ],
            'permalinks' => [
                'permalink_structure' => 'required|string|max:255',
                'category_base' => 'nullable|string|max:100',
                'tag_base' => 'nullable|string|max:100',
            ],
            'seo' => [
                'meta_title_suffix' => 'nullable|string|max:100',
                'meta_description' => 'nullable|string|max:500',
                'robots_txt' => 'nullable|string|max:5000',
                'indexnow_key' => 'nullable|string|max:100',
                'google_site_verification' => 'nullable|string|max:100',
                'bing_site_verification' => 'nullable|string|max:100',
            ],
            'social' => [
                'facebook_url' => 'nullable|url|max:255',
                'twitter_url' => 'nullable|url|max:255',
                'instagram_url' => 'nullable|url|max:255',
                'linkedin_url' => 'nullable|url|max:255',
                'youtube_url' => 'nullable|url|max:255',
                'github_url' => 'nullable|url|max:255',
            ],
            'analytics' => [
                'google_analytics_id' => 'nullable|string|max:50',
                'gtm_container_id' => 'nullable|string|max:50',
            ],
            'media' => [
                'max_upload_size' => 'required|integer|min:1|max:100',
                'image_quality' => 'required|integer|min:1|max:100',
                'allowed_mime_types' => 'nullable|array',
                'allowed_mime_types.*' => 'string',
            ],
            'advanced' => [
                'maintenance_mode' => 'nullable|boolean',
                'maintenance_message' => 'nullable|string|max:1000',
                'enable_comments' => 'nullable|boolean',
                'registration_enabled' => 'nullable|boolean',
            ],
            default => [],
        };
    }

    /**
     * Get list of timezones
     */
    protected function getTimezones(): array
    {
        $timezones = [];
        $regions = [
            'Africa' => \DateTimeZone::AFRICA,
            'America' => \DateTimeZone::AMERICA,
            'Asia' => \DateTimeZone::ASIA,
            'Atlantic' => \DateTimeZone::ATLANTIC,
            'Australia' => \DateTimeZone::AUSTRALIA,
            'Europe' => \DateTimeZone::EUROPE,
            'Pacific' => \DateTimeZone::PACIFIC,
        ];

        foreach ($regions as $name => $mask) {
            $zones = \DateTimeZone::listIdentifiers($mask);
            foreach ($zones as $zone) {
                $timezones[] = $zone;
            }
        }

        return $timezones;
    }
}
