<?php

namespace App\Http\Controllers\Content;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\PostTranslation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Per-locale translations of a post.
 *
 * The admin route group only proves someone may enter the admin area; writing
 * a post's translation is editing that post, so it needs the same permission.
 */
class PostTranslationController extends Controller
{
    public function store(Request $request, Post $post): RedirectResponse
    {
        $this->authorize('update', $post);

        $validated = $request->validate([
            'locale' => 'required|string|max:8',
            'title' => 'required|string|max:255',
            'slug' => 'required|string|max:255',
            'excerpt' => 'nullable|string|max:512',
            'content' => 'nullable|string',
            'seo_title' => 'nullable|string|max:255',
            'seo_description' => 'nullable|string',
        ]);

        $locale = $validated['locale'];
        unset($validated['locale']);

        // Translation slugs are unique per locale at the DB level; dedupe
        // here so a collision becomes a "-2" suffix, not a 500.
        $existingId = $post->translation($locale)?->id;
        $validated['slug'] = PostTranslation::generateUniqueSlug(
            Str::slug($validated['slug']),
            $locale,
            $existingId
        );

        $post->setTranslation($locale, $validated);

        return back()->with('success', 'Translation saved successfully.');
    }

    public function destroy(Post $post, string $locale): RedirectResponse
    {
        $this->authorize('update', $post);

        $post->translations()->where('locale', $locale)->delete();

        return back()->with('success', 'Translation deleted successfully.');
    }
}
