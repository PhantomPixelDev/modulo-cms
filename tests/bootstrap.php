<?php

/*
|--------------------------------------------------------------------------
| Test bootstrap
|--------------------------------------------------------------------------
|
| PHPUnit's <env name="..." force="true"> writes $_ENV and putenv(), but not
| $_SERVER. Laravel's Env repository reads $_SERVER first, so any variable the
| environment already defines wins over phpunit.xml.
|
| Inside the development container that is not a footnote. Compose passes
| .env.dev straight in, so DB_CONNECTION=pgsql and DB_DATABASE=modulo were
| beating the sqlite/:memory: values in phpunit.xml -- which means the suite ran
| against the development database and RefreshDatabase dropped every table in
| it. CACHE_STORE=file leaked the same way, leaving rate-limiter counters in a
| named volume where they survived between runs until throttled routes started
| returning 429.
|
| Copying the values PHPUnit set into $_SERVER makes phpunit.xml authoritative
| again, which is what it always looked like it was.
|
*/

foreach ($_ENV as $key => $value) {
    $_SERVER[$key] = $value;
}

require __DIR__.'/../vendor/autoload.php';
