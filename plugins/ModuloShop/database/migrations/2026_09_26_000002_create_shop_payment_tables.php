<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // One row per payment method. The config (API keys included) is stored
        // encrypted and kept out of the plugin's settings, which the generic
        // plugin screen shows to anyone who may view plugins.
        Schema::create('shop_gateway_settings', function (Blueprint $table) {
            $table->id();
            $table->string('gateway', 40)->unique();
            $table->boolean('enabled')->default(false);
            $table->text('config')->nullable();
            $table->timestamps();
        });

        // Every attempt to pay an order at a provider. provider_ref (Stripe
        // session, PayPal order, Mollie payment id) is unique per provider, so
        // a webhook delivered twice finds the same row.
        Schema::create('shop_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('shop_orders')->cascadeOnDelete();
            $table->string('gateway', 40);
            $table->string('provider_ref')->nullable();
            // pending, paid, failed, cancelled, refunded
            $table->string('status', 20)->default('pending');
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3);
            $table->json('data')->nullable();
            $table->timestamps();

            $table->unique(['gateway', 'provider_ref']);
            $table->index(['order_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shop_payments');
        Schema::dropIfExists('shop_gateway_settings');
    }
};
