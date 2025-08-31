<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MenuService;
use Illuminate\Http\Request;

class MenuApiController extends Controller
{
    public function showBySlug(Request $request, string $slug, MenuService $menus)
    {
        $request->validate([
            'slug' => ['required','string','max:100','regex:/^[a-z0-9\-_.]+$/i'],
        ]);
        return response()->json($menus->menuArrayBySlug($slug));
    }

    public function showByLocation(Request $request, string $location, MenuService $menus)
    {
        $request->validate([
            'location' => ['required','string','max:100','regex:/^[a-z0-9\-_.]+$/i'],
        ]);
        return response()->json($menus->menuArrayByLocation($location));
    }
}
