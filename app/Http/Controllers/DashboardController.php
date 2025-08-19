<?php

namespace App\Http\Controllers;

use App\Http\Resources\PostResource;
use App\Http\Resources\PostTypeResource;
use App\Http\Resources\RoleResource;
use App\Http\Resources\TaxonomyResource;
use App\Http\Resources\ThemeResource;
use App\Http\Resources\UserResource;
use App\Models\Post;
use App\Models\PostType;
use App\Models\Taxonomy;
use App\Models\TaxonomyTerm;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();
        $isAdmin = $user && $user->hasRole(['admin', 'super-admin']);

        $data = [];

        if ($isAdmin) {
            $data['adminStats'] = [
                'users' => User::count(),
                'roles' => Role::count(),
                'posts' => Post::count(),
                'postTypes' => PostType::count(),
                'taxonomies' => Taxonomy::count(),
                'taxonomyTerms' => TaxonomyTerm::count(),
            ];

            $data['users'] = UserResource::collection(
                User::with('roles')->orderByDesc('created_at')->paginate(5)
            );

            $data['roles'] = RoleResource::collection(
                Role::with('permissions')->orderBy('name')->paginate(5)
            );

            $data['posts'] = PostResource::collection(
                Post::with(['postType', 'author'])->orderByDesc('created_at')->paginate(5)
            );

            $data['postTypes'] = PostTypeResource::collection(
                PostType::orderBy('menu_position')->get()
            );
        }

        return Inertia::render('Dashboard', $data);
    }
}
