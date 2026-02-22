<?php

namespace App\Http\Controllers;

use App\Models\Locale;
use App\Services\SitemapBuilder;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Schema;

class SitemapController extends Controller
{
    public function index(Request $request, SitemapBuilder $builder): Response
    {
        $locale = $request->query('locale');
        if ($locale && (!Schema::hasTable('locales') || !Locale::isValidCode($locale))) {
            $locale = null;
        }

        // If DB is not migrated yet, return a minimal sitemap with just the home page
        if (!Schema::hasTable('posts')) {
            $homeUrl = $locale ? url('/' . trim($locale, '/')) : url('/');
            $home = htmlspecialchars($homeUrl, ENT_XML1 | ENT_COMPAT, 'UTF-8');
            $xml = <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>{$home}</loc>
  </url>
</urlset>
XML;
            return response($xml, 200, ['Content-Type' => 'application/xml']);
        }

        $xml = $builder->getXml($locale);
        $headers = ['Content-Type' => 'application/xml'];
        if ($locale) {
            $headers['Content-Language'] = $locale;
        }

        return response($xml, 200, $headers);
    }
}
