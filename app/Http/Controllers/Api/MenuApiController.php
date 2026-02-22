<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MenuService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MenuApiController extends Controller
{
    public function showBySlug(Request $request, string $slug, MenuService $menus)
    {
        Validator::make(['slug' => $slug], [
            'slug' => ['required', 'string', 'max:100', 'regex:/^[a-z0-9\-_.]+$/i'],
        ])->validate();

        return response()->json($menus->menuArrayBySlug($slug));
    }

    public function showByLocation(Request $request, string $location, MenuService $menus)
    {
        Validator::make(['location' => $location], [
            'location' => ['required', 'string', 'max:100', 'regex:/^[a-z0-9\-_.]+$/i'],
        ])->validate();

        return response()->json($menus->menuArrayByLocation($location));
    }
}
