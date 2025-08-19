@extends('themes::modern.templates.layout')

@section('content')
<section>
    <h1>Home</h1>
    <p>Welcome to our website! Explore the features and content of Modulo CMS, designed to provide a seamless and modern user experience.</p>
</section>
<section class="content-list">
    <h2>Welcome to the Modulo CMS</h2>
    <p>This is a simple and modern theme for Modulo CMS, crafted to deliver a clean and intuitive interface for managing your content efficiently.</p>
    <p>Whether you're a content creator, developer, or administrator, Modulo CMS offers tools to streamline your workflow and enhance productivity.</p>
    <span>
        @if (Route::has('dashboard'))
            <a href="{{ route('dashboard') }}" class="btn btn-primary">Admin Dashboard</a>
        @else
            <a href="/dashboard" class="btn btn-primary">Admin Dashboard</a>
        @endif
    </span>
    <div class="features">
        <h3>Key Features</h3>
        <ul>
            <li>Responsive design for all devices</li>
            <li>Easy-to-use content editor</li>
            <li>Customizable themes and templates</li>
            <li>Secure admin access and user management</li>
        </ul>
    </div>
</section>
@endsection


