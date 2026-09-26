<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Locale;
use App\Models\MenuItemTranslation;
use App\Models\PostTranslation;
use App\Models\TaxonomyTermTranslation;
use App\Support\ActivityLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Administration -> Languages: the languages content can be written in.
 * The default one is what visitors get without a language prefix.
 */
class LocaleController extends Controller
{
    /**
     * Common languages, so adding one is a pick from a list.
     *
     * @var array<string, array{0: string, 1: string, 2?: string}>
     */
    public const COMMON = [
        'ar' => ['Arabic', 'العربية', 'rtl'], 'bg' => ['Bulgarian', 'Български'], 'ca' => ['Catalan', 'Català'],
        'cs' => ['Czech', 'Čeština'], 'da' => ['Danish', 'Dansk'], 'de' => ['German', 'Deutsch'],
        'el' => ['Greek', 'Ελληνικά'], 'en' => ['English', 'English'], 'es' => ['Spanish', 'Español'],
        'et' => ['Estonian', 'Eesti'], 'fa' => ['Persian', 'فارسی', 'rtl'], 'fi' => ['Finnish', 'Suomi'],
        'fr' => ['French', 'Français'], 'he' => ['Hebrew', 'עברית', 'rtl'], 'hi' => ['Hindi', 'हिन्दी'],
        'hr' => ['Croatian', 'Hrvatski'], 'hu' => ['Hungarian', 'Magyar'], 'id' => ['Indonesian', 'Bahasa Indonesia'],
        'it' => ['Italian', 'Italiano'], 'ja' => ['Japanese', '日本語'], 'ko' => ['Korean', '한국어'],
        'lt' => ['Lithuanian', 'Lietuvių'], 'lv' => ['Latvian', 'Latviešu'], 'nb' => ['Norwegian', 'Norsk bokmål'],
        'nl' => ['Dutch', 'Nederlands'], 'pl' => ['Polish', 'Polski'], 'pt' => ['Portuguese', 'Português'],
        'pt-BR' => ['Portuguese (Brazil)', 'Português (Brasil)'], 'ro' => ['Romanian', 'Română'], 'ru' => ['Russian', 'Русский'],
        'sk' => ['Slovak', 'Slovenčina'], 'sl' => ['Slovenian', 'Slovenščina'], 'sr' => ['Serbian', 'Српски'],
        'sv' => ['Swedish', 'Svenska'], 'th' => ['Thai', 'ไทย'], 'tr' => ['Turkish', 'Türkçe'],
        'uk' => ['Ukrainian', 'Українська'], 'vi' => ['Vietnamese', 'Tiếng Việt'], 'zh' => ['Chinese', '中文'],
    ];

    public function index(): Response
    {
        $this->authorizeManage();

        $counts = $this->translationCounts();

        return Inertia::render('Dashboard', [
            'adminSection' => 'languages',
            'languages' => [
                'items' => Locale::orderByDesc('is_default')->orderBy('sort_order')->orderBy('name')->get()
                    ->map(fn (Locale $locale) => $locale->only(['id', 'code', 'name', 'native_name', 'direction', 'is_active', 'is_default'])
                        + ['translations' => $counts[$locale->code] ?? 0])
                    ->values(),
                'common' => collect(self::COMMON)
                    ->map(fn (array $language, string $code) => ['code' => $code, 'name' => $language[0], 'native_name' => $language[1], 'direction' => $language[2] ?? 'ltr'])
                    ->values(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorizeManage();

        $data = $request->validate([
            'code' => ['required', 'string', 'max:10', 'regex:/^[a-z]{2,3}(-[A-Z]{2})?$/', Rule::unique('locales', 'code')],
            'name' => ['required', 'string', 'max:100'],
            'native_name' => ['nullable', 'string', 'max:100'],
            'direction' => ['required', Rule::in(['ltr', 'rtl'])],
        ]);

        $locale = Locale::create($data + ['is_active' => true, 'is_default' => false, 'sort_order' => (int) Locale::max('sort_order') + 1]);
        $this->changed('locale.created', 'Added the language '.$locale->name);

        return back()->with('success', __('dashboard.languages.messages.added', ['name' => $locale->name]));
    }

    public function update(Request $request, Locale $language): RedirectResponse
    {
        $this->authorizeManage();

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'native_name' => ['sometimes', 'nullable', 'string', 'max:100'],
            'direction' => ['sometimes', Rule::in(['ltr', 'rtl'])],
            'is_active' => ['sometimes', 'boolean'],
            'is_default' => ['sometimes', 'accepted'],
        ]);

        if (($data['is_active'] ?? true) === false && $language->is_default) {
            return back()->with('error', __('dashboard.languages.messages.default_stays_active'));
        }

        DB::transaction(function () use ($language, $data) {
            if (! empty($data['is_default'])) {
                // One default, and it has to be switched on
                Locale::whereKeyNot($language->id)->update(['is_default' => false]);
                $data['is_default'] = true;
                $data['is_active'] = true;
            }
            $language->update($data);
        });
        $this->changed('locale.updated', 'Changed the language '.$language->name, array_keys($data));

        return back()->with('success', __('dashboard.languages.messages.saved', ['name' => $language->name]));
    }

    public function destroy(Locale $language): RedirectResponse
    {
        $this->authorizeManage();

        if ($language->is_default) {
            return back()->with('error', __('dashboard.languages.messages.default_stays'));
        }
        if (($this->translationCounts()[$language->code] ?? 0) > 0) {
            return back()->with('error', __('dashboard.languages.messages.has_content', ['name' => $language->name]));
        }

        $language->delete();
        $this->changed('locale.deleted', 'Removed the language '.$language->name);

        return back()->with('success', __('dashboard.languages.messages.removed', ['name' => $language->name]));
    }

    /**
     * How much content exists in each language (posts, pages, terms, menu items).
     *
     * @return array<string, int>
     */
    protected function translationCounts(): array
    {
        $counts = [];
        foreach ([PostTranslation::class, TaxonomyTermTranslation::class, MenuItemTranslation::class] as $model) {
            foreach ($model::query()->selectRaw('locale, count(*) as total')->groupBy('locale')->pluck('total', 'locale') as $code => $total) {
                $counts[$code] = ($counts[$code] ?? 0) + (int) $total;
            }
        }

        return $counts;
    }

    /**
     * @param  array<int, string>  $keys
     */
    protected function changed(string $event, string $description, array $keys = []): void
    {
        Locale::clearCache();
        ActivityLog::record($event, $description, null, $keys === [] ? [] : ['keys' => $keys]);
    }

    protected function authorizeManage(): void
    {
        $user = auth()->user();
        abort_unless($user !== null && ($user->can('edit settings') || $user->hasRole(['admin', 'super-admin'])), 403);
    }
}
