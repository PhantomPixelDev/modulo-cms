<?php

/*
|--------------------------------------------------------------------------
| Build Identity
|--------------------------------------------------------------------------
|
| The version is read from the VERSION file at the project root rather than
| from git. Three install channels have to agree on it and only a plain file
| works for all of them: .dockerignore excludes .git, so `git describe` is
| impossible inside an image build; a release tarball has no .git either; and
| the production entrypoint runs `config:cache`, so this file must stay pure
| and side-effect free.
|
| Releases rewrite VERSION. The Docker build additionally passes MODULO_VERSION
| so an image is stamped even when built from an arbitrary checkout.
|
*/

$versionFile = dirname(__DIR__).'/VERSION';

return [

    'version' => env('MODULO_VERSION') ?: (is_readable($versionFile)
        ? (trim((string) file_get_contents($versionFile)) ?: '0.0.0-dev')
        : '0.0.0-dev'),

    'commit' => env('MODULO_COMMIT', ''),

    'built_at' => env('MODULO_BUILT_AT', ''),

    /*
    | Overrides channel auto-detection. Leave empty to let App\Support\InstallChannel
    | work it out; set it when the detection would be wrong, e.g. a container
    | image built from a git checkout that still contains .git.
    */
    'channel' => env('MODULO_INSTALL_CHANNEL', ''),

];
