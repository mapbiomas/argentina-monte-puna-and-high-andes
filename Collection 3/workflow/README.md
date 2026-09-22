# Collection 3 — Monte, Puna and High Andes

Google Earth Engine pipeline for MapBiomas Argentina — Monte, Puna and High
Andes region, land-cover classification, Collection 3 (1985–2025).

This is a documented, public-reproducibility version of the original GEE
Code Editor scripts. Every internal/organization-specific asset path has
been replaced with a `🔁 REPLACE:` marker and an explanation — see each
script's header and inline comments for details. No processing logic was
changed; only visualization/debug code (`Map.addLayer`, `print`, legend
panels, interactive UI tools) was removed and the code was reorganized into
labeled sections.

We highly recommend reading the [Monte, Puna and High Andes Algorithm Theoretical Basis Document (ATBD)](https://argentina.mapbiomas.org/wp-content/uploads/sites/12/2024/05/ATDB-MapBiomas-MontePunaAltosAndes-Coll-1.pdf)
for background on the classification methodology. For the MapBiomas
Argentina legend and class codes, see
[argentina.mapbiomas.org/codigos-de-la-leyenda](https://argentina.mapbiomas.org/codigos-de-la-leyenda/).
For all available collections, see
[argentina.mapbiomas.org](https://argentina.mapbiomas.org/).

## Pipeline

The pipeline runs per metaregion (the territory is split into zones
identified by the `Id2` property of the regions FeatureCollection) through
sampling and per-region classification (steps 03–06a), then a shared
sequence of corrections/filters that progressively cleans the merged
multi-year classification into the final product (steps 06b–14). Each
script's header documents its inputs, outputs, and the previous/next step
in more detail.

| # | Script | What it does | Output |
|---|--------|---------------|--------|
| 03 | [03-stable-classes.js](03-stable-classes.js) | Identifies temporally stable pixels (strict + modal-flexible rules) from the prior Collection's final classification across all regions; prints class-area proportions used to size script 04's sample counts. | Stable map, `MPHA-STABLE-REGION-R1-11-<v>` |
| 04 | [04-create-stable-samples.js](04-create-stable-samples.js) | Draws a stratified sample of points from the stable map (one region per run) and extracts per-year predictor values. | Per-year predictor FeatureCollection, `samples-stable-<year>-<region>-<v>` |
| 05 | [05-aditional-points.js](05-aditional-points.js) | Adds manually digitized complementary training points per class, trains + classifies per year (v1, no complementary points in this saved run). | Per-region classification, `MPHA-REGION-<region>-<v>` |
| 05b | [05b-aditional-points.js](05b-aditional-points.js) | Second iteration of script 05 with real complementary point counts and a refined predictor set. | Per-region classification (v2), `MPHA-REGION-<region>-<v>` |
| 06a | [06a-integration.js](06a-integration.js) | Mosaics three neighboring regions' classifications into one, using dissolved+buffered region geometries to resolve overlaps. | Integrated classification, `MPHA-INTEGRATED-1` |
| 06b | [06b-remaps1.js](06b-remaps1.js) | First round of manual polygon-based class corrections, plus slope/EVI2 rule-based corrections. | `MPHA-INTEGRATED-2` |
| 06c | [06c-gapfill.js](06c-gapfill.js) | Fills temporal gaps (no-data years) by carrying the nearest valid year's class forward/backward; adds per-year connectivity bands. | `MPHA-INTEGRATED-3` |
| 07 | [07-spatial_filter.js](07-spatial_filter.js) | Removes small (≤1 ha) spurious patches via focal-mode replacement. | `MPHA-INTEGRATED-3-1Sp` |
| 08 | [08-temporal_3y.js](08-temporal_3y.js) | Removes 1-year "sandwich" temporal noise, per class, in a configurable priority order. | `...-T3y-v2026-b` |
| 09 | [09-temporal_4y.js](09-temporal_4y.js) | Removes 2-year "step" temporal noise (even/odd-year passes). | `...-T3y-4y-v2026-b` |
| 10 | [10-temporal_5y.js](10-temporal_5y.js) | Removes 3-year "step" temporal noise (3 interleaved passes). | `...-T3y-4y-5y-v2026-b` |
| 11 | [11-first_last_years.js](11-first_last_years.js) | Corrects small deforestation/regeneration noise at the series' first/last year (temporal filters can't fully correct single-sided edges). | `...-1Ext` |
| 11b | [11b-first_last_years_wide.js](11b-first_last_years_wide.js) | Second, wider-window edge-year correction pass. | `...-1y2Ext` |
| 11c | [11c-first_year.js](11c-first_year.js) | Forces the first year to match years 2–3 when they agree, per class priority. | `...-12y3Ext` |
| 12 | [12-dominance.js](12-dominance.js) | Picks the series-wide dominant subclass between closed/open forest and closed/open shrubland, and applies it to every year. | `...-Ext-dom` |
| 13 | [13-remaps2.js](13-remaps2.js) | Second round of manual polygon-based corrections, plus slope/EVI2 rule-based corrections. | `...-Ext-dom-remaps` |
| 14 | [14-spatial_filter_final.js](14-spatial_filter_final.js) | Final small-patch spatial filter; exports the pipeline's final product. | `MPHA-FINAL-v1` |

```
03 → 04 → 05/05b (per region) → 06a → 06b → 06c → 07 → 08 → 09 → 10 → 11 → 11b → 11c → 12 → 13 → 14 (final product)
```

## Adapting to your own project

Every script marks the values you need to change with `🔁 REPLACE:`
comments — mainly asset paths (`ee.Image(...)`, `ee.FeatureCollection(...)`,
`Export.*.assetId`, `Export.*.region`): replace `projects/YOUR-PROJECT/...`
with your own GEE asset paths.

- Scripts 03–05b run **once per region** (`regionId` / `regionIds`,
  configured in each script's SECTION 1) — the source repository's curated
  folder had already collapsed the 11-region pipeline down to a single
  representative set of files per step; re-run each with your own region ID
  and re-digitize the correction/complementary-point geometries (SECTION 2
  of the scripts that use them) for each region you process.
- Scripts 06a onward operate on the merged multi-region product and run
  once per pipeline pass.
- The manual correction-polygon FeatureCollections (scripts 05, 05b, 06b,
  13) are placeholders (`ee.FeatureCollection([])`) — draw your own
  correction polygons as GEE Code Editor geometry imports with the variable
  names used in each script.
- Some steps (08, 09, 10, 11b) keep multiple alternative configurations
  (different class-priority orders, different source-asset versions) as
  commented-out code, documenting what the original team tried — only one
  is active per script; the rest are there for reference.

## Original source

Adapted from the internal GEE-hosted repository
`users/hdieguez/Cuyo_C3_trabajo` (folder `GitHub/`, a pre-curated,
deduplicated set of the pipeline's scripts — "Cuyo" is the team's internal
working name for this territory) — MapBiomas Argentina / Monte, Puna and
High Andes team.
