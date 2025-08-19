<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PostTypeResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'label' => $this->label,
            'plural_label' => $this->plural_label,
            'description' => $this->description,
            'route_prefix' => $this->route_prefix,
            'slug' => $this->slug,
            'is_public' => (bool) $this->is_public,
            'is_hierarchical' => (bool) $this->is_hierarchical,
        ];
    }
}
