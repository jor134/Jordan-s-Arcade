# THE BACK ROOM

A walk-in arcade hall that links nine browser games. Single-file front end
(`index.html`), Three.js r128 from CDN, WebXR-capable.

## Deploy (phase 1 — links out, current setting)

Commit all six files to the repo root. Vercel picks it up as a static site.

    index.html
    manifest.webmanifest
    icon-192.png
    icon-512.png
    icon-maskable-512.png
    vercel.json

Machines open in a new tab. Each game keeps its own install prompt.

## Phase 2 — one origin, one install

`vercel.json` already proxies each game under a path on this domain:

    /coldwake/  /deepfall/  /saltbone/  /flint/
    /renegade/  /turbo/     /dinger/    /coldstore/  /wildmoor/

Test those paths first. When they all work, change one line near the top of
the script block in `index.html`:

    var LINK_MODE = 'proxy';

Now the manifest's `"scope": "/"` covers the hall and all nine games: install
the hall once and every machine launches standalone.

### Before you flip it, check each game for

- absolute asset paths (`/foo.png` instead of `foo.png`) — these break under a
  path prefix
- service worker registration at an absolute path (`/sw.js`) — will 404
- `localStorage` keys — all nine games share one namespace once same-origin
- anything that builds a share link from `location.origin`
- API routes — add a rewrite for each game's `/api/*` if it has one

## Controls

Flat: arrow keys or A/D to walk, Enter/Space to play, L for the list, Esc to
close it. Touch: drag to walk, tap a machine to walk to it, tap again to play.

VR: Enter VR, left stick to move, right stick to snap-turn, trigger to select a
machine. Selecting ends the session and hands you a launch card — a page cannot
open a new tab from inside an immersive session.
