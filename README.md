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

Colour is the part that does not scale. Twelve machines use twelve
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

Twelve games gives 4/4/4 in the same room - the third row only needs a wider
plan once you pass twelve, at which point a fourth row appears and the far
wall, windows and palms all move back on their own.

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

## Camera and floor plan

    var PITCH      = 45 deg   // shallower than ~42 and the back row's
                              // screens disappear behind the middle row
    var CAM_LOOK_Y = 1.5
    var COL_SP     = 3.5      // column spacing
    var ROW_SP     = 5.6      // row spacing
    var TIER       = 0.48     // height gained per row back

Distance and field of view are derived from the viewport aspect in
`reframe()`: portrait goes to 56 degrees and pulls back, landscape to 46.

## Performance

The scene builds ~209 meshes at twelve games. Repeated decor (palm fronds, festoon bulbs,
cabinet edge trim, buttons, and all ~20 switched-off wall cabinets) is batched into `InstancedMesh`
via `instanced()` rather than drawn individually; without that it was 330.

If the average frame time is worse than 24ms over the first 100 frames after
load, `watchPerf()` hides the `decor` group once - palms, string lights and
lamp posts - and leaves the machines alone. Test on the oldest phone you care
about and adjust the 0.024 threshold if it trips when it shouldn't.

## Controls

Flat: WASD or arrow keys to walk, Enter/Space to play, L for the list, Esc to
close it. Touch: drag to walk, tap a machine to walk to it, tap again to play.

Flat movement is two-axis: left/right across a row, forward/back between rows.

VR: Enter VR, left stick to move, right stick to snap-turn, trigger to select a
machine. Selecting ends the session and hands you a launch card — a page cannot
open a new tab from inside an immersive session.
