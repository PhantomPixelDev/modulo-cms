<?php

return [

    // Requests per minute per token (or per IP without one) on /api/v1.
    'rate_limit' => (int) env('MODULO_API_RATE_LIMIT', 120),

    // Largest page size a client may ask for.
    'max_per_page' => 100,

];
