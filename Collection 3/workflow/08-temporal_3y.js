// ============================================================
// Monte, Puna and High Andes | Collection 3 | Script 08 — Temporal Filter (3-year window)
// ============================================================
//
// DESCRIPTION:
//   Removes single-year temporal noise ("sandwich" patterns, where one
//   year's class differs from both its immediate neighbors) from the
//   spatially filtered classification (script 07 output), applying two
//   complementary 3/5-year-window rules per class, in a configurable
//   class-priority order.
//
// METHODOLOGY:
//   1. `window3yearsWide`: for each year (except the series' edges),
//      looks at a 5-year window centered on that year; if the year's
//      class differs from both neighbors AND the neighbors differ from
//      each other, replaces it with the mode class of the 5-year window
//      (restricted to `remapClasses`).
//   2. `window3years`: a stricter, narrower 3-year rule — replaces the
//      focal year with the *previous* year's class when the pattern is
//      exactly "class - other - class" (or the water-specific
//      "33 - other - 33" pattern). Water (33) uses a slightly different
//      rule (see the code) because it's deliberately absent from
//      `remapClasses`, so it's never introduced as new data by the
//      other rule.
//   3. `applyFilter`: runs both rules, per class, in the order given by a
//      class-priority list (`priority*`) — later classes in the list can
//      override corrections made for earlier ones.
//   4. Only one priority order (`priorityP2`) is actually run and
//      exported in this saved version; the others are kept as documented
//      alternatives that were tried (see SECTION 1).
//   5. Export the filtered result.
//
// INPUT:
//   - Spatially filtered classification (script 07 output).
//   - Zones FeatureCollection (Monte, Puna and High Andes regions) —
//     used only as the export region.
//
// OUTPUT:
//   - Temporally filtered classification (3-year pass). Exported as
//     `MPHA-INTEGRATED-3-1sp-T3y-v2026-b`.
//
// NOTE (kept as in the original): class 33 (water) is deliberately
// absent from `remapClasses` (SECTION 1) so that the mode-based rule
// never introduces new water pixels — only the narrower `window3years`
// rule (with its own water-specific pattern) can correct water noise.
//
// PREVIOUS STEP: 07-spatial_filter.js (produces the spatially filtered
//                classification this script temporally filters)
// NEXT STEP:     09-temporal_4y.js
//
// AUTHORS: MapBiomas Argentina — Monte, Puna and High Andes team
// ============================================================


// ============================================================
// SECTION 1 — CONFIGURATION PARAMETERS
// ============================================================
var year = 2010;

var years = [
          1986, 1987, 1988, 1989,
    1990, 1991, 1992, 1993, 1994,
    1995, 1996, 1997, 1998, 1999,
    2000, 2001, 2002, 2003, 2004,
    2005, 2006, 2007, 2008, 2009,
    2010, 2011, 2012, 2013, 2014,
    2015, 2016, 2017, 2018, 2019,
    2020, 2021, 2022, 2023, 2024
];

// Class-priority orders tried for this filter pass — only `priorityP2`
// is actually applied below (SECTION 5); the others are kept as a record
// of the alternatives evaluated.
var priorityOriginal = [21, 77, 45, 9, 12, 11, 25, 66, 4, 3, 33]; // original 2025
var priorityP1 = [21, 45, 9, 12, 11, 25, 77, 66, 4, 3, 33];       // proposal 1
var priorityP2 = [25, 33, 21, 9, 11, 12, 4, 3, 77, 45, 66];       // proposal 2, classes that can't occur for a single year go first
var priorityP3 = [77, 45, 33, 25, 12, 11, 9, 3, 21, 66, 4];       // proposal 3, noisiest classes go first

// in the original configuration, 33 is absent (so that no water data
// gets introduced)...
var remapClasses = [3, 4, 66, 77, 45, 12, 11, 9, 21, 25, 34];


// ============================================================
// SECTION 3 — INPUT DATA
// ============================================================
// 🔁 REPLACE: Spatially filtered classification (script 07 output).
var classif = ee.Image('projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-3/GENERAL/CLASSIFICATION/FILTERS/MPHA/MPHA-INTEGRATED-3-1Sp');
var img = ee.Image(classif);

// 🔁 REPLACE: Zones FeatureCollection (Monte, Puna and High Andes
// regions).
var assetRegions = 'projects/YOUR-PROJECT/assets/ANCILLARY_DATA/VECTOR/MPHA/regional-assets_mpha-argcol2_buffer2km_reg';
var regions = ee.FeatureCollection(assetRegions);


// ============================================================
// SECTION 4 — TEMPORAL FILTER FUNCTIONS
// ============================================================
// masks the non-"sandwich" pixels so they get unmasked again by the next
// function, which handles the non-sandwich (wider window) cases
var window3years = function (image, targetClass, years, remapClasses) {

    var result = image.select('classification_1985');

    for (var i = 0; i < years.length; i++) {
        var year = years[i];

        var classPrev = image.select('classification_' + (year - 1));
        var classYear = image.select('classification_' + (year));
        var classNext = image.select('classification_' + (year + 1));

        var mask;

        if (targetClass === 33) {
            // WATER: noise when the edges are water and the center is not
            // Pattern: 33 - X - 33  ->  33 - 33 - 33
            mask = classNext.eq(33)
                .and(classYear.neq(33))
                .and(classPrev.eq(33));
            mask = classPrev.updateMask(mask);

        } else {
            // here we only resolve the sandwich cases
            var sandwichMask = classNext.neq(targetClass)
                .and(classYear.eq(targetClass))
                .and(classPrev.neq(targetClass));
                // .and(classPrev.eq(classNext))

            mask = classPrev.remap(remapClasses, remapClasses)
                .updateMask(sandwichMask);
        }

        // Apply the correction: replace the focal year with the previous year's value
        var correctedBand = classYear.blend(mask.rename('classification_' + (year)));
        result = result.addBands(correctedBand);
    }

    // Add the last year unmodified
    result = result.addBands([
        image.select('classification_2025')
    ]);

    return result;
};

var window3yearsWide = function (image, targetClass, years, remapClasses) {

    var result = image.select('classification_1985')
        .addBands(image.select('classification_1986'));

    for (var i = 0; i < years.length; i++) {
        var year = years[i];

        var classPrev = image.select('classification_' + (year - 1));
        var classYear = image.select('classification_' + (year));
        var classNext = image.select('classification_' + (year + 1));

        var candidateMask = classNext.neq(targetClass)
            .and(classYear.eq(targetClass))
            .and(classPrev.neq(targetClass))
            .and(classPrev.neq(classNext));

        var mask = ee.ImageCollection([
            image.select('classification_' + (year - 2)).rename('class'),
            image.select('classification_' + (year - 1)).rename('class'),
            image.select('classification_' + (year)).rename('class'),
            image.select('classification_' + (year + 1)).rename('class'),
            image.select('classification_' + (year + 2)).rename('class'),
        ])
            .mode()
            .remap(remapClasses, remapClasses)
            .updateMask(candidateMask);

        // Apply the correction: replace the focal year with the previous year's value
        var correctedBand = classYear.blend(mask.rename('classification_' + (year)));

        // here we only want to keep the corrected values, the blend is applied outside
        result = result.addBands(correctedBand);
    }

    // Add the last year unmodified
    result = result.addBands([
        image.select('classification_2024'),
        image.select('classification_2025')
    ]);

    return result;
};

var applyFilter = function (inputImage, order, years, remapClasses) {
    var result = inputImage;

    for (var i = 0; i < order.length; i++) {
        result = window3yearsWide(result, order[i], years.slice(1, years.length - 1), remapClasses);
        result = window3years(result, order[i], years, remapClasses);
        // sequential, or should both run on the original image and then get blended??
    }

    return result;
};


// ============================================================
// SECTION 5 — APPLY FILTER
// ============================================================
// Only the p2 priority order is applied in this saved run — see
// SECTION 1 for the other orders that were tried.
var img_filtered_p2 = applyFilter(img, priorityP2, years, remapClasses);


// ============================================================
// SECTION 6 — EXPORT
// ============================================================
Export.image.toAsset({
    "image": img_filtered_p2,
    "description": 'MPHA-INTEGRATED-3-1sp-T3y-v2026-b',
    // 🔁 REPLACE: Update to your own GEE asset folder (same folder as
    // script 07's `assetClass`).
    "assetId": 'projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-3/GENERAL/CLASSIFICATION/FILTERS/MPHA/MPHA-INTEGRATED-3-1sp-T3y-v2026-b',
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": regions,
    "overwrite": true
});
