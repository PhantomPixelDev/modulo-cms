<?php

namespace App\Services;

use App\Models\Post;
use App\Models\SiteSetting;
use Carbon\Carbon;

class SiteSettingsService
{
    protected array $settings = [];

    protected bool $loaded = false;

    /**
     * Get a setting value
     */
    public function get(string $key, mixed $default = null, ?string $locale = null): mixed
    {
        return SiteSetting::get($key, $default, $locale);
    }

    /**
     * Set a setting value
     */
    public function set(string $key, mixed $value, string $group = 'general', string $type = 'string'): void
    {
        SiteSetting::set($key, $value, $group, $type);
    }

    /**
     * Get all settings for a group
     */
    public function getGroup(string $group, ?string $locale = null): array
    {
        return SiteSetting::getGroup($group, $locale);
    }

    /**
     * Get all settings organized by group
     */
    public function getAllByGroup(?string $locale = null): array
    {
        $settings = SiteSetting::all();
        $grouped = [];

        foreach ($settings as $setting) {
            if (! isset($grouped[$setting->group])) {
                $grouped[$setting->group] = [];
            }
            $grouped[$setting->group][$setting->key] = SiteSetting::get($setting->key, null, $locale);
        }

        return $grouped;
    }

    /**
     * Get settings for frontend (public, non-sensitive)
     */
    public function getPublicSettings(?string $locale = null): array
    {
        return [
            'site_name' => $this->get('site_name', config('app.name'), $locale),
            'site_tagline' => $this->get('site_tagline', '', $locale),
            'site_url' => $this->get('site_url', config('app.url')),
            'timezone' => $this->get('timezone', config('app.timezone')),
            'date_format' => $this->get('date_format', 'F j, Y'),
            'time_format' => $this->get('time_format', 'g:i a'),
            'site_logo' => $this->get('site_logo', '') ?: null,
            'site_favicon' => $this->get('site_favicon', '') ?: null,
            'posts_per_page' => $this->get('posts_per_page', 10),
            'maintenance_mode' => $this->isMaintenanceMode(),
            'maintenance_message' => $this->getMaintenanceMessage($locale),
            'registration_enabled' => (bool) $this->get('registration_enabled', false),
            // Read by the page layout (verification tags, analytics snippets):
            // all of it ends up in public HTML anyway.
            'seo' => [
                'meta_title_suffix' => $this->get('meta_title_suffix', '', $locale),
                'meta_description' => $this->get('meta_description', '', $locale),
                'google_site_verification' => $this->get('google_site_verification', ''),
                'bing_site_verification' => $this->get('bing_site_verification', ''),
            ],
            'analytics' => [
                'google_analytics_id' => $this->get('google_analytics_id', ''),
                'gtm_container_id' => $this->get('gtm_container_id', ''),
            ],
            'social' => [
                'facebook' => $this->get('facebook_url', ''),
                'twitter' => $this->get('twitter_url', ''),
                'instagram' => $this->get('instagram_url', ''),
                'linkedin' => $this->get('linkedin_url', ''),
                'youtube' => $this->get('youtube_url', ''),
                'github' => $this->get('github_url', ''),
            ],
        ];
    }

    /**
     * Update multiple settings at once
     */
    public function updateGroup(string $group, array $settings, ?string $locale = null): void
    {
        $defaults = SiteSetting::getDefaults();
        $groupDefaults = $defaults[$group] ?? [];

        foreach ($settings as $key => $value) {
            $type = $groupDefaults[$key]['type'] ?? 'string';
            if ($locale && SiteSetting::isTranslatableKey($key)) {
                SiteSetting::setTranslation($key, $locale, $value, $group, $type);
            } else {
                SiteSetting::set($key, $value, $group, $type);
            }
        }
    }

    /**
     * Get SEO meta tags for head
     */
    public function getSeoMeta(?string $locale = null): array
    {
        return [
            'title_suffix' => $this->get('meta_title_suffix', '', $locale),
            'description' => $this->get('meta_description', '', $locale),
            'google_verification' => $this->get('google_site_verification', ''),
            'bing_verification' => $this->get('bing_site_verification', ''),
        ];
    }

    /**
     * Get analytics configuration
     */
    public function getAnalytics(): array
    {
        return [
            'google_analytics_id' => $this->get('google_analytics_id', ''),
            'gtm_container_id' => $this->get('gtm_container_id', ''),
        ];
    }

    /**
     * Check if site is in maintenance mode
     */
    public function isMaintenanceMode(): bool
    {
        return (bool) $this->get('maintenance_mode', false);
    }

    /**
     * Get maintenance message
     */
    public function getMaintenanceMessage(?string $locale = null): string
    {
        return $this->get('maintenance_message', 'We are currently undergoing maintenance.', $locale);
    }

    /**
     * Format a date using site settings
     */
    public function formatDate(mixed $date): string
    {
        if (! $date) {
            return '';
        }
        $date = Carbon::parse($date);

        return $date->format($this->get('date_format', 'F j, Y'));
    }

    /**
     * Format a time using site settings
     */
    public function formatTime(mixed $date): string
    {
        if (! $date) {
            return '';
        }
        $date = Carbon::parse($date);

        return $date->format($this->get('time_format', 'g:i a'));
    }

    /**
     * Format a datetime using site settings
     */
    public function formatDateTime(mixed $date): string
    {
        if (! $date) {
            return '';
        }
        $date = Carbon::parse($date);
        $format = $this->get('date_format', 'F j, Y').' '.$this->get('time_format', 'g:i a');

        return $date->format($format);
    }

    /**
     * Format a post URL using the configured permalink structure
     */
    public function formatPostUrl(Post $post): string
    {
        // The router serves /{type prefix}/{slug} and nothing else (same as the
        // sitemap). The old permalink_structure setting (%year% etc.) was never
        // routed, so honouring it here produced feed links that 404.
        $path = '/'.ltrim((string) $post->slug, '/');

        $prefix = $post->postType?->route_prefix;
        if ($prefix && $prefix !== '/') {
            return url(rtrim($prefix, '/').$path);
        }

        return url($path);
    }

    /**
     * Seed default settings
     */
    public function seedDefaults(): void
    {
        SiteSetting::seedDefaults();
    }

    /**
     * Clear settings cache
     */
    public function clearCache(): void
    {
        SiteSetting::clearCache();
    }
}
