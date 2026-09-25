<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shop_coupons', function (Blueprint $table) {
            $table->id();
            // Stored upper-case; customers may type it in any case.
            $table->string('code', 64)->unique();
            $table->string('description')->nullable();
            // percent, fixed, free_shipping
            $table->string('type', 20);
            $table->decimal('amount', 10, 2)->default(0);
            $table->decimal('min_subtotal', 10, 2)->nullable();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->unsignedInteger('usage_limit')->nullable();
            $table->unsignedInteger('used_count')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shop_coupons');
    }
};
