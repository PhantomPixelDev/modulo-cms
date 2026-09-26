<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Middleware\CachePublicPages;
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

        $autosave = PostAutosave::where('post_id', $post->id)->where('user_id', $request->integer('as'))->first();
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
