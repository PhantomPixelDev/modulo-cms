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
use App\Policies\MenuItemPolicy;
use App\Policies\MenuPolicy;
use App\Policies\PagePolicy;
use App\Policies\PostPolicy;
use App\Policies\PostTypePolicy;
use App\Policies\RolePolicy;
use App\Policies\SiteSettingPolicy;
use App\Policies\TaxonomyPolicy;
use App\Policies\TaxonomyTermPolicy;
use App\Policies\TemplatePolicy;
use App\Policies\ThemePolicy;
use App\Policies\UserPolicy;
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
        User::class => UserPolicy::class,
        Post::class => PostPolicy::class,
        Page::class => PagePolicy::class,
        PostType::class => PostTypePolicy::class,
        Taxonomy::class => TaxonomyPolicy::class,
        TaxonomyTerm::class => TaxonomyTermPolicy::class,
        Menu::class => MenuPolicy::class,
        MenuItem::class => MenuItemPolicy::class,
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
