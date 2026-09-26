<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\MailSettings;
use App\Support\ActivityLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

/**
 * System -> Email: how the site sends mail, and a test message to check it.
 */
class MailSettingsController extends Controller
{
    public function __construct(protected MailSettings $mail) {}

    public function index(): Response
    {
        $this->authorizeManage();

        return Inertia::render('Dashboard', [
            'adminSection' => 'email',
            'mailSettings' => $this->mail->current(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $this->authorizeManage();

        $smtp = $request->input('mode') === 'smtp';
        $data = $request->validate([
            'mode' => ['required', Rule::in(MailSettings::MODES)],
            'host' => [$smtp ? 'required' : 'nullable', 'string', 'max:255', 'regex:/^[A-Za-z0-9.-]+$/'],
            'port' => [$smtp ? 'required' : 'nullable', 'integer', 'between:1,65535'],
            'security' => ['nullable', Rule::in(MailSettings::SECURITY)],
            'username' => ['nullable', 'string', 'max:255'],
            'password' => ['nullable', 'string', 'max:500'],
            'forget_password' => ['sometimes', 'boolean'],
            'from_address' => ['nullable', 'email', 'max:255'],
            'from_name' => ['nullable', 'string', 'max:255'],
        ]);

        $this->mail->save($data);
        ActivityLog::record('settings.mail_updated', 'Changed how the site sends email', null, ['mode' => $data['mode']]);

        return back()->with('success', __('dashboard.email.messages.saved'));
    }

    /**
     * Send a short message with the current settings, right away (not queued),
     * so the person sees at once whether it works and, if not, why.
     */
    public function test(Request $request): RedirectResponse
    {
        $this->authorizeManage();
        $data = $request->validate(['to' => ['required', 'email', 'max:255']]);

        try {
            Mail::raw(__('dashboard.email.test_body', ['site' => config('app.url')]), function ($message) use ($data) {
                $message->to($data['to'])->subject(__('dashboard.email.test_subject'));
            });
        } catch (Throwable $e) {
            return back()->with('error', __('dashboard.email.messages.test_failed', ['reason' => $e->getMessage()]));
        }

        return back()->with('success', $this->mail->sendsMail()
            ? __('dashboard.email.messages.test_sent', ['to' => $data['to']])
            : __('dashboard.email.messages.test_logged'));
    }

    protected function authorizeManage(): void
    {
        $user = auth()->user();
        abort_unless($user !== null && ($user->can('edit settings') || $user->hasRole(['admin', 'super-admin'])), 403);
    }
}
