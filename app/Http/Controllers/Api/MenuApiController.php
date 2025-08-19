<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MenuService;
use Illuminate\Http\Request;

class MenuApiController extends Controller
{
    public function showBySlug(string $slug, MenuService $menus)
    {
        return response()->json($menus->menuArrayBySlug($slug));
    }

    public function showByLocation(string $location, MenuService $menus)
    {
        return response()->json($menus->menuArrayByLocation($location));
    }
}
