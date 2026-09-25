<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\ApiToken;
use App\Support\ActivityLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The signed-in user's personal API tokens for /api/v1.
 */
class ApiTokenController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('settings/api-tokens', [
            'tokens' => ApiToken::where('user_id', $request->user()->id)->orderByDesc('id')->get()
                ->map(fn (ApiToken $token) => [
                    'id' => $token->id,
                    'name' => $token->name,
                    'prefix' => $token->prefix,
                    'abilities' => $token->abilities,
                    'last_used_at' => $token->last_used_at?->toIso8601String(),
                    'expires_at' => $token->expires_at?->toIso8601String(),
                    'expired' => $token->isExpired(),
                    'created_at' => $token->created_at?->toIso8601String(),
                ]),
            // Shown once, right after creating it.
            'plainTextToken' => $request->session()->get('api_token_plain'),
            'abilities' => ApiToken::ABILITIES,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'abilities' => ['required', 'array', 'min:1'],
            'abilities.*' => [Rule::in(ApiToken::ABILITIES)],
            'expires_in_days' => ['nullable', 'integer', Rule::in([7, 30, 90, 365])],
        ]);

        [$token, $plain] = ApiToken::issue(
            $request->user(),
            $data['name'],
            $data['abilities'],
            isset($data['expires_in_days']) ? now()->addDays((int) $data['expires_in_days']) : null,
        );

        ActivityLog::record('api_token.created', 'Created API token "'.$token->name.'" ('.implode(', ', $token->abilities).')', $token);

        return back()->with('api_token_plain', $plain)->with('success', 'Token created. Copy it now: it is not shown again.');
    }

    public function destroy(Request $request, int $id): RedirectResponse
    {
        $token = ApiToken::where('user_id', $request->user()->id)->findOrFail($id);
        $token->delete();

        ActivityLog::record('api_token.revoked', 'Revoked API token "'.$token->name.'"');

        return back()->with('success', 'Token revoked.');
    }
}
