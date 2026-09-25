<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\UpdateChecker;
use App\Support\InstallChannel;
use Illuminate\Http\JsonResponse;

/**
 * Reports whether a newer release exists, and how to install it here.
 *
 * Deliberately never applies anything. Delivering new code differs per channel
 * and is impossible from inside a container, so this hands over the exact
 * command instead of pretending one button fits every install.
 */
class UpdateController extends Controller
{
    public function __construct(protected UpdateChecker $checker) {}

    public function show(): JsonResponse
    {
        abort_unless($this->authorized(), 403);

        return $this->respond($this->checker->check());
    }

    public function refresh(): JsonResponse
    {
        abort_unless($this->authorized(), 403);

        return $this->respond($this->checker->check(force: true));
    }

    /**
     * @param  array<string, mixed>  $update
     */
    protected function respond(array $update): JsonResponse
    {
        return response()->json([
            'update' => $update,
            'channel' => InstallChannel::detect(),
            'commands' => $this->checker->upgradeCommands($update['latest'] ?? null),
            'canSelfUpdate' => InstallChannel::canSelfUpdate(),
        ]);
    }

    /**
     * Knowing the version, and that the site is behind, is administrator
     * information rather than something every admin-area user needs.
     */
    protected function authorized(): bool
    {
        $user = auth()->user();

        if ($user === null) {
            return false;
        }

        return $user->can('edit settings') || $user->hasRole(['admin', 'super-admin']);
    }
}
