<?php

namespace Plugins\ModuloShop\src\Http\Controllers;

use App\Services\ReactTemplateRenderer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Plugins\ModuloShop\src\Services\CartService;

class CartController
{
    protected CartService $cartService;
    protected ReactTemplateRenderer $reactRenderer;

    public function __construct(CartService $cartService, ReactTemplateRenderer $reactRenderer)
    {
        $this->cartService = $cartService;
        $this->reactRenderer = $reactRenderer;
    }

    public function index(Request $request): JsonResponse|Response
    {
        $cart = $this->cartService->getCartWithProducts();
        $totals = $this->cartService->getTotals();

        if ($request->wantsJson()) {
            return response()->json([
                'cart' => $cart,
                'totals' => $totals,
            ]);
        }

        return $this->reactRenderer->render('Shop/Cart', [
            'cart' => $cart,
            'totals' => $totals,
        ]);
    }

    public function add(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|integer',
            'quantity' => 'integer|min:1',
        ]);

        try {
            $cart = $this->cartService->addItem(
                $validated['product_id'],
                $validated['quantity'] ?? 1
            );

            return response()->json([
                'success' => true,
                'message' => 'Product added to cart',
                'cart' => $cart,
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|integer',
            'quantity' => 'required|integer|min:0',
        ]);

        try {
            $cart = $this->cartService->updateItemQuantity(
                $validated['product_id'],
                $validated['quantity']
            );

            return response()->json([
                'success' => true,
                'message' => 'Cart updated',
                'cart' => $cart,
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function remove(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|integer',
        ]);

        $cart = $this->cartService->removeItem($validated['product_id']);

        return response()->json([
            'success' => true,
            'message' => 'Item removed from cart',
            'cart' => $cart,
        ]);
    }

    public function clear(): JsonResponse
    {
        $this->cartService->clear();

        return response()->json([
            'success' => true,
            'message' => 'Cart cleared',
            'cart' => $this->cartService->getCartWithProducts(),
        ]);
    }

    public function count(): JsonResponse
    {
        return response()->json([
            'count' => $this->cartService->getItemCount(),
        ]);
    }

    public function mini(): JsonResponse
    {
        $cart = $this->cartService->getCartWithProducts();
        
        return response()->json([
            'items' => array_slice($cart['items'], 0, 5),
            'item_count' => $cart['item_count'],
            'subtotal' => $cart['subtotal'],
            'currency' => $cart['currency'],
            'is_empty' => $cart['is_empty'],
        ]);
    }
}
