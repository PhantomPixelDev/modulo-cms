<?php

namespace App\Http\Controllers\Install;

use App\Http\Controllers\Controller;
use App\Models\User;
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

    public function show(): Response
    {
        // Claim the run, so creating the administrator part-way through does
        // not make the site look already-installed and close the wizard.
        $this->installer->beginInstall();

        return Inertia::render('install/Index', [
            'requirements' => $this->installer->requirements(),
            'requirementsSatisfied' => $this->installer->requirementsSatisfied(),
            'database' => $this->installer->checkDatabase(),
            'canConfigureDatabase' => $this->installer->canConfigureDatabase(),
            'channel' => InstallChannel::detect(),
            'version' => Version::current(),
            'timezones' => timezone_identifiers_list(),
        ]);
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

        try {
            $this->installer->runMigrations();
            $this->installer->seedBootstrap();
        } catch (Throwable $e) {
            report($e);

            return back()->withErrors(['install' => 'Database setup failed: '.$e->getMessage()]);
        }

        return back()->with('message', 'Database ready.');
    }

    public function createAdministrator(Request $request): RedirectResponse
    {
        // Never let this create a second account: the route is unauthenticated,
        // and the only thing keeping it safe is that it stops working the
        // moment a user exists.
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

        return back()->with('message', 'Administrator created.');
    }

    public function configure(Request $request): RedirectResponse
    {
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
