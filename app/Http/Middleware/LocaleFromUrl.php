<?php

namespace App\Http\Middleware;

use App\Models\Locale;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Session;
use Symfony\Component\HttpFoundation\Response;

class LocaleFromUrl
{
    /**
     * Handle an incoming request with locale prefix in URL.
     * 
     * Routes using this middleware should have a {locale} parameter.
     * Example: Route::get('/{locale}/posts', ...)->middleware('locale.url')
     */
    public function handle(Request $request, Closure $next): Response
    {
        $localeCode = $request->route('locale');
        
        if ($localeCode && Locale::isValidCode($localeCode)) {
            App::setLocale($localeCode);
            Session::put('locale', $localeCode);
            
            // Share current locale with views
            view()->share('currentLocale', $localeCode);
        }
        
        return $next($request);
    }
}
