<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaxonomyResource extends JsonResource
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
            'slug' => $this->slug,
            'is_hierarchical' => (bool) $this->is_hierarchical,
            'is_public' => (bool) $this->is_public,
        ];
    }
}
