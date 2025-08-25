<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MediaBucket;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

// Defer importing Spatie classes to runtime to avoid errors before package install

class MediaController extends Controller
{
    protected string $collection = 'library';

    public function index(): Response
    {
        $this->authorizeView();

        $bucket = MediaBucket::firstOrCreate(['name' => 'default']);

        $mediaItems = [];
        if (class_exists('Spatie\\MediaLibrary\\MediaCollections\\Models\\Media') && method_exists($bucket, 'getMedia')) {
            /** @var \Spatie\MediaLibrary\MediaCollections\Models\Media[] $all */
            $all = $bucket->getMedia($this->collection);
            $mediaItems = collect($all)->map(function ($m) {
                return [
                    'id' => $m->id,
                    'name' => $m->name,
                    'file_name' => $m->file_name,
                    'mime_type' => $m->mime_type,
                    'size' => $m->size,
                    'url' => $m->getUrl(),
                    'thumb' => method_exists($m, 'hasGeneratedConversion') && $m->hasGeneratedConversion('thumb') ? $m->getUrl('thumb') : $m->getUrl(),
                    'custom_properties' => $m->custom_properties,
                    'created_at' => (string) $m->created_at,
                ];
            })->all();
        }

        return Inertia::render('Dashboard', [
            'adminSection' => 'media',
            'media' => $mediaItems,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorizeUpload();

        if (!class_exists('Spatie\\MediaLibrary\\MediaCollections\\Models\\Media') || !method_exists(MediaBucket::class, 'addMediaFromRequest')) {
            return back()->with('error', 'Media library package not installed yet.');
        }

        $request->validate([
            'file' => 'required|file|max:20480', // 20MB
        ]);

        $bucket = MediaBucket::firstOrCreate(['name' => 'default']);
        $bucket->addMediaFromRequest('file')->toMediaCollection($this->collection);

        return back()->with('success', 'File uploaded');
    }

    public function update(Request $request, int $id)
    {
        $this->authorizeEdit();

        if (!class_exists('Spatie\\MediaLibrary\\MediaCollections\\Models\\Media')) {
            return back()->with('error', 'Media library package not installed yet.');
        }

        /** @var \Spatie\MediaLibrary\MediaCollections\Models\Media $media */
        $media = (\Spatie\MediaLibrary\MediaCollections\Models\Media)::findOrFail($id);
        $media->name = $request->input('name', $media->name);
        $media->setCustomProperty('alt', $request->input('alt'));
        $media->setCustomProperty('caption', $request->input('caption'));
        $media->save();

        return back()->with('success', 'Media updated');
    }

    public function destroy(int $id)
    {
        $this->authorizeDelete();

        if (!class_exists('Spatie\\MediaLibrary\\MediaCollections\\Models\\Media')) {
            return back()->with('error', 'Media library package not installed yet.');
        }

        /** @var \Spatie\MediaLibrary\MediaCollections\Models\Media $media */
        $media = (\Spatie\MediaLibrary\MediaCollections\Models\Media)::findOrFail($id);
        $media->delete();

        return back()->with('success', 'Media deleted');
    }

    public function regenerate(int $id = null)
    {
        $this->authorizeEdit();

        if (!class_exists('Spatie\\MediaLibrary\\MediaCollections\\Models\\Media')) {
            return back()->with('error', 'Media library package not installed yet.');
        }

        if ($id) {
            /** @var \Spatie\MediaLibrary\MediaCollections\Models\Media $media */
            $media = (\Spatie\MediaLibrary\MediaCollections\Models\Media)::findOrFail($id);
            if (class_exists('Spatie\\MediaLibrary\\MediaCollections\\FileManipulator')) {
                app('Spatie\\MediaLibrary\\MediaCollections\\FileManipulator')->createDerivedFiles($media);
            }
        } else {
            $bucket = MediaBucket::firstOrCreate(['name' => 'default']);
            if (method_exists($bucket, 'getMedia')) {
                $all = $bucket->getMedia($this->collection);
                foreach ($all as $media) {
                    if (class_exists('Spatie\\MediaLibrary\\MediaCollections\\FileManipulator')) {
                        app('Spatie\\MediaLibrary\\MediaCollections\\FileManipulator')->createDerivedFiles($media);
                    }
                }
            }
        }

        return back()->with('success', 'Regenerated media conversions');
    }

    protected function authorizeView(): void
    {
        $user = auth()->user();
        if (!$user) abort(403);
        if ($user->can('view media') || $user->hasRole(['admin', 'super-admin'])) return;
        abort(403);
    }

    protected function authorizeUpload(): void
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
}
