@extends('errors.layout')

@section('title', 'Access Denied')

@section('content')
<div class="text-center">
    <div class="mb-8">
        <h1 class="text-6xl font-bold text-gray-900 mb-4">403</h1>
        <h2 class="text-2xl font-semibold text-gray-700 mb-2">Access Denied</h2>
        <p class="text-gray-600 mb-6">You don't have permission to see this page. If you think you should, sign in with another account or ask the site owner.</p>
    </div>

    <div class="flex flex-wrap justify-center gap-3">
        <a href="{{ url('/') }}" class="inline-flex items-center px-4 py-2 bg-blue-600 rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Go Home</a>
        <button type="button" data-action="back" class="inline-flex items-center px-4 py-2 bg-gray-600 rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">Go Back</button>
    </div>
</div>
@endsection
