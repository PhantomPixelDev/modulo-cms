<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Products are stored as posts of the "product" type; this table was never
 * read or written. Dropped only when empty, so no data can be lost.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('shop_products')) {
            return;
        }

        if (DB::table('shop_products')->exists()) {
            return;
        }

        Schema::drop('shop_products');
    }

    public function down(): void
    {
        if (Schema::hasTable('shop_products')) {
            return;
        }

        Schema::create('shop_products', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
        });
    }
};
