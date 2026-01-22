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
        $customizer = $this->customizer ?? [];

        return [
            'id' => $this->id,
            'name' => $this->name ?? 'Unknown Theme',
            'slug' => $this->slug ?? 'unknown',
            'version' => $this->version ?? '1.0.0',
            'description' => $this->description,
            'template_engine' => $this->template_engine,
            'is_active' => (bool) $this->is_active,
            'is_installed' => (bool) $this->is_installed,
            'colors' => $this->getSectionSettings($customizer, 'colors', [
                'primary' => '#3b82f6',
                'secondary' => '#64748b',
            ]),
            'typography' => $this->getSectionSettings($customizer, 'typography', [
                'font_family' => 'Inter, sans-serif',
            ]),
            'layout' => $this->getSectionSettings($customizer, 'layout', [
                'container_width' => '1200px',
            ]),
            'settings' => $customizer,
        ];
    }

    protected function getSectionSettings(array $customizer, string $section, array $defaults): array
    {
        $settings = $defaults;
        if (isset($customizer[$section]) && is_array($customizer[$section])) {
            foreach ($customizer[$section] as $key => $config) {
                if (is_array($config)) {
                    $settings[$key] = $config['default'] ?? $settings[$key] ?? null;
                } else {
                    $settings[$key] = $config;
                }
            }
        }
        return $settings;
    }
}
