<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Middleware\CachePublicPages;
use App\Models\EditorDraft;
use App\Models\Locale;
use App\Models\Post;
use App\Models\PostAutosave;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * A post or page through the theme as it would look once saved: its
 * current text, or the editor's autosave when there is one. Reached through
 * a signed, expiring link from the editor; never cached or indexed.
 */
class PreviewController extends BaseFrontendController
{
    public function __invoke(Request $request, int $postId): Response
    {
        $post = Post::with(['postType', 'author', 'taxonomyTerms.taxonomy'])->findOrFail($postId);

        $locale = $request->string('locale')->toString();
        if ($locale && $translation = $post->translation($locale)) {
            $post->forceFill($translation->only(['title', 'slug', 'excerpt', 'content']));
        }

        $draft = $request->filled('draft') ? EditorDraft::where('post_id', $post->id)->where('user_id', $request->integer('as'))
            ->where('locale', $locale)->findOrFail($request->input('draft')) : null;
        $autosave = ! $draft && (! $locale || $locale === (Locale::defaultCode()))
            ? PostAutosave::where('post_id', $post->id)->where('user_id', $request->integer('as'))->first() : null;
        if ($draft) {
            $post->forceFill(array_intersect_key($draft->payload, array_flip([
                'title', 'slug', 'excerpt', 'content', 'featured_image', 'meta_title', 'meta_description', 'meta_data',
            ])));
        }
        if ($autosave) {
            // In memory only: the preview never changes the saved post
            $post->forceFill($autosave->only(PostAutosave::FIELDS));
        }

        // A draft must never end up in a search index, even if the link travels
        $post->meta_data = array_merge((array) $post->meta_data, ['noindex' => true]);

        $template = $post->postType?->name === 'page' ? 'page' : 'post';
        $response = $this->renderContent($post, $template, $template, countView: false);
        $request->attributes->set(CachePublicPages::CACHEABLE, false);

        $response = $response->toResponse($request);
        $response->headers->set('X-Robots-Tag', 'noindex, nofollow');
        $response->headers->set('Cache-Control', 'no-store, private');

        return $response;
    }
}
