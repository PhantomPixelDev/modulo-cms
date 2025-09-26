<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AdminBaseController extends Controller
{
    /**
     * The resource name for permission checks (e.g., 'pages', 'posts')
     */
    protected string $resourceName;

    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('verified');
        
        // Only apply admin middleware if not already applied at route level
        if (!request()->routeIs('dashboard.admin.*')) {
            $this->middleware('role_or_permission:super-admin|admin|access admin');
        }

        // Auto-apply resource permissions if resourceName is set
        if (isset($this->resourceName)) {
            $this->middleware("permission:view {$this->resourceName}")->only(['index', 'show']);
            $this->middleware("permission:create {$this->resourceName}")->only(['create', 'store']);
            $this->middleware("permission:edit {$this->resourceName}")->only(['edit', 'update']);
            $this->middleware("permission:delete {$this->resourceName}")->only(['destroy']);
        }
    }
}
