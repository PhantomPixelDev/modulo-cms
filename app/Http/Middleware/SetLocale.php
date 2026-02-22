<?php

namespace App\Http\Middleware;

use App\Models\Locale;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Session;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * Handle an incoming request.
     *
     * Locale resolution priority:
     * 1. Query parameter (?lang=xx)
     * 2. Session value
     * 3. Authenticated user preference
     * 4. Accept-Language header
     * 5. Site default locale
     * 6. Application fallback locale
     */
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $this->resolveLocale($request);
        
        // Set the application locale
        App::setLocale($locale);
        
        // Store in session for subsequent requests
        Session::put('locale', $locale);
        
        return $next($request);
    }

    /**
     * Resolve the locale from various sources
     */
    protected function resolveLocale(Request $request): string
    {
        // 1. Query parameter (for switching languages)
        if ($queryLocale = $request->query('lang')) {
            if (Locale::isValidCode($queryLocale)) {
                return $queryLocale;
            }
        }

        // 2. Session value
        if ($sessionLocale = Session::get('locale')) {
            if (Locale::isValidCode($sessionLocale)) {
                return $sessionLocale;
            }
        }

        // 3. Authenticated user preference
        if ($user = $request->user()) {
            if ($user->locale && Locale::isValidCode($user->locale)) {
                return $user->locale;
            }
        }

        // 4. Accept-Language header
        $browserLocale = $this->parseAcceptLanguage($request);
        if ($browserLocale && Locale::isValidCode($browserLocale)) {
            return $browserLocale;
        }

        // 5. Site default locale from database
        $defaultLocale = Locale::getDefault();
        if ($defaultLocale) {
            return $defaultLocale->code;
        }

        // 6. Application fallback
        return config('app.fallback_locale', 'en');
    }

    /**
     * Parse the Accept-Language header to find a matching locale
     */
    protected function parseAcceptLanguage(Request $request): ?string
    {
        $acceptLanguage = $request->header('Accept-Language');
        
        if (!$acceptLanguage) {
            return null;
        }

        // Parse Accept-Language header (e.g., "en-US,en;q=0.9,es;q=0.8")
        $languages = [];
        foreach (explode(',', $acceptLanguage) as $part) {
            $part = trim($part);
            $quality = 1.0;
            
            if (str_contains($part, ';q=')) {
                [$part, $q] = explode(';q=', $part);
                $quality = (float) $q;
            }
            
            // Extract base language code (e.g., "en" from "en-US")
            $code = strtolower(explode('-', trim($part))[0]);
            
            if (!isset($languages[$code]) || $languages[$code] < $quality) {
                $languages[$code] = $quality;
            }
        }

        // Sort by quality descending
        arsort($languages);

        // Return first valid locale
        foreach (array_keys($languages) as $code) {
            if (Locale::isValidCode($code)) {
                return $code;
            }
        }

        return null;
    }
}
