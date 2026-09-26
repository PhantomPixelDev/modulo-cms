@extends('errors.layout')

@section('title', 'Back Soon')

@section('content')
<div class="text-center">
    <div class="mb-8">
        <h1 class="text-6xl font-bold text-gray-900 mb-4">503</h1>
        <h2 class="text-2xl font-semibold text-gray-700 mb-2">Back Soon</h2>
        <p class="text-gray-600 mb-6">We're doing some maintenance and will be back in a few minutes.</p>
    </div>

    <div class="flex flex-wrap justify-center gap-3">
        <button type="button" data-action="reload" class="inline-flex items-center px-4 py-2 bg-gray-600 rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">Try Again</button>
    </div>
</div>
@endsection
