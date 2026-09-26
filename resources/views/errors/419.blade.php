@extends('errors.layout')

@section('title', 'Page Expired')

@section('content')
<div class="text-center">
    <div class="mb-8">
        <h1 class="text-6xl font-bold text-gray-900 mb-4">419</h1>
        <h2 class="text-2xl font-semibold text-gray-700 mb-2">Page Expired</h2>
        <p class="text-gray-600 mb-6">This page was open too long and its form expired. Go back, reload the page and try again. Nothing was sent.</p>
    </div>

    <div class="flex flex-wrap justify-center gap-3">
        <button type="button" data-action="back" class="inline-flex items-center px-4 py-2 bg-gray-600 rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">Go Back</button>
        <a href="{{ url('/') }}" class="inline-flex items-center px-4 py-2 bg-blue-600 rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Go Home</a>
    </div>
</div>
@endsection
