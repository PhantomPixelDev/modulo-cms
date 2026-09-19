<?php

namespace App\Http\Controllers;

use App\Models\SiteSetting;
use Illuminate\Http\Response;

class RobotsController extends Controller
{
    public function __invoke(): Response
    {
        $content = SiteSetting::get('robots_txt', "User-agent: *\nAllow: /");

        return response($content)->header('Content-Type', 'text/plain');
    }
}
