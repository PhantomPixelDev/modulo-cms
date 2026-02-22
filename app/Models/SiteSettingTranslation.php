<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SiteSettingTranslation extends Model
{
    use HasFactory;

    protected $fillable = [
        'site_setting_id',
        'locale',
        'value',
    ];

    public function setting(): BelongsTo
    {
        return $this->belongsTo(SiteSetting::class, 'site_setting_id');
    }
}
