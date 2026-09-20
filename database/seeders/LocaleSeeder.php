<?php

namespace Database\Seeders;

use App\Models\Locale;
use Illuminate\Database\Seeder;

class LocaleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $locales = [
            [
                'code' => 'en',
                'name' => 'English',
                'native_name' => 'English',
                'direction' => 'ltr',
                'is_active' => true,
                'is_default' => true,
                'sort_order' => 0,
            ],
            [
                'code' => 'es',
                'name' => 'Spanish',
                'native_name' => 'Español',
                'direction' => 'ltr',
                'is_active' => true,
                'is_default' => false,
                'sort_order' => 1,
            ],
        ];

        foreach ($locales as $locale) {
            // firstOrCreate, not updateOrCreate: an administrator may have
            // renamed a locale or changed which one is default, and re-running
            // this on an upgrade must not undo that.
            Locale::firstOrCreate(
                ['code' => $locale['code']],
                $locale
            );
        }
    }
}
