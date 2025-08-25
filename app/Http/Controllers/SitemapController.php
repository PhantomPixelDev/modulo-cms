<?php

namespace App\Http\Controllers;

use Illuminate\Http\Response;
use Illuminate\Support\Facades\Schema;
use App\Services\SitemapBuilder;

class SitemapController extends Controller
{
    public function index(SitemapBuilder $builder): Response
    {
        // If DB is not migrated yet, return a minimal sitemap with just the home page
        if (!Schema::hasTable('posts')) {
            $home = htmlspecialchars(url('/'), ENT_XML1 | ENT_COMPAT, 'UTF-8');
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

        $xml = $builder->getXml();
        return response($xml, 200, ['Content-Type' => 'application/xml']);
    }
}
