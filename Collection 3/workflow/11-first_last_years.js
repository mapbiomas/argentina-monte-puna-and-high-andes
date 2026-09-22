// ============================================================
// Monte, Puna and High Andes | Collection 3 | Script 11 — Edge-Year Noise Correction
// ============================================================
//
// DESCRIPTION:
//   The temporal filters (scripts 08–10) rely on neighboring years on
//   both sides of the focal year, so they can't fully correct noise at
//   the series' first (1985) and last (2025) year, which only have
//   neighbors on one side. This script targets exactly those two edge
//   years: it detects small (<=11 connected pixels, ~1 ha) apparent
//   deforestation/regeneration patches between 2025↔2024 and 1985↔1986,
//   and replaces the edge year's pixel with the neighboring year's value
//   wherever the patch is small enough to be considered noise.
//
// METHODOLOGY:
//   1. Reclass every year to a binary "level 0" map: forest/woody
//      classes -> 1, class 9 (cultivated woody vegetation) and 21
//      (mosaic of uses) -> 10, everything else -> 1 (see the remap
//      table — this is a forest-vs-anthropic-signal split, not a full
//      class scheme).
//   2. Last-year noise: pixels that are anthropic (10) in 2025 but
//      forest (1) in 2024 are candidate deforestation noise; pixels
//      whose connected patch is <=11 pixels get 2024's original class
//      value carried into 2025. Same check in reverse for candidate
//      "regeneration" noise (1 in 2025, 10 in 2024).
//   3. First-year noise: the same two checks, applied between 1986 and
//      1985.
//   4. Blend the edge-year corrections into the input classification;
//      all interior years pass through unmodified.
//   5. Export the corrected classification.
//
// INPUT:
//   - 3-year + 4-year + 5-year filtered classification (script 10
//     output).
//   - Zones FeatureCollection (Monte, Puna and High Andes regions) —
//     used only as the export region.
//
// OUTPUT:
//   - Edge-corrected classification. Exported as
//     `MPHA-FINAL-3-1sp-T3y-4y-5y-v2026-b-1Ext`.
//
// NOTE (kept as in the original): the remap table in SECTION 4 includes
// class 27 ("not observed", introduced by script 06b's slope/EVI2
// rules) mapped to 1, with a comment noting it shouldn't be present
// here, but was left in so as not to break anything — kept as found.
//
// PREVIOUS STEP: 10-temporal_5y.js (produces the filtered classification
//                this script corrects at its edges)
// NEXT STEP:     12-dominance.js (see also 11b/11c for alternative,
//                wider-window edge-correction variants of this same
//                step)
//
// AUTHORS: MapBiomas Argentina — Monte, Puna and High Andes team
// ============================================================


// ============================================================
// SECTION 1 — CONFIGURATION PARAMETERS
// ============================================================
var version = {
    'output': '2',
};

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
// 10's `assetClass`).
var assetClass = 'projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-3/GENERAL/CLASSIFICATION/FILTERS/MPHA/';

// 🔁 REPLACE: Zones FeatureCollection (Monte, Puna and High Andes
// regions).
var regions = ee.FeatureCollection('projects/YOUR-PROJECT/assets/ANCILLARY_DATA/VECTOR/MPHA/regional-assets_mpha-argcol2_buffer2km_reg');

// Loads the classification with intermediate spatial and temporal
// filters. prop 2026b — alternative versions tried, kept as a record:
// assetClass + 'MPHA-INTEGRATED-3-1sp-T3y-4y-5y-v2025'
// assetClass + 'MPHA-INTEGRATED-3-1sp-T3y-4y-5y-v2026-a'
// assetClass + 'MPHA-INTEGRATED-3-1sp-T3y-4y-5y-v2026-c'
var Filter_5years = ee.Image(assetClass + 'MPHA-INTEGRATED-3-1sp-T3y-4y-5y-v2026-b');


// ============================================================
// SECTION 4 — BUILD LEVEL-0 (FOREST / ANTHROPIC) MAP PER YEAR
// ============================================================
var classLevel0;

for (var i = 0; i < years.length; i++) {
    var year = years[i];

    var classYear = Filter_5years.select('classification_' + year);
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

// correct small deforestation in the last year - correct using the year before
var deforestationLast = level0_2025.eq(10).and(level0_2024.eq(1));
var connectedDeforestationLast = deforestationLast.selfMask().connectedPixelCount(20, true).reproject('epsg:4326', null, 30);
var deforestation1haLast = connectedDeforestationLast.lte(11);
var noiseDeforestationLast = Filter_5years.select('classification_2024').updateMask(deforestation1haLast);

// correct small regeneration in the last year
var regenLast = level0_2025.eq(1).and(level0_2024.eq(10));
var connectedRegenLast = regenLast.selfMask().connectedPixelCount(25, true).reproject('epsg:4326', null, 30);
var regen1haLast = connectedRegenLast.lte(11);
var noiseRegenLast = Filter_5years.select('classification_2024').updateMask(regen1haLast);


// ============================================================
// SECTION 6 — FIRST-YEAR (1985) NOISE CORRECTION
// ============================================================
var level0_1985 = classLevel0.select('classification_1985');
var level0_1986 = classLevel0.select('classification_1986');

// correct small deforestation in the first year
var deforestationFirst = level0_1985.eq(1).and(level0_1986.eq(10));
var connectedDeforestationFirst = deforestationFirst.selfMask().connectedPixelCount(30, true).reproject('epsg:4326', null, 30);
var deforestation1haFirst = connectedDeforestationFirst.lte(11);
var noiseDeforestationFirst = Filter_5years.select('classification_1986').updateMask(deforestation1haFirst);

// correct small regeneration in the first year
var regenFirst = level0_1985.eq(10).and(level0_1986.eq(1));
var connectedRegenFirst = regenFirst.selfMask().connectedPixelCount(30, true).reproject('epsg:4326', null, 30);
var regen1haFirst = connectedRegenFirst.lte(11);
var noiseRegenFirst = Filter_5years.select('classification_1986').updateMask(regen1haFirst);


// ============================================================
// SECTION 7 — BLEND EDGE-YEAR CORRECTIONS
// ============================================================
var class_final;

for (var j = 0; j < years.length; j++) {
    var yearJ = years[j];

    var classYearJ = Filter_5years.select('classification_' + yearJ);
    var correctedYear;

    if (yearJ === 1985) { correctedYear = classYearJ.blend(noiseDeforestationFirst).blend(noiseRegenFirst); }
    else if (yearJ === 2025) { correctedYear = classYearJ.blend(noiseDeforestationLast).blend(noiseRegenLast); }
    else { correctedYear = classYearJ; }

    if (j === 0) { class_final = correctedYear; }
    else { class_final = class_final.addBands(correctedYear); }
}


// ============================================================
// SECTION 8 — EXPORT
// ============================================================
Export.image.toAsset({
    "image": class_final,
    "description": 'MPHA-FINAL-3-1sp-T3y-4y-5y-v2026-b-1Ext',
    // 🔁 REPLACE: Update to your own GEE asset folder (see `assetClass`
    // above).
    "assetId": assetClass + 'MPHA-FINAL-3-1sp-T3y-4y-5y-v2026-b-1Ext',
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "overwrite": true,
    "region": regions
});
