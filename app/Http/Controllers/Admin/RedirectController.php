<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Redirect;
use App\Support\ActivityLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RedirectController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorizeManage();

        $redirects = Redirect::query()
            ->when($request->string('q')->toString(), fn ($q, $term) => $q->where(fn ($w) => $w
                ->where('from_path', 'like', '%'.$term.'%')
                ->orWhere('to_url', 'like', '%'.$term.'%')))
            ->orderByDesc('updated_at')
            ->paginate(50)
            ->withQueryString();

        return Inertia::render('Dashboard', [
            'adminSection' => 'redirects',
            'redirects' => [
                'items' => $redirects,
                'q' => $request->string('q')->toString(),
                'statusCodes' => Redirect::STATUS_CODES,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorizeManage();
        $data = $this->validated($request);

        $redirect = Redirect::updateOrCreate(
            ['from_path' => Redirect::normalizePath($data['from_path'])],
            ['to_url' => $this->target($data['to_url']), 'status_code' => $data['status_code'], 'automatic' => false],
        );

        ActivityLog::record('redirect.saved', "Redirected {$redirect->from_path} to {$redirect->to_url}", $redirect);

        return back()->with('success', 'Redirect saved.');
    }

    public function update(Request $request, Redirect $redirect): RedirectResponse
    {
        $this->authorizeManage();
        $data = $this->validated($request, $redirect);

        $redirect->update([
            'from_path' => Redirect::normalizePath($data['from_path']),
            'to_url' => $this->target($data['to_url']),
            'status_code' => $data['status_code'],
            'automatic' => false,
        ]);

        return back()->with('success', 'Redirect updated.');
    }

    public function destroy(Redirect $redirect): RedirectResponse
    {
        $this->authorizeManage();
        $redirect->delete();
        ActivityLog::record('redirect.deleted', "Removed the redirect from {$redirect->from_path}");

        return back()->with('success', 'Redirect removed.');
    }

    /**
     * @return array{from_path: string, to_url: string, status_code: int}
     */
    protected function validated(Request $request, ?Redirect $redirect = null): array
    {
        $data = $request->validate([
            'from_path' => ['required', 'string', 'max:500', 'regex:/^\/?[^\s]*$/'],
            // A path on this site, or an absolute http(s) URL; never javascript: and the like.
            'to_url' => ['required', 'string', 'max:1000', 'regex:#^(/|https?://)#i'],
            'status_code' => ['required', 'integer', Rule::in(Redirect::STATUS_CODES)],
        ]);

        $from = Redirect::normalizePath($data['from_path']);
        if ($from === '/') {
            throw ValidationException::withMessages(['from_path' => 'The home page cannot be redirected.']);
        }
        if ($from === Redirect::normalizePath($this->target($data['to_url'])) && ! str_starts_with($data['to_url'], 'http')) {
            throw ValidationException::withMessages(['to_url' => 'A redirect cannot point at itself.']);
        }

        if ($redirect !== null && Redirect::where('from_path', $from)->whereKeyNot($redirect->id)->exists()) {
            throw ValidationException::withMessages(['from_path' => 'There is already a redirect from this path.']);
        }

        return ['from_path' => $from, 'to_url' => $data['to_url'], 'status_code' => (int) $data['status_code']];
    }

    protected function target(string $to): string
    {
        return preg_match('#^https?://#i', $to) === 1 ? $to : Redirect::normalizePath($to);
    }

    protected function authorizeManage(): void
    {
        $user = auth()->user();
        abort_unless($user !== null && ($user->can('edit settings') || $user->hasRole(['admin', 'super-admin'])), 403);
    }
}
