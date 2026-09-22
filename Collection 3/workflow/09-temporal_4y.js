// ============================================================
// Monte, Puna and High Andes | Collection 3 | Script 09 — Temporal Filter (4-year window)
// ============================================================
//
// DESCRIPTION:
//   Second temporal-filter pass on top of script 08's 3-year filter
//   output: removes 2-year "step" noise (a class change that reverts
//   two years later) using a wider window, per class, in a fixed
//   priority order. Runs in two separate passes — one anchored on
//   even years, one on odd years — because the window logic looks 2
//   years back and 1 year forward from each anchor year.
//
// METHODOLOGY:
//   1. `window4yearsEven` (even-year pass): for each even anchor year
//      (2024 down to 1988, in even steps), if `year+1` differs from the
//      target class, `year` and `year-1` both equal it, and `year-2`
//      differs from it, treat `year` and `year-1` as noise and replace
//      both with `year-2`'s class.
//   2. Apply that rule for each class in a fixed priority order (25, 21,
//      9, 11, 12, 4, 3, 77, 45, 66) — later classes can override earlier
//      corrections.
//   3. `window4yearsOdd` applies the same logic for the odd-year pass
//      (2023 down to 1987), applied to the even-pass output, in the same
//      class order.
//   4. Reassemble a single band per year (1985–2025) from the two
//      passes' outputs and export.
//
// INPUT:
//   - 3-year temporally filtered classification (script 08 output).
//   - Zones FeatureCollection (Monte, Puna and High Andes regions) —
//     used only as the export region.
//
// OUTPUT:
//   - 3-year + 4-year filtered classification. Exported as
//     `MPHA-INTEGRATED-3-1sp-T3y-4y-v2026-b`.
//
// NOTE (kept as in the original): both `window4years*` passes have a
// commented-out line about including one more edge-year band
// ("classification_1987" / "classification_1986") flagged
// "CHECK THIS!! Including it results in a duplicated year band" — kept
// commented out as found.
//
// PREVIOUS STEP: 08-temporal_3y.js (produces the 3-year filtered
//                classification this script filters further)
// NEXT STEP:     10-temporal_5y.js
//
// AUTHORS: MapBiomas Argentina — Monte, Puna and High Andes team
// ============================================================


// ============================================================
// SECTION 1 — CONFIGURATION PARAMETERS
// ============================================================
// Careful with the version, according to the spatial filter and 3-year
// temporal filter parameters. Alternative source versions that were
// tried, kept as a record:
// var Filter_3years = ee.Image(assetClass + '/MPHA-INTEGRATED-3-1sp-T3y-v2025');    // v. 2025
// var Filter_3years = ee.Image(assetClass + '/MPHA-INTEGRATED-3-1sp-T3y-v2026-a');  // prop 2026a
// var Filter_3years = ee.Image('projects/YOUR-PROJECT/MPHA-INTEGRATED-3-1sp-T3y-v2026-c'); // prop 2026c (different source project)

// even-year pass anchors (looks back 2 years, forward 1 year, from each)
var yearsEven = [
    2024, 2022, 2020, 2018, 2016, 2014,
    2012, 2010, 2008, 2006, 2004, 2002,
    2000, 1998, 1996, 1994, 1992, 1990, 1988
];

// odd-year pass anchors
var yearsOdd = [
    2023, 2021, 2019, 2017, 2015, 2013,
    2011, 2009, 2007, 2005, 2003, 2001, 1999, 1997, 1995, 1993, 1991, 1989, 1987
];

var allYears = [
    1985, 1986, 1987, 1988, 1989,
    1990, 1991, 1992, 1993, 1994,
    1995, 1996, 1997, 1998, 1999,
    2000, 2001, 2002, 2003, 2004,
    2005, 2006, 2007, 2008, 2009,
    2010, 2011, 2012, 2013, 2014,
    2015, 2016, 2017, 2018, 2019,
    2020, 2021, 2022, 2023, 2024, 2025
];

// This is where you choose which classes the filter is applied to. The
// order matters. Priority orders tried, kept as a record:
// order 2025: [21,77,45,9,12,11,25,66,4,3,33]
// order 2026a: [21,45,9,12,11,25,77,66,4,3,33]
// order 2026b (used below): [25, 21, 9, 11, 12, 4, 3, 77, 45, 66]
// order 2026c: [77,45,33,25,12,11,9,3,21,66,4]


// ============================================================
// SECTION 3 — INPUT DATA
// ============================================================
// 🔁 REPLACE: Update to your own GEE asset folder for the filtered
// classification output (same folder as script 08's asset).
var assetClass = 'projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-3/GENERAL/CLASSIFICATION/FILTERS/MPHA';

// 🔁 REPLACE: Zones FeatureCollection (Monte, Puna and High Andes
// regions).
var assetRegions = 'projects/YOUR-PROJECT/assets/ANCILLARY_DATA/VECTOR/MPHA/regional-assets_mpha-argcol2_buffer2km_reg';
var regions = ee.FeatureCollection(assetRegions);

// 🔁 REPLACE: 3-year temporally filtered classification (script 08
// output). prop 2026b — see SECTION 1 for the other versions tried.
var Filter_3years = ee.Image(assetClass + '/MPHA-INTEGRATED-3-1sp-T3y-v2026-b');


// ============================================================
// SECTION 4 — EVEN-YEAR PASS
// ============================================================
var window4yearsEven = function (image, targetClass) {
    var result = image.select('classification_2025');

    for (var i = 0; i < yearsEven.length; i++) {
        var year = yearsEven[i];
        var classYear = image.select('classification_' + (year));
        var candidateMask = image.select('classification_' + (year + 1)).neq(targetClass)
            .and(image.select('classification_' + (year)).eq(targetClass))
            .and(image.select('classification_' + (year - 1)).eq(targetClass))
            .and(image.select('classification_' + (year - 2)).neq(targetClass));
        var mask = image.select('classification_' + (year - 2))
            .remap([3, 4, 66, 77, 45, 12, 11, 9, 21, 25, 33, 34], [3, 4, 66, 77, 45, 12, 11, 9, 21, 25, 33, 34])
            .updateMask(candidateMask);
        var correctedBand = classYear.blend(mask.rename('classification_' + (year)));
        result = result.addBands(correctedBand);
        var correctedBandPrev = image.select('classification_' + (year - 1)).blend(mask.rename('classification_' + (year - 1)));
        result = result.addBands(correctedBandPrev);
    }
    // result = result.addBands(image.select('classification_1987')); // CHECK THIS!! Including it results in a duplicated year band
    result = result.addBands(image.select('classification_1986'));
    result = result.addBands(image.select('classification_1985'));
    return result;
};

var filtered = window4yearsEven(Filter_3years, 25);
filtered = window4yearsEven(filtered, 21);
filtered = window4yearsEven(filtered, 9);
filtered = window4yearsEven(filtered, 11);
filtered = window4yearsEven(filtered, 12);
filtered = window4yearsEven(filtered, 4);
filtered = window4yearsEven(filtered, 3);
filtered = window4yearsEven(filtered, 77);
filtered = window4yearsEven(filtered, 45);
filtered = window4yearsEven(filtered, 66);


// ============================================================
// SECTION 5 — ODD-YEAR PASS
// ============================================================
var window4yearsOdd = function (image, targetClass) {
    var result = image.select('classification_2025');
    result = result.addBands(image.select('classification_2024'));

    for (var i = 0; i < yearsOdd.length; i++) {
        var year = yearsOdd[i];
        var classYear = image.select('classification_' + (year));
        var candidateMask = image.select('classification_' + (year + 1)).neq(targetClass)
            .and(image.select('classification_' + (year)).eq(targetClass))
            .and(image.select('classification_' + (year - 1)).eq(targetClass))
            .and(image.select('classification_' + (year - 2)).neq(targetClass));
        var mask = image.select('classification_' + (year - 2))
            .remap([3, 4, 66, 77, 45, 12, 11, 9, 21, 25, 33, 34], [3, 4, 66, 77, 45, 12, 11, 9, 21, 25, 33, 34])
            .updateMask(candidateMask);
        var correctedBand = classYear.blend(mask.rename('classification_' + (year)));
        result = result.addBands(correctedBand);
        var correctedBandPrev = image.select('classification_' + (year - 1)).blend(mask.rename('classification_' + (year - 1)));
        result = result.addBands(correctedBandPrev);
    }
    // result = result.addBands(image.select('classification_1986')); // CHECK THIS!! Including it results in a duplicated year band
    result = result.addBands(image.select('classification_1985'));
    return result;
};

filtered = window4yearsOdd(filtered, 25);
filtered = window4yearsOdd(filtered, 21);
filtered = window4yearsOdd(filtered, 9);
filtered = window4yearsOdd(filtered, 11);
filtered = window4yearsOdd(filtered, 12);
filtered = window4yearsOdd(filtered, 4);
filtered = window4yearsOdd(filtered, 3);
filtered = window4yearsOdd(filtered, 77);
filtered = window4yearsOdd(filtered, 45);
filtered = window4yearsOdd(filtered, 66);


// ============================================================
// SECTION 6 — REASSEMBLE PER-YEAR STACK
// ============================================================
var class_outTotal;

for (var i_year = 0; i_year < allYears.length; i_year++) {
    var year = allYears[i_year];

    var filtered_year = filtered.select('classification_' + year);
    if (i_year === 0) { class_outTotal = filtered_year; }
    else { class_outTotal = class_outTotal.addBands(filtered_year); }
}


// ============================================================
// SECTION 7 — EXPORT
// ============================================================
Export.image.toAsset({
    "image": class_outTotal,
    "description": 'MPHA-INTEGRATED-3-1sp-T3y-4y-v2026-b',
    // 🔁 REPLACE: Update to your own GEE asset folder (see `assetClass`
    // above).
    "assetId": assetClass + '/MPHA-INTEGRATED-3-1sp-T3y-4y-v2026-b',
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "overwrite": true,
    "region": regions
});
