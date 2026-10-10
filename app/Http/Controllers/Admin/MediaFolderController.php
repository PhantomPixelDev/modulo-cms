<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MediaBucket;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class MediaFolderController extends Controller
{
    protected function authorizeCreate(): void
    {
        $user = auth()->user();
        if (! $user) {
            abort(403);
        }
        if ($user->can('upload media') || $user->hasRole(['admin', 'super-admin'])) {
            return;
        }
        abort(403);
    }

    protected function authorizeEdit(): void
    {
        $user = auth()->user();
        if (! $user) {
            abort(403);
        }
        if ($user->can('edit media') || $user->hasRole(['admin', 'super-admin'])) {
            return;
        }
        abort(403);
    }

    protected function authorizeDelete(): void
    {
        $user = auth()->user();
        if (! $user) {
            abort(403);
        }
        if ($user->can('delete media') || $user->hasRole(['admin', 'super-admin'])) {
            return;
        }
        abort(403);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorizeCreate();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'parent_id' => ['nullable', 'integer', 'exists:media_buckets,id'],
        ]);

        // Ensure parent exists when provided
        $parentId = $data['parent_id'] ?? null;

        MediaBucket::create([
            'name' => $data['name'],
            'parent_id' => $parentId,
        ]);

        return back()->with('success', 'Folder created');
    }

    public function update(Request $request, MediaBucket $folder): RedirectResponse
    {
        $this->authorizeEdit();

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'parent_id' => ['sometimes', 'nullable', 'integer', 'exists:media_buckets,id'],
        ]);

        if (array_key_exists('name', $data)) {
            $folder->name = (string) $data['name'];
        }
        if (array_key_exists('parent_id', $data)) {
            $parents = MediaBucket::query()->pluck('parent_id', 'id')->all();
            $seen = [$folder->id => true];
            for ($at = $data['parent_id']; $at !== null; $at = $parents[$at] ?? null) {
                if (isset($seen[$at])) {
                    throw ValidationException::withMessages(['parent_id' => 'A folder cannot be moved into itself or a descendant.']);
                }
                $seen[$at] = true;
            }
            $folder->parent_id = $data['parent_id'];
        }
        $folder->save();

        return back()->with('success', 'Folder updated');
    }

    public function destroy(MediaBucket $folder): RedirectResponse
    {
        $this->authorizeDelete();

        // Prevent delete if has children or media
        $hasChildren = $folder->children()->exists();
        $hasMedia = method_exists($folder, 'getMedia') && count($folder->getMedia('library')) > 0;
        if ($hasChildren || $hasMedia) {
            return back()->with('error', 'Folder is not empty');
        }

        $folder->delete();

        return back()->with('success', 'Folder deleted');
    }
}
