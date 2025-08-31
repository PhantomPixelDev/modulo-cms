<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UserRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query();

        // Apply search filter
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%$search%")
                  ->orWhere('email', 'like', "%$search%");
        }

        // Apply sorting
        $sort = $request->input('sort', 'created_at');
        $direction = $request->input('direction', 'desc');
        $query->orderBy($sort, $direction);

        // Apply pagination
        $perPage = $request->input('per_page', 10);
        $users = $query->paginate($perPage);

        return Inertia::render('Dashboard/Admin/Users/Index', [
            'users' => $users,
        ]);
    }

    public function create()
    {
        return Inertia::render('Dashboard/Admin/Users/Create');
    }

    public function store(UserRequest $request)
    {
        $user = User::create($request->validated());
        return redirect()->route('dashboard.admin.users.show', $user->id)
                         ->with('success', 'User created successfully.');
    }

    public function show(User $user)
    {
        return Inertia::render('Dashboard/Admin/Users/Show', [
            'user' => $user,
        ]);
    }

    public function edit(User $user)
    {
        return Inertia::render('Dashboard/Admin/Users/Edit', [
            'user' => $user,
        ]);
    }

    public function update(UserRequest $request, User $user)
    {
        $user->update($request->validated());
        return redirect()->route('dashboard.admin.users.show', $user->id)
                         ->with('success', 'User updated successfully.');
    }

    public function destroy(User $user)
    {
        $user->delete();
        return redirect()->route('dashboard.admin.users.index')
                         ->with('success', 'User deleted successfully.');
    }
}
