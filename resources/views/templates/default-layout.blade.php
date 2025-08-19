<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}} - {{site_name}}</title>
    <meta name="description" content="{{description}}">
    <link rel="stylesheet" href="/build/assets/app.css">
    {{head_extra}}
</head>
<body class="bg-gray-50 dark:bg-gray-900">
    {{header}}
    
    <main class="container mx-auto px-4 py-8">
        {{content}}
    </main>
    
    {{footer}}
    
    <script src="/build/assets/app.js"></script>
    {{scripts_extra}}
</body>
</html>
