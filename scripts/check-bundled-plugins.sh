#!/usr/bin/env bash
# The plugins bundled in plugins/ are copies of their own repositories, which
# the plugin registry installs from. Each copy must match the release tagged
# for its plugin.json version exactly, or a site gets different code depending
# on whether the plugin came with core or from the registry.
#
# To change a bundled plugin: change its repository, tag the release, then copy
# the tagged files here (and bump nothing else).
#
#   scripts/check-bundled-plugins.sh
set -euo pipefail

declare -A REPOSITORIES=(
    [ModuloShop]=PhantomPixelDev/modulo-plugin-shop
    [ContactForm]=PhantomPixelDev/modulo-plugin-contact-form
    [HelloWorld]=PhantomPixelDev/modulo-plugin-hello-world
)

# Compared against the release package (git archive of the tag, which leaves out
# what .gitattributes marks export-ignore, e.g. build tooling); README and LICENSE
# stay in the repository only.
IGNORE=(--exclude=README.md --exclude=LICENSE)

status=0
for dir in "${!REPOSITORIES[@]}"; do
    repo="${REPOSITORIES[$dir]}"
    version="$(jq -r .version "plugins/$dir/plugin.json")"
    checkout="$(mktemp -d)"

    if ! git clone --quiet --depth 1 --branch "v$version" "https://github.com/$repo.git" "$checkout" 2>/dev/null; then
        echo "::error file=plugins/$dir/plugin.json::$repo has no release v$version. Tag it in $repo before bundling that version."
        status=1
        continue
    fi

    package="$(mktemp -d)"
    git -C "$checkout" archive HEAD | tar -x -C "$package"
    rm -rf "$checkout"
    checkout="$package"

    if diff -r -q "${IGNORE[@]}" "plugins/$dir" "$checkout" >/dev/null; then
        echo "plugins/$dir matches $repo v$version"
    else
        echo "::error file=plugins/$dir/plugin.json::plugins/$dir differs from $repo v$version:"
        diff -r -q "${IGNORE[@]}" "plugins/$dir" "$checkout" || true
        status=1
    fi
    rm -rf "$checkout"
done

exit $status
