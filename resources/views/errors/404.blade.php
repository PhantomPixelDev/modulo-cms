@extends('errors.layout')

@section('title', 'Page Not Found')

@section('content')
<div class="text-center">
    <div class="mb-8">
        <h1 class="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 class="text-2xl font-semibold text-gray-700 mb-2">Page Not Found</h2>
        <p class="text-gray-600 mb-6">
            The page you're looking for doesn't exist or has been moved.
        </p>
    </div>

    <div class="space-y-4">
        <a href="{{ url('/') }}"
           class="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150">
            Go Home
        </a>

        <div class="mt-6">
            <button onclick="history.back()"
                    class="inline-flex items-center px-4 py-2 bg-gray-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 focus:bg-gray-700 active:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition ease-in-out duration-150">
                Go Back
            </button>
        </div>
    </div>

    <div class="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 class="text-sm font-semibold text-gray-700 mb-2">Try searching for what you need:</h3>
        <form action="{{ route('search') }}" method="GET" class="flex">
            <input type="text"
                   name="q"
                   placeholder="Search..."
                   class="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <button type="submit"
                    class="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                Search
            </button>
        </form>
    </div>

    @if(config('app.debug'))
    <div class="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
        <h4 class="text-sm font-semibold text-yellow-800 mb-2">Debug Information:</h4>
        <p class="text-xs text-yellow-700">
            <strong>URL:</strong> {{ request()->fullUrl() }}<br>
            <strong>Method:</strong> {{ request()->method() }}<br>
            <strong>Requested at:</strong> {{ now()->format('Y-m-d H:i:s') }}
        </p>
    </div>
    @endif
@endsection
