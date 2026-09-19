<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('shop_orders', 'access_token')) {
            return;
        }

        Schema::table('shop_orders', function (Blueprint $table) {
            $table->string('access_token', 64)->nullable()->after('order_number');
        });

        // Existing orders get a token too, so their confirmation links can be re-issued.
        DB::table('shop_orders')->whereNull('access_token')->orderBy('id')->chunkById(200, function ($orders) {
            foreach ($orders as $order) {
                DB::table('shop_orders')->where('id', $order->id)->update(['access_token' => Str::random(40)]);
            }
        });
    }

    public function down(): void
    {
        if (Schema::hasColumn('shop_orders', 'access_token')) {
            Schema::table('shop_orders', function (Blueprint $table) {
                $table->dropColumn('access_token');
            });
        }
    }
};
