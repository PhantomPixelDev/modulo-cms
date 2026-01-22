<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Maintenance Mode - {{ config('app.name') }}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Instrument Sans', sans-serif;
            background-color: oklch(0.98 0.005 240);
            color: oklch(0.12 0.02 240);
        }
    </style>
</head>
<body class="flex items-center justify-center min-h-screen p-4">
    <div class="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
        <div class="flex justify-center">
            <div class="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            </div>
        </div>
        <div class="space-y-2">
            <h1 class="text-2xl font-bold tracking-tight">Maintenance Mode</h1>
            <p class="text-gray-500">
                {{ $message ?? 'We are currently undergoing maintenance. Please check back soon.' }}
            </p>
        </div>
        <div class="pt-4 border-t border-gray-100">
            <p class="text-sm text-gray-400">
                Admin? <a href="/login" class="text-blue-600 hover:underline font-semibold">Login here</a>
            </p>
        </div>
    </div>
</body>
</html>
