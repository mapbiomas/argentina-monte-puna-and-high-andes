// ============================================================
// Monte, Puna and High Andes | Collection 3 | Script 11b — Edge-Year Noise Correction (wide window)
// ============================================================
//
// DESCRIPTION:
//   A second, wider-window pass of script 11's edge-year correction, run
//   on script 11's own output. Instead of comparing the edge year to a
//   single neighbor with a connected-patch-size cutoff, this version
//   requires the two years FOLLOWING the edge year (for 1985) or
//   PRECEDING it (for 2025) to agree with each other before treating the
//   edge year as deforestation noise — no patch-size filter is applied
//   here. Only the deforestation check is active; the regeneration check
//   is disabled (see NOTE).
//
// METHODOLOGY:
//   1. Reclass every year to the same "level 0" forest/anthropic map
//      used in script 11 (SECTION 4).
//   2. Last-year check: 2025 is anthropic (10) while both 2024 AND 2023
//      are forest (1) -> flag as noise (no patch-size filter).
//   3. First-year check: 1985 is anthropic (10) while both 1986 AND 1987
//      are forest (1) -> flag as noise.
//   4. Blend the flagged edge years with the correction image and
//      export.
//
// INPUT:
//   - Edge-corrected classification (script 11 output).
//   - Zones FeatureCollection (Monte, Puna and High Andes regions) —
//     used only as the export region.
//
// OUTPUT:
//   - Further edge-corrected classification. Exported as
//     `MPHA-FINAL-3-1sp-T3y-4y-5y-v2026-b-1y2Ext`.
//
// NOTE (kept as in the original): in SECTION 7, the 1985 branch blends
// with `noiseDeforestationLast` (the LAST-year correction) instead of
// `noiseDeforestationFirst` (the first-year correction computed right
// above it) — appears to be a copy-paste bug, but kept exactly as found.
// Also, the regeneration-noise blocks in SECTIONS 5–6 are commented out
// in the original and reference a `Filter_5years` variable that does not
// exist in this script (it would throw if uncommented as-is) — kept
// commented out, not fixed.
//
// PREVIOUS STEP: 11-first_last_years.js (produces the classification
//                this script corrects further)
// NEXT STEP:     12-dominance.js (see also 11c for the "keep the first
//                stable class regardless of later noise" variant of this
//                same edge-correction step)
//
// AUTHORS: MapBiomas Argentina — Monte, Puna and High Andes team
// ============================================================


// ============================================================
// SECTION 1 — CONFIGURATION PARAMETERS
// ============================================================
var years = [
    1985,
    1986, 1987, 1988, 1989, 1990,
    1991, 1992, 1993, 1994, 1995,
    1996, 1997, 1998, 1999, 2000,
    2001, 2002, 2003, 2004, 2005,
    2006, 2007, 2008, 2009, 2010,
    2011, 2012, 2013, 2014, 2015,
    2016, 2017, 2018, 2019, 2020,
    2021, 2022, 2023, 2024, 2025
];

// LEGEND C3
// 3     Closed forest
// 4     Open forest
// 66    Closed shrubland
// 77    Open shrubland
// 45    Sparse shrubland
// 12    Grassland
// 11    Wetland (floodable non-woody natural vegetation)
// 9     Cultivated woody vegetation
// 21    Mosaic of uses
// 25    Non-vegetated areas
// 33    Rivers, lagoons and lakes
// 34    Surface ice and snow


// ============================================================
// SECTION 3 — INPUT DATA
// ============================================================
// 🔁 REPLACE: Update to your own GEE asset folder (same folder as script
// 11's `assetClass`).
var assetClass = 'projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-3/GENERAL/CLASSIFICATION/FILTERS/MPHA/';

// 🔁 REPLACE: Zones FeatureCollection (Monte, Puna and High Andes
// regions).
var regions = ee.FeatureCollection('projects/YOUR-PROJECT/assets/ANCILLARY_DATA/VECTOR/MPHA/regional-assets_mpha-argcol2_buffer2km_reg');

// Loads the classification with filters. prop 2026b — alternative
// versions tried, kept as a record:
// assetClass + 'MPHA-FINAL-3-1sp-T3y-4y-5y-v2025-1Ext'
// assetClass + 'MPHA-FINAL-3-1sp-T3y-4y-5y-v2026-a-1Ext'
// assetClass + 'MPHA-FINAL-3-1sp-T3y-4y-5y-v2026-c-1Ext'
var Filter_1Ext = ee.Image(assetClass + 'MPHA-FINAL-3-1sp-T3y-4y-5y-v2026-b-1Ext');


// ============================================================
// SECTION 4 — BUILD LEVEL-0 (FOREST / ANTHROPIC) MAP PER YEAR
// ============================================================
var classLevel0;

for (var i = 0; i < years.length; i++) {
    var year = years[i];

    var classYear = Filter_1Ext.select('classification_' + year);
    // 27 shouldn't be present here, but it's left in so as not to break anything
    var classLevel0Year = classYear.remap(
        [3, 4, 45, 66, 77, 12, 11, 9, 21, 25, 33, 34, 27],
        [1, 1, 1, 1, 1, 1, 1, 10, 10, 1, 1, 1, 1]
    ).rename('classification_' + year);

    if (i === 0) { classLevel0 = classLevel0Year; }
    else { classLevel0 = classLevel0.addBands(classLevel0Year); }
}


// ============================================================
// SECTION 5 — LAST-YEAR (2025) NOISE CORRECTION
// ============================================================
var level0_2025 = classLevel0.select('classification_2025');
var level0_2024 = classLevel0.select('classification_2024');
var level0_2023 = classLevel0.select('classification_2023');

// correct small deforestation in the last year
var deforestationLast = level0_2025.eq(10).and(level0_2024.eq(1)).and(level0_2023.eq(1));
var noiseDeforestationLast = Filter_1Ext.select('classification_2024').updateMask(deforestationLast);

// correct small regeneration in the last year — disabled: references a
// `Filter_5years` variable that does not exist in this script.
//var regen = level0_2025.eq(1).and(level0_2024.eq(10))
//var connectedRegen = regen.selfMask().connectedPixelCount(25,true).reproject('epsg:4326', null, 30);
//var regen1ha = connectedRegen.lte(11)
//var noiseRegen22 = Filter_5years.select('classification_2021').updateMask(regen1ha)


// ============================================================
// SECTION 6 — FIRST-YEAR (1985) NOISE CORRECTION
// ============================================================
var level0_1985 = classLevel0.select('classification_1985');
var level0_1986 = classLevel0.select('classification_1986');
var level0_1987 = classLevel0.select('classification_1987');

// correct small deforestation in the first year
var deforestationFirst = level0_1985.eq(10).and(level0_1986.eq(1)).and(level0_1987.eq(1));
var noiseDeforestationFirst = Filter_1Ext.select('classification_1986').updateMask(deforestationFirst);

// correct small regeneration in the first year — disabled: references a
// `Filter_5years` variable that does not exist in this script.
//var regen = level0_1985.eq(10).and(level0_1986.eq(1))
//var connectedRegen = regen.selfMask().connectedPixelCount(30,true).reproject('epsg:4326', null, 30);
//var regen1ha = connectedRegen.lte(11)
//var noiseRegen85 = Filter_5years.select('classification_1986').updateMask(regen1ha)


// ============================================================
// SECTION 7 — BLEND EDGE-YEAR CORRECTIONS
// ============================================================
var class_final;

for (var j = 0; j < years.length; j++) {
    var yearJ = years[j];

    var classYearJ = Filter_1Ext.select('classification_' + yearJ);
    var correctedYear;

    // NOTE (kept as in the original): both branches blend with
    // `noiseDeforestationLast` — the 1985 branch does not use
    // `noiseDeforestationFirst`, which is otherwise unused.
    if (yearJ === 1985) { correctedYear = classYearJ.blend(noiseDeforestationLast); }
    else if (yearJ === 2025) { correctedYear = classYearJ.blend(noiseDeforestationLast); }
    else { correctedYear = classYearJ; }

    if (j === 0) { class_final = correctedYear; }
    else { class_final = class_final.addBands(correctedYear); }
}


// ============================================================
// SECTION 8 — EXPORT
// ============================================================
Export.image.toAsset({
    "image": class_final,
    "description": 'MPHA-FINAL-3-1sp-T3y-4y-5y-v2026-b-1y2Ext',
    // 🔁 REPLACE: Update to your own GEE asset folder (see `assetClass`
    // above).
    "assetId": assetClass + 'MPHA-FINAL-3-1sp-T3y-4y-5y-v2026-b-1y2Ext',
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": regions
});
