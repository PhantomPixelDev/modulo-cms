<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PostResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $postType = $this->whenLoaded('postType');
        $author = $this->whenLoaded('author');

        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'status' => $this->status,
            'excerpt' => $this->excerpt,
            'content' => $this->content,
            'created_at' => optional($this->created_at)->toDateTimeString(),
            'post_type_id' => $this->post_type_id,
            'postType' => $postType ? PostTypeResource::make($postType) : null,
            'author' => $author ? [
                'id' => $author->id,
                'name' => $author->name,
            ] : null,
            // Convenience fields for UI
            'postTypeLabel' => $postType ? ($postType->label ?? $postType->name ?? $postType->slug ?? '-') : '-',
            'authorName' => $author->name ?? null,
        ];
    }
}
