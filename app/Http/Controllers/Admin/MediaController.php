<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MediaBucket;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

// Defer importing Spatie classes to runtime to avoid errors before package install

class MediaController extends Controller
{
    protected string $collection = 'library';

    public function index(Request $request): InertiaResponse|JsonResponse
    {
        $this->authorizeView();

        $folderId = $request->integer('folder_id');
        $bucket = null;
        if ($folderId) {
            $bucket = MediaBucket::find($folderId);
        }
        if (!$bucket) {
            $bucket = MediaBucket::firstOrCreate(['name' => 'default', 'parent_id' => null]);
        }

        // Filters, sorting, pagination
        $q = (string) $request->query('q', '');
        $type = (string) $request->query('type', ''); // image|video|audio|doc|other
        $sort = in_array($request->query('sort'), ['name', 'date', 'size', 'type']) ? $request->query('sort') : 'date';
        $dir = strtolower((string) $request->query('dir', 'desc')) === 'asc' ? 'asc' : 'desc';
        $perPage = (int) $request->integer('perPage', 24);
        if ($perPage < 6) $perPage = 6; if ($perPage > 96) $perPage = 96;

        $mediaPaginator = null;
        if (class_exists('Spatie\\MediaLibrary\\MediaCollections\\Models\\Media')) {
            /** @var class-string<\\Spatie\\MediaLibrary\\MediaCollections\\Models\\Media> $Media */
            $Media = '\\Spatie\\MediaLibrary\\MediaCollections\\Models\\Media';
            $query = $Media::query()
                ->where('model_type', MediaBucket::class)
                ->where('model_id', $bucket->id)
                ->where('collection_name', $this->collection);

            if ($q !== '') {
                $query->where(function ($sub) use ($q) {
                    $sub->where('name', 'like', "%$q%")
                        ->orWhere('file_name', 'like', "%$q%");
                });
            }
            if ($type !== '') {
                $type = strtolower($type);
                $query->where(function ($sub) use ($type) {
                    if (in_array($type, ['image', 'video', 'audio'])) {
                        $sub->where('mime_type', 'like', $type . '/%');
                    } elseif ($type === 'doc') {
                        $sub->where(function ($s2) {
                            $s2->where('mime_type', 'like', 'application/%')
                               ->orWhere('mime_type', 'like', 'text/%');
                        });
                    } elseif ($type === 'other') {
                        $s3 = ['image/%', 'video/%', 'audio/%', 'application/%', 'text/%'];
                        foreach ($s3 as $pat) {
                            $sub->where('mime_type', 'not like', $pat);
                        }
                    }
                });
            }

            $sortMap = [
                'name' => 'name',
                'date' => 'created_at',
                'size' => 'size',
                'type' => 'mime_type',
            ];
            $query->orderBy($sortMap[$sort] ?? 'created_at', $dir);

            // Paginate and transform items to include preview URLs
            $mediaPaginator = $query
                ->paginate($perPage)
                ->appends($request->query())
                ->through(function ($m) {
                    /** @var \Spatie\MediaLibrary\MediaCollections\Models\Media $m */
                    $fullUrl = method_exists($m, 'getFullUrl') ? $m->getFullUrl() : '';
                    $thumbUrl = $fullUrl;
                    if (method_exists($m, 'hasGeneratedConversion') && $m->hasGeneratedConversion('thumb')) {
                        $thumbUrl = $m->getFullUrl('thumb');
                    }
                    return [
                        'id' => (int) $m->id,
                        'name' => (string) $m->name,
                        'file_name' => (string) $m->file_name,
                        'mime_type' => (string) $m->mime_type,
                        'size' => (int) $m->size,
                        'url' => $fullUrl,
                        'thumb' => $thumbUrl,
                        'custom_properties' => $m->custom_properties,
                        'created_at' => (string) $m->created_at,
                        'updated_at' => (string) $m->updated_at,
                    ];
                });
        }

        // Children folders of current bucket
        $folders = MediaBucket::query()
            ->where('parent_id', $bucket->id)
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'path', 'parent_id', 'created_at', 'updated_at'])
            ->map(fn ($f) => [
                'id' => $f->id,
                'name' => $f->name,
                'slug' => $f->slug,
                'path' => $f->path,
                'parent_id' => $f->parent_id,
                'created_at' => (string) $f->created_at,
                'updated_at' => (string) $f->updated_at,
            ])->all();

        // All folders (flat), for move dialog selection
        $allFolders = MediaBucket::query()
            ->orderBy('path')
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'path', 'parent_id', 'created_at', 'updated_at'])
            ->map(fn ($f) => [
                'id' => $f->id,
                'name' => $f->name,
                'slug' => $f->slug,
                'path' => $f->path,
                'parent_id' => $f->parent_id,
                'created_at' => (string) $f->created_at,
                'updated_at' => (string) $f->updated_at,
            ])->all();

        // Build breadcrumb up to root
        $breadcrumb = [];
        $walker = $bucket;
        while ($walker) {
            $breadcrumb[] = [
                'id' => $walker->id,
                'name' => $walker->name,
                'slug' => $walker->slug,
                'path' => $walker->path,
                'parent_id' => $walker->parent_id,
                'created_at' => (string) $walker->created_at,
                'updated_at' => (string) $walker->updated_at,
            ];
            $walker = $walker->parent;
        }
        $breadcrumb = array_reverse($breadcrumb);

        if ($request->wantsJson()) {
            return response()->json([
                'media' => $mediaPaginator ?: [
                    'data' => [],
                    'current_page' => 1,
                    'last_page' => 1,
                    'per_page' => 24,
                    'total' => 0,
                ],
                'folders' => $folders,
                'allFolders' => $allFolders,
                'breadcrumb' => $breadcrumb,
                'currentFolderId' => $bucket->id,
            ]);
        }

        return Inertia::render('Dashboard', [
            'adminSection' => 'media',
            'media' => $mediaPaginator ?: [],
            'folders' => $folders,
            'allFolders' => $allFolders,
            'breadcrumb' => $breadcrumb,
            'currentFolderId' => $bucket->id,
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
            'folder_id' => 'nullable|integer|exists:media_buckets,id',
        ]);

        $bucket = null;
        if ($request->filled('folder_id')) {
            $bucket = MediaBucket::find($request->integer('folder_id'));
        }
        if (!$bucket) {
            $bucket = MediaBucket::firstOrCreate(['name' => 'default', 'parent_id' => null]);
        }
        $bucket->addMediaFromRequest('file')->toMediaCollection($this->collection);

        return back()->with('success', 'File uploaded');
    }

    public function update(Request $request, int $id)
    {
        $this->authorizeEdit();

        if (!class_exists('Spatie\\MediaLibrary\\MediaCollections\\Models\\Media')) {
            return back()->with('error', 'Media library package not installed yet.');
        }

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'alt' => ['sometimes', 'nullable', 'string', 'max:255'],
            'caption' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'folder_id' => ['sometimes', 'nullable', 'integer', 'exists:media_buckets,id'],
        ]);

        /** @var \Spatie\MediaLibrary\MediaCollections\Models\Media $media */
        $media = (\Spatie\MediaLibrary\MediaCollections\Models\Media)::findOrFail($id);
        if (array_key_exists('name', $data)) {
            $media->name = (string) $data['name'];
        }
        if (array_key_exists('alt', $data)) {
            $media->setCustomProperty('alt', $data['alt']);
        }
        if (array_key_exists('caption', $data)) {
            $media->setCustomProperty('caption', $data['caption']);
        }
        if (array_key_exists('folder_id', $data)) {
            $target = $data['folder_id'] ? MediaBucket::findOrFail((int) $data['folder_id']) : null;
            if ($target) {
                $media->model_type = MediaBucket::class;
                $media->model_id = $target->id;
            }
        }
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

    public function regenerate(?int $id = null)
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
            $bucket = MediaBucket::firstOrCreate(['name' => 'default', 'parent_id' => null]);
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

    public function bulk(Request $request)
    {
        $action = (string) $request->input('action');
        $ids = $request->input('ids');
        if (!is_array($ids) || empty($ids)) {
            return back()->with('error', 'No items selected');
        }

        if (!class_exists('Spatie\\MediaLibrary\\MediaCollections\\Models\\Media')) {
            return back()->with('error', 'Media library package not installed yet.');
        }

        /** @var class-string<\\Spatie\\MediaLibrary\\MediaCollections\\Models\\Media> $Media */
        $Media = '\\Spatie\\MediaLibrary\\MediaCollections\\Models\\Media';

        if ($action === 'delete') {
            $this->authorizeDelete();
            $Media::query()->whereIn('id', $ids)->delete();
            return back()->with('success', 'Selected media deleted');
        }

        if ($action === 'regenerate') {
            $this->authorizeEdit();
            $items = $Media::query()->whereIn('id', $ids)->get();
            if (class_exists('Spatie\\MediaLibrary\\MediaCollections\\FileManipulator')) {
                foreach ($items as $m) {
                    app('Spatie\\MediaLibrary\\MediaCollections\\FileManipulator')->createDerivedFiles($m);
                }
            }
            return back()->with('success', 'Regenerated conversions for selected media');
        }

        if ($action === 'move') {
            $this->authorizeEdit();
            $targetId = (int) $request->integer('target_folder_id');
            if (!$targetId) {
                return back()->with('error', 'Target folder is required');
            }
            $target = MediaBucket::findOrFail($targetId);
            $Media::query()->whereIn('id', $ids)->update([
                'model_type' => MediaBucket::class,
                'model_id' => $target->id,
            ]);
            return back()->with('success', 'Moved selected media');
        }

        return back()->with('error', 'Unknown action');
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
