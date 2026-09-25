<?php

namespace Plugins\ModuloShop\src\Http\Controllers\Admin;

use App\Support\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Plugins\ModuloShop\src\Services\PaymentService;

class PaymentSettingsController
{
    public function __construct(protected PaymentService $payments) {}

    public function index(Request $request): JsonResponse|Response
    {
        $this->authorize();

        $gateways = $this->payments->adminSummary();

        if ($request->wantsJson()) {
            return response()->json($gateways);
        }

        return Inertia::render('Dashboard', [
            'adminSection' => 'shop-payments',
            'shopGateways' => $gateways,
        ]);
    }

    public function update(Request $request, string $gateway): JsonResponse|RedirectResponse
    {
        $this->authorize();

        $handler = $this->payments->gateway($gateway);
        abort_if($handler === null, 404);

        $rules = ['enabled' => 'required|boolean', 'forget' => 'sometimes|array', 'forget.*' => 'string'];
        foreach ($handler->fields() as $field) {
            $rules['values.'.$field['key']] = match ($field['type']) {
                'select' => ['nullable', Rule::in(array_keys($field['options'] ?? []))],
                'textarea' => 'nullable|string|max:5000',
                default => 'nullable|string|max:500',
            };
        }

        $data = $request->validate($rules);

        $this->payments->saveSettings($gateway, (bool) $data['enabled'], $data['values'] ?? []);
        foreach ($data['forget'] ?? [] as $key) {
            $this->payments->forgetSecret($gateway, $key);
        }

        // Never log the values: they include API keys
        ActivityLog::record('shop.gateway_updated', "Updated {$handler->label()} payment settings", null, ['gateway' => $gateway, 'enabled' => (bool) $data['enabled']]);

        $enabledButIncomplete = $data['enabled'] && ! app(PaymentService::class)->gateway($gateway)?->isConfigured();

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'gateways' => app(PaymentService::class)->adminSummary()]);
        }

        return back()->with(
            $enabledButIncomplete ? 'warning' : 'success',
            $enabledButIncomplete
                ? "{$handler->label()} is switched on but not offered at checkout until all its keys are filled in."
                : "{$handler->label()} settings saved",
        );
    }

    protected function authorize(): void
    {
        $user = auth()->user();

        abort_unless($user && ($user->can('manage shop settings') || $user->hasRole(['admin', 'super-admin'])), 403);
    }
}
