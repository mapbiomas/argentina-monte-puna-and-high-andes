// ============================================================
// Monte, Puna and High Andes | Collection 3 | Script 12 — Class Dominance Correction
// ============================================================
//
// DESCRIPTION:
//   For every pixel, compares closed forest (3) vs. open forest (4)
//   frequency across the full 1985–2025 series, and closed shrubland
//   (66) vs. open shrubland (77) frequency, and replaces EVERY year's
//   pixel value with whichever of the pair is more frequent over time —
//   i.e., a pixel doesn't flip between "closed" and "open" forest/
//   shrubland year to year based on the series-wide dominant subclass.
//   Other classes are left untouched.
//
// METHODOLOGY:
//   1. Compute each pixel's percent frequency of class 3 and class 4
//      across all years (`forestFrequency`), and of class 66 and 77
//      (`shrublandFrequency`).
//   2. For each pixel, pick the dominant subclass of each pair (ties go
//      to the "open" subclass, 4 or 77 — see the `.gte()` in SECTION 4).
//   3. For every year, replace any pixel currently classed 3 or 4 with
//      the pixel's dominant forest subclass, and any pixel classed 66 or
//      77 with the dominant shrubland subclass.
//   4. Reassemble the corrected year bands (dropping the placeholder
//      constant band used to seed the band stack) and export.
//
// INPUT:
//   - First-year-consistency-corrected classification (script 11c
//     output).
//   - Zones FeatureCollection (Monte, Puna and High Andes regions) —
//     used both to clip the dominance images and as the export region.
//
// OUTPUT:
//   - Dominance-corrected classification (the pipeline's final product
//     before script 13's manual remap pass). Exported as
//     `MPHA-FINAL-3-1sp-T3y-4y-5y-v2026-b-Ext-dom`.
//
// NOTE (kept as in the original): `alternativeFrequency` is an
// alternative, unused implementation of the same frequency calculation
// as `forestFrequency`/`shrublandFrequency` (the original comment noted
// "this is the same as doing this") — kept as a documented alternative.
// It divides by 41 (the number of years) inside an `.expression()`,
// while the active calculation divides by `0.4` (equivalent to `*2.5`,
// a slightly different constant, likely a leftover from a 40-year
// assumption before 2025 was added to the series) — kept exactly as
// found, not reconciled.
//
// PREVIOUS STEP: 11c-first_year.js (produces the classification this
//                script corrects)
// NEXT STEP:     13-remaps2.js
//
// AUTHORS: MapBiomas Argentina — Monte, Puna and High Andes team
// ============================================================


// ============================================================
// SECTION 1 — CONFIGURATION PARAMETERS
// ============================================================
// Version labels declared in the source but not referenced elsewhere in
// this script — kept as found.
var version_in = 'v1';
var version_out = 'v1';

var years = [
    1985, 1986, 1987,
    1988, 1989, 1990, 1991,
    1992, 1993, 1994, 1995,
    1996, 1997, 1998, 1999,
    2000, 2001, 2002, 2003,
    2004, 2005, 2006, 2007,
    2008, 2009, 2010, 2011,
    2012, 2013, 2014, 2015,
    2016, 2017, 2018, 2019,
    2020, 2021, 2022, 2023,
    2024, 2025
];


// ============================================================
// SECTION 3 — INPUT DATA
// ============================================================
// 🔁 REPLACE: Update to your own GEE asset folder (same folder as script
// 11c's `assetClass`). Source/output folders declared in the original
// as separate variables but pointing at the same path — kept as found.
var dir_pre_class = 'projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-3/GENERAL/CLASSIFICATION/FILTERS/MPHA/';
var dirout = 'projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-3/GENERAL/CLASSIFICATION/FILTERS/MPHA/';
var assetClass = 'projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-3/GENERAL/CLASSIFICATION/FILTERS/MPHA/';

// First-year-consistency-corrected classification (script 11c output).
// prop 2026b — alternative versions tried, kept as a record:
// assetClass + 'MPHA-FINAL-3-1sp-T3y-4y-5y-v2025-12y3Ext'
// assetClass + 'MPHA-FINAL-3-1sp-T3y-4y-5y-v2026-a-12y3Ext'
// assetClass + 'MPHA-FINAL-3-1sp-T3y-4y-5y-v2026-c-12y3Ext'
var classif = ee.Image(assetClass + 'MPHA-FINAL-3-1sp-T3y-4y-5y-v2026-b-12y3Ext');

// 🔁 REPLACE: Zones FeatureCollection (Monte, Puna and High Andes
// regions).
var regions = ee.FeatureCollection('projects/YOUR-PROJECT/assets/ANCILLARY_DATA/VECTOR/MPHA/regional-assets_mpha-argcol2_buffer2km_reg');


// ============================================================
// SECTION 4 — DOMINANT-SUBCLASS FREQUENCY (per pixel, across all years)
// ============================================================
// Alternative implementation of the frequency calculation below — not
// used, kept as a documented alternative (see NOTE above).
var alternativeFrequency = function (mapbiomas) {
    // General rule
    var exp = '100*((b(0)+b(1)+b(2)+b(3)+b(4)+b(5)+b(6)+b(7)+b(8)+b(9)+b(10)+b(11)+b(12)+b(13)+b(14)+b(15)' +
        '+b(16)+b(17)+b(18)+b(19)+b(20)+b(21)+b(22)+b(23)+b(24)+b(25)+b(26)+b(27)+b(28)+b(29)+b(30)+b(31)+b(32)+b(33)' +
        '+b(34)+b(35)+b(36)+b(37)+b(38)+b(39)+b(40))/41)'; // updated to 41 years (1985-2025)

    var closedFreq = mapbiomas.eq(3).expression(exp);
    var openFreq = mapbiomas.eq(4).expression(exp);

    var output = closedFreq.addBands(openFreq);
    output = output.select(['constant', 'constant_1'], ['closedFreq', 'openFreq']);
    return output;
};

// same as doing this (active calculation)
var forestFrequency = classif.eq(3).reduce(ee.Reducer.sum()).divide(0.4).rename("closedFreq")
    .addBands(classif.eq(4).reduce(ee.Reducer.sum()).divide(0.4).rename("openFreq"));
var shrublandFrequency = classif.eq(66).reduce(ee.Reducer.sum()).divide(0.4).rename("closedFreq")
    .addBands(classif.eq(77).reduce(ee.Reducer.sum()).divide(0.4).rename("openFreq"));


// ============================================================
// SECTION 5 — DOMINANT CLASS PER PIXEL
// ============================================================
// This defines the dominant class at each pixel for the period.
var constant = ee.Image.constant(0).clip(regions);

var dominantForest = constant
    .where(forestFrequency.select('closedFreq').gt(forestFrequency.select('openFreq')), 3)
    .where(forestFrequency.select('openFreq').gte(forestFrequency.select('closedFreq')), 4);

var dominantShrubland = constant
    .where(shrublandFrequency.select('closedFreq').gt(shrublandFrequency.select('openFreq')), 66)
    .where(shrublandFrequency.select('openFreq').gte(shrublandFrequency.select('closedFreq')), 77);


// ============================================================
// SECTION 6 — APPLY DOMINANCE CORRECTION (per year)
// ============================================================
// Replaces pixels that are class 3 or 4 (or whichever we define) with
// the dominant value.
var applyDominanceFilter = function (image) {
    var correctedForest = image.where(image.eq(4).or(image.eq(3)), dominantForest);
    var correctedForestShrubland = correctedForest.where(correctedForest.eq(77).or(correctedForest.eq(66)), dominantShrubland);
    return correctedForestShrubland;
};

var applyToAllBands = function (image) {
    var result = constant;
    for (var i = 0; i < years.length; i++) {
        var year = years[i];
        result = result.addBands(applyDominanceFilter(image.select("classification_" + year)));
    }
    return result;
};

var reclassifiedCollection = applyToAllBands(classif);

// band 0 is the placeholder constant used to seed the stack — drop it
var bandIndices = years.map(function (year, i) { return i + 1; });
var imgfilterdom = reclassifiedCollection.select(bandIndices);


// ============================================================
// SECTION 7 — EXPORT
// ============================================================
Export.image.toAsset({
    "image": imgfilterdom,
    "description": 'MPHA-FINAL-3-1sp-T3y-4y-5y-v2026-b-Ext-dom',
    // 🔁 REPLACE: Update to your own GEE asset folder (see `assetClass`
    // above).
    "assetId": assetClass + 'MPHA-FINAL-3-1sp-T3y-4y-5y-v2026-b-Ext-dom',
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": regions
});
