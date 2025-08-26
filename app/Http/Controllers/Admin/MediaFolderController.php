<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MediaBucket;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class MediaFolderController extends Controller
{
    protected function authorizeCreate(): void
    {
        $user = auth()->user();
        if (!$user) abort(403);
        if ($user->can('upload media') || $user->hasRole(['admin', 'super-admin'])) return;
        abort(403);
    }

    protected function authorizeEdit(): void
    {
        $user = auth()->user();
        if (!$user) abort(403);
        if ($user->can('edit media') || $user->hasRole(['admin', 'super-admin'])) return;
        abort(403);
    }

    protected function authorizeDelete(): void
    {
        $user = auth()->user();
        if (!$user) abort(403);
        if ($user->can('delete media') || $user->hasRole(['admin', 'super-admin'])) return;
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

    public function update(Request $request, MediaBucket $bucket): RedirectResponse
    {
        $this->authorizeEdit();

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'parent_id' => ['sometimes', 'nullable', 'integer', 'exists:media_buckets,id'],
        ]);

        if (array_key_exists('name', $data)) {
            $bucket->name = (string) $data['name'];
        }
        if (array_key_exists('parent_id', $data)) {
            $bucket->parent_id = $data['parent_id'];
        }
        $bucket->save();

        return back()->with('success', 'Folder updated');
    }

    public function destroy(MediaBucket $bucket): RedirectResponse
    {
        $this->authorizeDelete();

        // Prevent delete if has children or media
        $hasChildren = $bucket->children()->exists();
        $hasMedia = method_exists($bucket, 'getMedia') && count($bucket->getMedia('library')) > 0;
        if ($hasChildren || $hasMedia) {
            return back()->with('error', 'Folder is not empty');
        }

        $bucket->delete();
        return back()->with('success', 'Folder deleted');
    }
}
