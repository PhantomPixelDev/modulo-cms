<?php

namespace App\Listeners;

use App\Models\Menu;
use App\Models\Page;
use App\Models\Plugin;
use App\Models\Post;
use App\Models\PostType;
use App\Models\Taxonomy;
use App\Models\Theme;
use App\Models\User;
use App\Support\ActivityLog;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Registered;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Events\Dispatcher;
use Spatie\Permission\Models\Role;

/**
 * Feeds the activity log from authentication and model events.
 *
 * Actions that are not a single model change (settings saved, upgrades,
 * backups, 2FA) are recorded where they happen with ActivityLog::record().
 */
class RecordActivity
{
    /**
     * Audited models: label, the attribute naming a record, and attributes
     * whose changes are noise (counters, bookkeeping).
     *
     * @var array<class-string<Model>, array{0: string, 1: string, 2: array<int, string>}>
     */
    public const MODELS = [
        Post::class => ['post', 'title', ['view_count']],
        Page::class => ['page', 'title', ['view_count']],
        User::class => ['user', 'email', ['remember_token', 'two_factor_last_step', 'email_verified_at']],
        Role::class => ['role', 'name', []],
        PostType::class => ['post type', 'label', []],
        Taxonomy::class => ['taxonomy', 'label', []],
        Menu::class => ['menu', 'name', []],
        Theme::class => ['theme', 'name', ['installed_at']],
        Plugin::class => ['plugin', 'name', ['last_checked_at', 'available_version', 'installed_at']],
    ];

    /** Never recorded, even as "changed". */
    protected const SECRET = ['password', 'remember_token', 'two_factor_secret', 'two_factor_recovery_codes'];

    public function subscribe(Dispatcher $events): void
    {
        $events->listen(Login::class, fn (Login $e) => ActivityLog::record('auth.login', 'Signed in', $e->user instanceof Model ? $e->user : null, [], $this->id($e->user)));
        $events->listen(Logout::class, fn (Logout $e) => $e->user !== null ? ActivityLog::record('auth.logout', 'Signed out', null, [], $this->id($e->user)) : null);
        $events->listen(Failed::class, fn (Failed $e) => ActivityLog::record('auth.failed', 'Failed sign-in for '.($e->credentials['email'] ?? 'unknown'), null, ['email' => $e->credentials['email'] ?? null], $this->id($e->user)));
        $events->listen(Lockout::class, fn (Lockout $e) => ActivityLog::record('auth.lockout', 'Too many sign-in attempts for '.$e->request->input('email', 'unknown'), null, ['email' => $e->request->input('email')]));
        $events->listen(PasswordReset::class, fn (PasswordReset $e) => ActivityLog::record('auth.password_reset', 'Password reset', null, [], $this->id($e->user)));
        $events->listen(Registered::class, fn (Registered $e) => ActivityLog::record('user.registered', 'Registered', null, [], $this->id($e->user)));

        foreach (self::MODELS as $class => [$label, $nameAttribute, $ignored]) {
            $events->listen("eloquent.created: {$class}", fn (Model $model) => $this->created($model, $label, $nameAttribute));
            $events->listen("eloquent.updated: {$class}", fn (Model $model) => $this->updated($model, $label, $nameAttribute, $ignored));
            $events->listen("eloquent.deleted: {$class}", fn (Model $model) => $this->deleted($model, $label, $nameAttribute));
        }
    }

    protected function created(Model $model, string $label, string $nameAttribute): void
    {
        $event = match ($model::class) {
            Plugin::class, Theme::class => "{$this->key($label)}.installed",
            default => "{$this->key($label)}.created",
        };
        $verb = str_ends_with($event, 'installed') ? 'Installed' : 'Created';

        ActivityLog::record($event, "{$verb} {$label} \"{$this->name($model, $nameAttribute)}\"", $model);
    }

    /**
     * @param  array<int, string>  $ignored
     */
    protected function updated(Model $model, string $label, string $nameAttribute, array $ignored): void
    {
        $changed = array_values(array_diff(array_keys($model->getChanges()), ['updated_at', ...$ignored]));

        if ($changed === []) {
            return;
        }

        $name = $this->name($model, $nameAttribute);
        $key = $this->key($label);

        // Plugins and themes: being switched on or off is the event that matters.
        if (($model instanceof Plugin || $model instanceof Theme) && $changed === ['is_active']) {
            $on = (bool) $model->getAttribute('is_active');
            ActivityLog::record("{$key}.".($on ? 'activated' : 'deactivated'), ($on ? 'Activated' : 'Deactivated')." {$label} \"{$name}\"", $model);

            return;
        }

        if ($model instanceof Plugin && in_array('version', $changed, true)) {
            ActivityLog::record("{$key}.updated", "Updated {$label} \"{$name}\" to {$model->getAttribute('version')}", $model, [
                'from' => $model->getOriginal('version'),
                'to' => $model->getAttribute('version'),
            ]);

            return;
        }

        $properties = ['changed' => array_values(array_diff($changed, self::SECRET))];
        if (array_intersect($changed, self::SECRET) !== []) {
            $properties['secrets_changed'] = array_values(array_intersect($changed, self::SECRET));
        }
        if (in_array('status', $changed, true)) {
            $properties['status'] = ['from' => $model->getOriginal('status'), 'to' => $model->getAttribute('status')];
        }

        ActivityLog::record("{$key}.updated", "Updated {$label} \"{$name}\"", $model, $properties);
    }

    protected function deleted(Model $model, string $label, string $nameAttribute): void
    {
        $event = $model instanceof Plugin || $model instanceof Theme ? 'uninstalled' : 'deleted';

        ActivityLog::record("{$this->key($label)}.{$event}", ucfirst($event)." {$label} \"{$this->name($model, $nameAttribute)}\"", $model);
    }

    protected function name(Model $model, string $attribute): string
    {
        return (string) ($model->getAttribute($attribute) ?? '#'.$model->getKey());
    }

    protected function key(string $label): string
    {
        return str_replace(' ', '_', $label);
    }

    protected function id(mixed $user): ?int
    {
        return is_object($user) && method_exists($user, 'getAuthIdentifier') ? (int) $user->getAuthIdentifier() : null;
    }
}
