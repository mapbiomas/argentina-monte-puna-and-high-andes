// ============================================================
// Monte, Puna and High Andes | Collection 3 | Script 11c — First-Year Forced Consistency
// ============================================================
//
// DESCRIPTION:
//   A third edge-correction pass, run on script 11b's output: for the
//   first year (1985) only, forces the class to match 1986 and 1987
//   whenever those two years agree with each other but disagree with
//   1985 — regardless of patch size. Applied per class, in a fixed
//   priority order, so later classes in the list can override earlier
//   corrections. The equivalent last-year version of this rule exists
//   in the source but is disabled (see NOTE).
//
// METHODOLOGY:
//   1. `forceFirstYear`: for a given class, where 1985 != class AND
//      1986 == class AND 1987 == class, force 1985 to that class.
//   2. Apply `forceFirstYear` for every class in `priorityOrderFirst`,
//      in order.
//   3. Export the result.
//
// INPUT:
//   - Edge-corrected classification (script 11b output).
//   - Zones FeatureCollection (Monte, Puna and High Andes regions) —
//     used only as the export region.
//
// OUTPUT:
//   - First-year-consistency-corrected classification. Exported as
//     `MPHA-FINAL-3-1sp-T3y-4y-5y-v2026-b-12y3Ext`.
//
// NOTE (kept as in the original): the source script also defines
// `priorityOrderLast` and a commented-out `forceLastYear` function (the
// mirror-image rule for the LAST year, 2022 in that draft) and a
// commented-out `priorityOrderMiddle` loop referencing `window5years` /
// `window4years` functions not defined in this script — none of that is
// active in this saved run. The source file also has a large trailing
// commented-out block (edge-year noise correction for years 1998/2022,
// referencing classes 67/63/22 that belong to a different territory's
// legend, not this one's) — clearly leftover from adapting another
// region's script; omitted here as dead code.
//
// PREVIOUS STEP: 11b-first_last_years_wide.js (produces the
//                classification this script forces first-year
//                consistency on)
// NEXT STEP:     12-dominance.js
//
// AUTHORS: MapBiomas Argentina — Monte, Puna and High Andes team
// ============================================================


// ============================================================
// SECTION 1 — CONFIGURATION PARAMETERS
// ============================================================
// the first number will have priority
var priorityOrderFirst = [3, 4, 45, 66, 77, 12, 11, 9, 21, 25, 27];

var allYears = [
    1985, 1986, 1987, 1988, 1989, 1990,
    1991, 1992, 1993, 1994, 1995, 1996,
    1997, 1998, 1999, 2000, 2001, 2002,
    2003, 2004, 2005, 2006, 2007, 2008,
    2009, 2010, 2011, 2012, 2013, 2014,
    2015, 2016, 2017, 2018, 2019, 2020,
    2021, 2022, 2023, 2024, 2025
];


// ============================================================
// SECTION 3 — INPUT DATA
// ============================================================
// 🔁 REPLACE: Update to your own GEE asset folder (same folder as script
// 11b's `assetClass`).
var assetClass = 'projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-3/GENERAL/CLASSIFICATION/FILTERS/MPHA/';

// 🔁 REPLACE: Zones FeatureCollection (Monte, Puna and High Andes
// regions).
var regions = ee.FeatureCollection('projects/YOUR-PROJECT/assets/ANCILLARY_DATA/VECTOR/MPHA/regional-assets_mpha-argcol2_buffer2km_reg');

// Loads the classification with filters. prop 2026b — alternative
// versions tried, kept as a record:
// assetClass + 'MPHA-FINAL-3-1sp-T3y-4y-5y-v2025-1y2Ext'
// assetClass + 'MPHA-FINAL-3-1sp-T3y-4y-5y-v2026-a-1y2Ext'
// assetClass + 'MPHA-FINAL-3-1sp-T3y-4y-5y-v2026-c-1y2Ext'
var Filter_exts = ee.Image(assetClass + 'MPHA-FINAL-3-1sp-T3y-4y-5y-v2026-b-1y2Ext');


// ============================================================
// SECTION 4 — FIRST-YEAR FORCED-CONSISTENCY FUNCTION
// ============================================================
var forceFirstYear = function (targetClass, image) {
    var mask = image.select('classification_1985').neq(targetClass)
        .and(image.select('classification_1986').eq(targetClass))
        .and(image.select('classification_1987').eq(targetClass));
    var changedImage = image.select('classification_1985').mask(mask.eq(1)).where(mask.eq(1), targetClass);
    var result = image.select('classification_1985').blend(changedImage);

    var remainingYears = allYears.slice(1);
    result = result.addBands(
        remainingYears.map(function (year) {
            return image.select('classification_' + year);
        })
    );

    return result;
};


// ============================================================
// SECTION 5 — APPLY FILTER
// ============================================================
var filtered = Filter_exts;

for (var i = 0; i < priorityOrderFirst.length; i++) {
    var classId = priorityOrderFirst[i];
    filtered = forceFirstYear(classId, filtered);
}


// ============================================================
// SECTION 6 — EXPORT
// ============================================================
Export.image.toAsset({
    "image": filtered,
    "description": 'MPHA-FINAL-3-1sp-T3y-4y-5y-v2026-b-12y3Ext',
    // 🔁 REPLACE: Update to your own GEE asset folder (see `assetClass`
    // above).
    "assetId": assetClass + 'MPHA-FINAL-3-1sp-T3y-4y-5y-v2026-b-12y3Ext',
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": regions
});
