@extends('errors.layout')

@section('title', 'Server Error')

@section('content')
<div class="text-center">
    <div class="mb-8">
        <h1 class="text-6xl font-bold text-red-600 mb-4">500</h1>
        <h2 class="text-2xl font-semibold text-gray-700 mb-2">Server Error</h2>
        <p class="text-gray-600 mb-6">
            Something went wrong on our end. We're working to fix the issue.
        </p>
    </div>

    <div class="space-y-4">
        <a href="{{ url('/') }}"
           class="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150">
            Go Home
        </a>

        <div class="mt-6">
            <button onclick="location.reload()"
                    class="inline-flex items-center px-4 py-2 bg-gray-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 focus:bg-gray-700 active:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition ease-in-out duration-150">
                Try Again
            </button>
        </div>
    </div>

    @if(config('app.debug'))
    <div class="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
        <h4 class="text-sm font-semibold text-red-800 mb-2">Error Details:</h4>
        <p class="text-xs text-red-700">
            <strong>Message:</strong> {{ $exception->getMessage() ?? 'Unknown error' }}<br>
            <strong>File:</strong> {{ $exception->getFile() ?? 'Unknown' }}<br>
            <strong>Line:</strong> {{ $exception->getLine() ?? 'Unknown' }}<br>
            <strong>URL:</strong> {{ request()->fullUrl() }}<br>
            <strong>Time:</strong> {{ now()->format('Y-m-d H:i:s') }}
        </p>
    </div>
    @endif

    <div class="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
        <h4 class="text-sm font-semibold text-blue-800 mb-2">What you can do:</h4>
        <ul class="text-sm text-blue-700 list-disc list-inside space-y-1">
            <li>Try refreshing the page</li>
            <li>Go back to the previous page</li>
            <li>Return to the homepage</li>
            <li>Contact support if the problem persists</li>
        </ul>
    </div>
@endsection
