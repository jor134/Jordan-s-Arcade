# PIER NINE

An enclosed neon beachfront arcade that links nine browser games. Single-file
front end (`index.html`), Three.js r128 from CDN, WebXR-capable.

## Adding a game

Two ways. Both end in a commit.

### From inside the arcade

Hit **+ Machine** in the top bar. Title, URL, one line, a colour and an
attract loop. It appears immediately, marked DRAFT on its marquee.

Drafts are stored in that browser only - `localStorage`, no server. Nobody
else sees them, and they vanish if you clear site data. To publish, open
**All games**, copy the generated snippet, paste it into `BUILT_IN` and
`vercel.json`, and commit.

Adding or removing a draft reloads the page. That is deliberate: room depth,
row plan, window count, wall length and walk limits are all derived from the
game list, so a reload rebuilding from data is safer than tearing the scene
down live.

Every `localStorage` call is wrapped in try/catch. In a sandboxed preview or
Safari private mode the whole feature goes quiet and the built-in twelve load
normally.

### In code

Append one object to `BUILT_IN` near the top of the script block:

    { id:'yourgame', title:'YOUR GAME', tag:'One line &middot; about it',
      ext:'https://yourgame.vercel.app/', path:'/yourgame/',
      screen:'#46e8ff',   // screen glow, floor pool, PLAY button
      body:'#1b7fd4',     // cabinet sides
      trim:'#21f0ff',     // glowing edge trim
      art:'hull' },       // key in the ART table

Everything else follows: the row plan, room depth, window count, walk limits,
step tiers, palms outside and the "OF nn" counter are all derived. Add a
`vercel.json` rewrite too if you are on proxy mode.

Colour is the part that does not scale. Thirteen machines use thirteen
distinct neon hues and the gaps between them are closing; past about fourteen
you will be picking near-duplicates. When that happens, stop assigning unique
colours and group by genre instead - all the racers blue, all the shooters
red - so the room reads as sections rather than confetti.

`art` picks the attract loop. Reuse an existing key or write a new one in the
`ART` table - a function `(ctx, w, h, t, game)` drawing one frame on a 256x192
canvas, where `t` is seconds.

### Row shape

    var MAX_PER_ROW = 4;      // rows split to keep within this
    var ROW_PLAN = null;      // or force it: [5,5]

`planRows()` splits the games as evenly as possible, extra machines going to
the front rows. Ten games gives 4/3/3. Verified for 1 to 13 games and for a
forced [5,5]: tiers stay aligned, every machine stays reachable, and the walk
limit never reaches the wall cabinets.

Thirteen games gives 4/3/3/3. The fourth row moved the far wall to -24.1, added
a fifth window with its own palm and light shaft, lengthened both walls of
switched-off cabinets, and stepped the camera back and up. None of that is
hand-placed.

Four is the practical ceiling per row. Five columns spans 14 units against a
12.5-unit desktop frame, so a row stops fitting on screen.

## How the building renders

Every wall and the ceiling is a single-sided plane with its normal pointing
inward. The chase camera sits above the 7-unit ceiling and, near the front,
outside the near wall - so it looks through their culled back faces and reads
as an open-top diorama. In VR the camera is inside, and the same geometry is a
closed room. There is no culling code; do not add `side: DoubleSide` to
`wallMat` or the roof will slam shut on the flat view.

Consequence: nothing may be placed near the near wall. Cabinets there sit
about 0.6 units in front of the chase camera and fill the frame.

Nine machines sit in a 3x3 grid across three rows. Rows step up 0.48 units
each going back so the front row never hides the one behind it; you walk up
the steps. The flat camera is a raised three-quarter chase at 45 degrees.

## Deploy (phase 1 — links out, current setting)

Commit all seven files to the repo root. Vercel picks it up as a static site.

    index.html
    sw.js
    manifest.webmanifest
    icon-192.png
    icon-512.png
    icon-maskable-512.png
    vercel.json

Machines open in a new tab. Each game keeps its own install prompt.

## Keeping games inside the installed app

This is what `LINK_MODE = 'proxy'` is for, and it is still OFF.

In external mode a machine is on another domain, outside the manifest scope,
so every launch leaves the app for a browser tab. Nothing can change that.

In proxy mode a machine is same-origin and in scope, so `openGame()` does a
plain `location.assign()` instead of `window.open('_blank')` and the game
replaces the arcade in the same window. Full screen, no browser chrome, no tab.

Coming back is the platform's own back: the button or gesture on Android, the
back button on desktop, and a swipe in from the left edge on iOS. Your position
is saved to `sessionStorage` on launch and restored on return, so you come back
standing at the machine you just played.

The first launch in an installed app shows a one-time sheet naming the right
back gesture for that platform. It exists because iOS's edge swipe is real but
invisible, and it does not fire at all under VoiceOver - a user on iOS with
VoiceOver has no way back short of force-quitting. I cannot fix that from here;
the fix would be a back control inside each game.

Drafts always open in a new tab even in proxy mode, because no rewrite exists
for them until you commit one.

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

## Camera and floor plan

    PITCH_DEG = 45 + (ROWS-3)*5, capped at 58
    MIN_DIST  = 9  + (ROWS-3)*2, capped at 13
    CAM_LOOK_Y = 1.5

Both scale with depth. Three rows or fewer keep the original 45 degrees at 9
units; a fourth row moves to 50/11, a fifth to 55/13.

Tiering alone does not solve deep grids. Raising a row also raises the cabinet
blocking it, so the chain almost cancels: going from TIER 0.48 to 0.82 - a
3.3-unit staircase - buys 0.15 units of screen clearance. Camera height is the
lever, which is why these two grow instead of TIER.

Verified for every game count from 1 to 20: worst-case screen clearance stays
positive, the camera stays above the 7.0 ceiling, and every tier step stops at
the far wall.
    var COL_SP     = 3.5      // column spacing
    var ROW_SP     = 5.6      // row spacing
    var TIER       = 0.48     // height gained per row back

Distance and field of view are derived from the viewport aspect in
`reframe()`: portrait goes to 56 degrees and pulls back, landscape to 46.

## Performance

The scene builds ~231 meshes at thirteen games. Repeated decor (palm fronds, festoon bulbs,
cabinet edge trim, buttons, and all ~20 switched-off wall cabinets) is batched into `InstancedMesh`
via `instanced()` rather than drawn individually; without that it was 330.

If the average frame time is worse than 24ms over the first 100 frames after
load, `watchPerf()` hides the `decor` group once - palms, string lights and
lamp posts - and leaves the machines alone. Test on the oldest phone you care
about and adjust the 0.024 threshold if it trips when it shouldn't.

## Installing

An **Install** button appears in the top bar, hiding itself once the arcade is
already running as an app. It opens a sheet with a one-tap install where the
browser allows it, and platform-correct manual steps where it does not.

`sw.js` exists mainly to make that button possible. Chrome dropped the
service-worker requirement for installing from the browser menu (v108 mobile,
v112 desktop) but the prompt algorithm still requires a real `fetch()` handler,
and empty handlers are deliberately ignored. No worker, no Install button.

The worker is network-first, not cache-first. Cache-first would mean you push a
change, Vercel deploys it, and you keep seeing the old arcade. It also answers
for five shell paths only and never calls `respondWith()` for anything else, so
proxied game paths pass straight through and cannot be cached by accident.

iOS never fires `beforeinstallprompt`. Those users get Share > Add to Home
Screen and no button, which is the only route Apple offers.

Menu wording moves between browser versions. The copy in `STEPS` points at what
to look for rather than reciting a menu tree, but check it occasionally.

### Correction to the proxy-mode warning below

An earlier note here said a game registering an absolute `/sw.js` would 404
under proxy mode. It will not any more - it will now serve *this* worker.
Registration succeeds, the game's own offline behaviour silently does nothing,
and no error appears. Check for absolute service worker paths before flipping
`LINK_MODE`.

## Controls

`+ Machine` now lives inside the All games panel; the top bar holds Install,
Games and Enter VR, which is all that fits on a 390px screen.

Flat: WASD or arrow keys to walk, Enter/Space to play, L for the list, Esc to
close it. Touch: drag to walk, tap a machine to walk to it, tap again to play.

Flat movement is two-axis: left/right across a row, forward/back between rows.

VR: Enter VR, left stick to move, right stick to snap-turn, trigger to select a
machine. Selecting ends the session and hands you a launch card — a page cannot
open a new tab from inside an immersive session.
