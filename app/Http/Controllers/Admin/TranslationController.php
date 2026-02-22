<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Locale;
use App\Models\TranslationOverride;
use App\Services\TranslationService;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class TranslationController extends Controller
{
    public function __construct(protected TranslationService $translations)
    {
    }

    public function index(Request $request): Response
    {
        $this->authorizeManage();

        $domains = $this->translations->getAdminDomains();
        $locales = Schema::hasTable('locales') ? Locale::getActive() : collect();
        $selectedLocale = $request->query('locale') ?: ($locales->firstWhere('is_default', true)?->code ?? $locales->first()?->code ?? config('app.fallback_locale', 'en'));
        $selectedDomain = $request->query('domain') ?: ($domains[0] ?? 'common');
        $search = trim((string) $request->query('q', ''));

        $translations = $this->translations->getAdminTranslations($selectedLocale);
        $domainTranslations = $translations[$selectedDomain] ?? [];
        $flat = Arr::dot($domainTranslations);

        $overrides = TranslationOverride::query()
            ->where('locale', $selectedLocale)
            ->where('domain', $selectedDomain)
            ->get()
            ->keyBy('key');

        $entries = collect($flat)
            ->map(function ($value, $key) use ($overrides) {
                $override = $overrides->get($key);
                return [
                    'key' => $key,
                    'value' => $value,
                    'override' => $override?->value,
                    'is_overridden' => $override !== null,
                ];
            })
            ->filter(function ($entry) use ($search) {
                if ($search === '') {
                    return true;
                }
                $haystack = strtolower($entry['key'] . ' ' . ($entry['value'] ?? '') . ' ' . ($entry['override'] ?? ''));
                return str_contains($haystack, strtolower($search));
            })
            ->values();

        return Inertia::render('Dashboard', [
            'adminSection' => 'translations',
            'translationManager' => [
                'entries' => $entries,
                'locales' => $locales,
                'domains' => $domains,
                'currentLocale' => $selectedLocale,
                'currentDomain' => $selectedDomain,
                'search' => $search,
                'overrideCount' => $overrides->count(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $this->authorizeManage();

        $data = $request->validate([
            'locale' => 'required|string|max:10',
            'domain' => 'required|string|max:64',
            'key' => 'required|string|max:255',
            'value' => 'nullable|string',
        ]);

        if ($data['value'] === null || $data['value'] === '') {
            TranslationOverride::where('locale', $data['locale'])
                ->where('domain', $data['domain'])
                ->where('key', $data['key'])
                ->delete();
        } else {
            TranslationOverride::updateOrCreate(
                [
                    'locale' => $data['locale'],
                    'domain' => $data['domain'],
                    'key' => $data['key'],
                ],
                ['value' => $data['value']]
            );
        }

        $this->translations->clearCache($data['locale']);

        return back()->with('success', __('Translation saved.'));
    }

    public function clearCache(Request $request)
    {
        $this->authorizeManage();

        $data = $request->validate([
            'locale' => 'nullable|string|max:10',
        ]);

        $this->translations->clearCache($data['locale'] ?? null);

        return back()->with('success', __('Translation cache cleared.'));
    }

    protected function authorizeManage(): void
    {
        $user = auth()->user();
        if (!$user) {
            abort(403);
        }

        if (method_exists($user, 'can') && $user->can('edit settings')) {
            return;
        }

        if (method_exists($user, 'hasRole') && $user->hasRole(['admin', 'super-admin'])) {
            return;
        }

        abort(403);
    }
}
