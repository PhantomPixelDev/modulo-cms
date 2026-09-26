<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The order's history: what staff wrote, what changed and what the
        // payment providers reported, oldest first.
        Schema::create('shop_order_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('shop_orders')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            // note (written by staff), status, payment, system
            $table->string('type', 20)->default('note');
            $table->text('message');
            // Emailed to the customer when it was added
            $table->boolean('customer_notified')->default(false);
            $table->timestamps();

            $table->index(['order_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shop_order_notes');
    }
};
