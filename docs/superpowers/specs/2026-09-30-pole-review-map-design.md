# Pole Review Map — design spec

**Status:** revised 2026-09-30, ready for implementation.
**What it is:** an unlisted portfolio page with a map of 106 NYC telecom poles. Each pole is
shown as **matches scan** or **under review**, and tapping a pole shows why.
**Audience:** Sand Technologies (Forward Deployed Engineer application). It's the link in an
outreach note.
**Source:** `timpos` branch `feat/neara-0.1.2` (commit `5f286cb`), domain
`neara-infrastructure@0.1.2`, replay hash `fc1bc3f05c86…`.

## 1. What the page shows

One sentence: *GIS records for 106 telecom poles in Lower Manhattan, checked against a LiDAR
scan; 72 match the scan and 34 need a person to look.*

Keep the page to that. **Out of the page for now:**
- The version history (0.1.0 → 0.1.1 → 0.1.2) and any "catching the bug" story.
- UTIDs, codecs, replay-hash internals, and engine names (Corus, Timpos, Libera, Facia).
- Rule sliders or "try your own rules" controls.
- The words "Neara" and "Sand".

Voice: answer → problem → how → why. Plain statements, positive framing.

## 2. Status definitions (from 0.1.2 output)

| Status | Count | Rule |
|---|---|---|
| **Matches scan** | 72 | GIS record + LiDAR base + LiDAR top all attach within 2 m, and top − base height is 10–45 ft |
| **Under review: top near ground** | 29 | Height < 10 ft. The "top" point sits almost at street level; the capture likely missed the pole top. |
| **Under review: above pole height** | 5 | Height > 45 ft (up to 245 ft). May be equipment mounted on a building rather than a pole top, which is common in NYC. |

All counts come from the data, never from copy. Under-review poles are **kept, not
rejected**: the page shows that the record stands, and asks a person to check it.

## 3. Page layout

Mobile-first. It must work at 375 px with a 16 px gutter and no horizontal scroll, in light and
dark themes, using the site's existing color tokens.

1. **Header:** "106 telecom poles, checked against a LiDAR scan". One supporting line: "72
   match the scan · 34 under review", with counts computed from the data.
2. **Map** (the main element; about 60–70% of the viewport height on mobile):
   - 106 pole markers at their GIS lat/lon.
   - **Matches scan:** a solid marker in a calm color.
   - **Under review:** an outlined, higher-contrast marker (amber) plus a shape difference, so
     status never depends on color alone. The two review reasons get distinct glyphs.
   - Optional: the 30 span lines between poles, drawn thin and muted.
   - Filter chips above the map: **All · Matches scan · Under review**, with counts on each chip.
   - Legend with status, glyph, and count.
3. **Pole detail** (bottom sheet on mobile, side panel on desktop), opened by tapping a marker:
   - Status and, if under review, the reason in one plain sentence (from §2).
   - Record: pole ID, reservation status (Installed / Approved / Proposed), franchisee,
     street and cross street.
   - Scan: base and top heights (ft), top − base height, horizontal offset from the GIS record
     (m), and the source ("NYC LiDAR tile 980195, point #7,395,528").
4. **Under-review list** below the map: a table of the 34 poles (ID, street, reason, height).
   Selecting a row focuses the pole on the map. This is also the accessible, no-map path to
   the same information.
5. **How it works** (three short sentences): each pole's reservation record is matched to the
   LiDAR points at its base and top; heights outside a normal pole range are flagged for a
   person to review, not discarded; building-mounted equipment is why tall readings are
   flagged rather than rejected.
6. **Footer / data note:** "GIS: NYC Office of Technology and Innovation (formerly DoITT) mobile
   telecommunications pole reservations (NYC Open Data). LiDAR: NYC public LiDAR tile 980195." Plus the snapshot date. No repo link:
   `timpos` is private and the page doesn't depend on it.

## 4. Map rendering

**Recommended: Leaflet with a light/dark raster basemap.**
- Leaflet is small (~40 KB) and stable. Mount it client-only, because the site prerenders
  with SSR. The prerendered HTML shows the header, counts, and the under-review list, and the
  map hydrates on the client.
- **Basemap: Esri Canvas, chosen by Jeremy 2026-09-30.** Two raster layers per theme, both
  from `server.arcgisonline.com/ArcGIS/rest/services/Canvas/`:
  - light: `World_Light_Gray_Base` + `World_Light_Gray_Reference` (street labels)
  - dark: `World_Dark_Gray_Base` + `World_Dark_Gray_Reference`
  - URL pattern: `…/MapServer/tile/{z}/{y}/{x}` (note y before x).
  - Attribution: "Tiles © Esri — Esri, HERE, Garmin, © OpenStreetMap contributors".
  - **Zoom:** the Canvas tiles stop at zoom 16. Set `maxNativeZoom: 16` and cap the map at
    `maxZoom: 17`. The prototype showed that stretching past 17 blurs the tiles and drops the
    street labels. List-row clicks zoom to 17.
  - Switch tile layers when the site theme changes (listen to the theme toggle, not only
    `prefers-color-scheme`).
- Rejected in prototyping: CARTO (now watermarks "API KEY REQUIRED"), OSM standard (too busy
  at street level), OpenFreeMap Positron via MapLibre (quiet, but ~800 KB extra).
- Prototype: `scratchpad/pole-map.html` (Leaflet 1.9.4, real 0.1.2 data). The filters,
  markers, detail panel, review list, and both themes were verified in the browser.
- To check before launch: Esri's terms for keyless use of these basemap services on a public
  site. If they require an ArcGIS account, a free developer key goes in env config.
- Zoom to the data's bounds on load (about 700 m × 700 m around 40.702–40.709 N,
  74.006–74.015 W). No clustering is needed at 106 points.
- **Fallback, if a basemap is rejected in review:** an inline SVG plot of the same lat/lon
  with span lines, a scale bar, and a north arrow. Same markers, same detail sheet.

`leaflet` ^1.9.4 and `@types/leaflet` are already installed on this branch.

## 5. Data snapshot (build-time, committed)

Don't fetch anything at runtime.

- **Done (2026-09-30):** `timpos/scripts/export_pole_map_snapshot.py` (timpos `bd314a4`)
  wrote `src/lib/pole-map/snapshot.json` (106 poles, 72 `matches_scan`, 34 `review`, 30 spans,
  49 KB). It's committed on this branch; the page imports it. **Don't regenerate it or edit it
  by hand.** Shape:
  ```json
  {
    "source": {"domain", "replay_hash", "timpos_commit", "generated_at", "gis", "lidar",
               "pole_height_review_band_ft": [10, 45]},
    "poles": [{"id", "lat", "lon", "status": "matches_scan" | "review",
               "review_reason": null | "top_near_ground" | "top_above_pole_range",
               "reservation_status", "franchisee", "on_street", "cross_street",
               "base_z_ft", "top_z_ft", "height_ft", "offset_m",
               "source_points": {"base", "top"}}],
    "spans": [{"from", "to"}]
  }
  ```
- Lat/lon come from the GIS observation's `address` (CSV pass-through at 7 dp). No coordinate
  conversion.
- `status`/`review_reason` come from the observations' `review_flag`. `offset_m` is the larger
  of the base and top offsets, from `explain_reconciliation`.
- Round only for display, in the UI; the snapshot keeps source precision.
- Expected size: under 60 KB.

## 6. Where it lives

- **Repo:** `~/Dev/portfolio`. **Route:** `/pole-review`, **unlisted**. Follow the existing
  unlisted pattern:
  - `src/lib/site-metadata.ts`: an entry with `unlisted: true`; title "Pole Review Map".
  - `src/App.tsx`: a lazy route, like `StratosFlowPage`.
  - `vercel.json`: rewrite `/pole-review` → `/pole-review/index.html`.
  - Confirm the page prerenders with `noindex` and stays out of `sitemap.xml`.
- **Files:** `src/pages/pole-review.tsx`, `src/components/pole-map/*` (map, legend, detail
  sheet, list), and `src/lib/pole-map/{snapshot.json, model.ts}`. `model.ts` holds pure typed
  selectors: counts, filters, and display formatting.
- Don't link it from the home page, `/ask`, or `profile.md`.

## 7. Tests and acceptance

- `npm run typecheck`, `npm test`, `npm run build` pass. `dist/pole-review/index.html` exists,
  is `noindex`, and isn't in the sitemap. The prerendered HTML contains the counts and the
  under-review list.
- `model.test.ts`: counts are 106 / 72 matches scan / 34 review (29 + 5); every review pole has a reason; every
  pole has lat/lon inside the expected bounds; filters return the right subsets.
- Page test (vitest + testing-library): the header counts render; the "Under review" chip
  filters the list to 34; selecting a list row opens that pole's detail.
- Playwright at 375×812 and 1280×800: no horizontal overflow; tapping a marker opens the
  detail sheet; axe finds no serious violations; markers are distinguishable in grayscale.
- Manual check in light and dark themes.

## 8. Decisions (2026-09-30)

- Label: **"Matches scan"**, not "Confirmed". No person inspected these poles.
- Route: **`/pole-review`**.
- Basemap: **Esri Canvas light/dark**.
- No repo link. `timpos` stays private; the page stands alone on the site.
