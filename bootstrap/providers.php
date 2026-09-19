<?php

use App\Providers\AppServiceProvider;
use App\Providers\AuthServiceProvider;
use App\Providers\DynamicRouteServiceProvider;
use App\Providers\PluginServiceProvider;
use App\Providers\SiteSettingsServiceProvider;

return [
    SiteSettingsServiceProvider::class,
    AppServiceProvider::class,
    AuthServiceProvider::class,
    DynamicRouteServiceProvider::class,
    PluginServiceProvider::class,
];
