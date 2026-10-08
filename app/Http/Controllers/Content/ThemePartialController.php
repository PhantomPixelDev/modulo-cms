<?php

namespace App\Http\Controllers\Content;

use App\Http\Controllers\Controller;
use App\Services\ThemeManager;
use App\Services\ThemePartialService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ThemePartialController extends Controller
{
    public function index(Request $request, ThemeManager $themes, ThemePartialService $partials): Response
    {
        abort_unless($request->user()?->canAny(['view themes', 'create posts', 'edit posts', 'create pages', 'edit pages']), 403);
        $theme = $themes->getActiveTheme();
        $items = [];
        foreach ($partials->registry($theme) as $name => $partial) {
            $items[] = [
                'name' => $name,
                'label' => $partial['label'],
                'description' => $partial['description'],
                'body' => $partial['body'],
                'defaults' => (object) $partial['defaults'],
            ];
        }

        return Inertia::render('admin/partials/Index', [
            'adminSection' => 'partials',
            'partialCatalog' => $items,
            'themeName' => $theme?->name,
        ]);
    }
}
