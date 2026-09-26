<?php

namespace Plugins\ModuloShop\src\Http\Controllers\Admin;

use App\Support\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Plugins\ModuloShop\src\Models\Coupon;

class CouponController
{
    public function index(Request $request): JsonResponse|Response
    {
        $this->authorize();

        $coupons = Coupon::query()->orderByDesc('id')->paginate(50);

        if ($request->wantsJson()) {
            return response()->json($coupons);
        }

        return Inertia::render('Plugins/modulo-shop/Coupons', [
            'shopCoupons' => $coupons,
        ]);
    }

    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $this->authorize();

        $coupon = Coupon::create($this->validated($request));
        ActivityLog::record('shop.coupon_created', "Created coupon {$coupon->code}", $coupon);

        return $request->wantsJson()
            ? response()->json($coupon, 201)
            : back()->with('success', "Coupon {$coupon->code} created");
    }

    public function update(Request $request, Coupon $coupon): JsonResponse|RedirectResponse
    {
        $this->authorize();

        $coupon->update($this->validated($request, $coupon));
        ActivityLog::record('shop.coupon_updated', "Updated coupon {$coupon->code}", $coupon);

        return $request->wantsJson()
            ? response()->json($coupon)
            : back()->with('success', "Coupon {$coupon->code} updated");
    }

    public function destroy(Request $request, Coupon $coupon): JsonResponse|RedirectResponse
    {
        $this->authorize();

        // Orders keep the code as text, so deleting a coupon never touches them.
        $coupon->delete();
        ActivityLog::record('shop.coupon_deleted', "Deleted coupon {$coupon->code}");

        return $request->wantsJson()
            ? response()->json(['ok' => true])
            : back()->with('success', "Coupon {$coupon->code} deleted");
    }

    /**
     * @return array<string, mixed>
     */
    protected function validated(Request $request, ?Coupon $coupon = null): array
    {
        $request->merge(['code' => Coupon::normalizeCode((string) $request->input('code', ''))]);

        $data = $request->validate([
            'code' => ['required', 'string', 'max:64', 'regex:/^[A-Z0-9_-]+$/', Rule::unique('shop_coupons', 'code')->ignore($coupon?->id)],
            'description' => 'nullable|string|max:255',
            'type' => ['required', Rule::in(Coupon::TYPES)],
            'amount' => 'required_unless:type,free_shipping|nullable|numeric|min:0',
            'min_subtotal' => 'nullable|numeric|min:0',
            'starts_at' => 'nullable|date',
            'expires_at' => 'nullable|date|after_or_equal:starts_at',
            'usage_limit' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
        ], [
            'code.regex' => 'Use letters, numbers, dashes and underscores only.',
        ]);

        if ($data['type'] === Coupon::TYPE_PERCENT && ($data['amount'] ?? 0) > 100) {
            throw ValidationException::withMessages(['amount' => 'A percentage cannot be more than 100.']);
        }

        $data['amount'] = (float) ($data['amount'] ?? 0);

        return $data;
    }

    protected function authorize(): void
    {
        $user = auth()->user();

        abort_unless($user && ($user->can('manage shop settings') || $user->hasRole(['admin', 'super-admin'])), 403);
    }
}
