<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Template extends Model
{
    use HasFactory;
    protected $fillable = [
        'name',
        'slug',
        'type',
        'description',
        'content',
        'variables',
        'is_default',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'variables' => 'array',
        'is_default' => 'boolean',
        'is_active' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($template) {
            if (empty($template->slug)) {
                $template->slug = Str::slug($template->name);
            }
        });
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    public function renderWithData(array $data = [])
    {
        $content = $this->content;
        
        // Simple template variable replacement
        foreach ($data as $key => $value) {
            if (is_string($value) || is_numeric($value)) {
                $content = str_replace('{{' . $key . '}}', $value, $content);
            }
        }
        
        return $content;
    }

    public static function getAvailableTypes()
    {
        return [
            'layout' => 'Layout Template',
            'partial' => 'Partial Template',
            'post' => 'Post Template',
            'page' => 'Page Template',
            'index' => 'Index/Archive Template',
            'header' => 'Header Template',
            'footer' => 'Footer Template',
        ];
    }
}
