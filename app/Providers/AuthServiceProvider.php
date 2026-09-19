<?php

namespace App\Providers;

use App\Models\Menu;
use App\Models\MenuItem;
use App\Models\Page;
use App\Models\Post;
use App\Models\PostType;
use App\Models\SiteSetting;
use App\Models\Taxonomy;
use App\Models\TaxonomyTerm;
use App\Models\Template;
use App\Models\Theme;
use App\Models\User;
use App\Policies\RolePolicy;
use App\Policies\SiteSettingPolicy;
use App\Policies\TemplatePolicy;
use App\Policies\ThemePolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use Spatie\Permission\Models\Role;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Role::class => RolePolicy::class,
        Theme::class => ThemePolicy::class,
        Template::class => TemplatePolicy::class,
        User::class => \App\Policies\UserPolicy::class,
        Post::class => \App\Policies\PostPolicy::class,
        Page::class => \App\Policies\PagePolicy::class,
        PostType::class => \App\Policies\PostTypePolicy::class,
        Taxonomy::class => \App\Policies\TaxonomyPolicy::class,
        TaxonomyTerm::class => \App\Policies\TaxonomyTermPolicy::class,
        Menu::class => \App\Policies\MenuPolicy::class,
        MenuItem::class => \App\Policies\MenuItemPolicy::class,
        SiteSetting::class => SiteSettingPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        // Allow super-admin to bypass checks
        Gate::before(function (User $user, string $ability) {
            return $user->hasRole('super-admin') ? true : null;
        });
    }
}
