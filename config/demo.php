<?php

return [
    // Opt in only for installations intended to be public, disposable demos.
    'enabled' => (bool) env('MODULO_DEMO', false),
];
