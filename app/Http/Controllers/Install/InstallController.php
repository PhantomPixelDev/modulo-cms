<?php

namespace App\Http\Controllers\Install;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\InstallOwnership;
use App\Services\InstallService;
use App\Support\InstallChannel;
use App\Support\Version;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

/**
 * The first-run wizard.
 *
 * Reachable only while the site is uninstalled; EnsureNotInstalled closes it
 * afterwards. Every step is guarded on its own rather than trusting the
 * client to submit them in order.
 */
class InstallController extends Controller
{
    public function __construct(protected InstallService $installer) {}

    public function show(Request $request): Response
    {
        $claimed = app(InstallOwnership::class)->claimed($request);

        return Inertia::render('install/Index', [
            'claimed' => $claimed,
            'setupStage' => $claimed ? app(InstallOwnership::class)->stage() : 'database',
            'requirements' => $claimed ? $this->installer->requirements() : [],
            'requirementsSatisfied' => $claimed && $this->installer->requirementsSatisfied(),
            'database' => $claimed ? $this->installer->checkDatabase() : ['connected' => false, 'message' => 'Claim setup to check the database.'],
            'canConfigureDatabase' => $this->installer->canConfigureDatabase(),
            'channel' => InstallChannel::detect(),
            'version' => Version::current(),
            'timezones' => timezone_identifiers_list(),
        ]);
    }

    public function claim(Request $request): RedirectResponse
    {
        $data = $request->validate(['setup_token' => ['required', 'string', 'size:64']]);
        app(InstallOwnership::class)->claim($request, $data['setup_token']);

        return redirect()->route('install.show');
    }

    /**
     * Re-run the environment checks without reloading the page.
     */
    public function requirements(): JsonResponse
    {
        return response()->json([
            'requirements' => $this->installer->requirements(),
            'requirementsSatisfied' => $this->installer->requirementsSatisfied(),
            'database' => $this->installer->checkDatabase(),
        ]);
    }

    public function migrate(): RedirectResponse
    {
        if (! $this->installer->requirementsSatisfied()) {
            return back()->withErrors(['install' => 'Resolve the environment problems above first.']);
        }

        // Migrations legitimately run before any account exists. If users are
        // already here, someone else got here first: refuse rather than let
        // an unauthenticated visitor re-run setup steps.
        if (schema_has_table('users') && User::query()->exists()) {
            return back()->withErrors(['install' => 'This site is already initialized. Sign in instead.']);
        }

        try {
            $this->installer->runMigrations();
            $this->installer->seedBootstrap();
        } catch (Throwable $e) {
            report($e);

            return back()->withErrors(['install' => 'Database setup failed. Check the server log.']);
        }

        app(InstallOwnership::class)->advance('administrator');

        return back()->with('message', 'Database ready.');
    }

    public function createAdministrator(Request $request): RedirectResponse
    {
        // Ownership is checked by middleware; serialization and the existence
        // check in InstallService also protect CLI and concurrent requests.
        if (schema_has_table('users') && User::query()->exists()) {
            return back()->withErrors(['install' => 'An account already exists. Sign in instead.']);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        try {
            $this->installer->createAdministrator(
                $validated['name'],
                $validated['email'],
                $validated['password'],
            );
        } catch (Throwable $e) {
            report($e);

            return back()->withErrors(['install' => 'Could not create the account: '.$e->getMessage()]);
        }

        app(InstallOwnership::class)->advance('site');

        return back()->with('message', 'Administrator created.');
    }

    public function configure(Request $request): RedirectResponse
    {
        if (! schema_has_table('users') || ! User::query()->exists()) {
            return back()->withErrors(['install' => 'Create the administrator account first.']);
        }
        $validated = $request->validate([
            'site_name' => ['required', 'string', 'max:255'],
            'site_description' => ['nullable', 'string', 'max:500'],
            'timezone' => ['required', 'string', 'timezone'],
            'seed_demo_content' => ['nullable', 'boolean'],
        ]);

        $this->installer->applySiteSettings([
            'site_name' => $validated['site_name'],
            'site_description' => $validated['site_description'] ?? null,
            'timezone' => $validated['timezone'],
        ]);

        if ($request->boolean('seed_demo_content')) {
            try {
                $this->installer->seedDemoContent();
            } catch (Throwable $e) {
                report($e);

                return back()->withErrors(['install' => 'Site saved, but demo content failed: '.$e->getMessage()]);
            }
        }

        app(InstallOwnership::class)->advance('done');

        return back()->with('message', 'Site configured.');
    }

    public function finish(): RedirectResponse
    {
        // Finishing without an account would lock the site permanently: the
        // installer closes and nobody can sign in.
        if (! schema_has_table('users') || ! User::query()->exists()) {
            return back()->withErrors(['install' => 'Create the administrator account first.']);
        }

        $this->installer->finish();

        return redirect('/login')->with('message', 'Modulo CMS is ready. Sign in to continue.');
    }
}
