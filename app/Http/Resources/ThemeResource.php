<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ThemeResource extends JsonResource
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
            'name' => $this->name ?? 'Unknown Theme',
            'slug' => $this->slug ?? 'unknown',
            'version' => $this->version ?? '1.0.0',
            'description' => $this->description,
            'template_engine' => $this->template_engine,
            'is_active' => (bool) $this->is_active,
            'is_installed' => (bool) $this->is_installed,
        ];
    }
}
