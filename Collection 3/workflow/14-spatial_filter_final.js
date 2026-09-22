// ============================================================
// Monte, Puna and High Andes | Collection 3 | Script 14 — Final Spatial Filter
// ============================================================
//
// DESCRIPTION:
//   Final step of the pipeline: applies the same small-patch spatial
//   filter as script 07 (focal-mode replacement of small connected
//   patches), this time to the fully temporally filtered,
//   dominance-corrected and remapped classification (script 13 output),
//   and exports it as the pipeline's final classification product.
//   Unlike script 07, this script computes its own connectivity bands
//   internally rather than relying on an upstream gap-fill step.
//
// METHODOLOGY:
//   1. Compute `connectedPixelCount` (8-connectivity, 20-pixel cap) per
//      year band and add it as a `<band>_conn` band.
//   2. For each year: compute the focal mode over a square window
//      (`modeWindowSize` radius), mask it to pixels whose connected
//      patch size is <= `min_connect_pixel`, and blend it onto the
//      original band.
//   3. Stack all years' filtered bands and export as the final product.
//
// INPUT:
//   - Fully corrected classification (script 13 output — must include
//     the spatial filter, the 3/4/5-year temporal filters, the
//     edge-year corrections, dominance correction, and the second remap
//     round).
//   - Zones FeatureCollection (Monte, Puna and High Andes regions) —
//     used only as the export region.
//
// OUTPUT:
//   - Final Collection 3 classification. Exported as `MPHA-FINAL-v1`.
//
// USAGE NOTE: `modeWindowSize` and `min_connect_pixel` (SECTION 1) can
// be tuned to generate alternative filter versions, as in script 07 —
// double-check the input asset version and output naming before
// re-running (as the original script's own comments warn).
//
// PREVIOUS STEP: 13-remaps2.js (produces the classification this script
//                filters and exports as the final product)
// NEXT STEP:     none — final product of the Collection 3 pipeline
//
// AUTHORS: MapBiomas Argentina — Monte, Puna and High Andes team
// ============================================================


// ============================================================
// SECTION 1 — CONFIGURATION PARAMETERS
// ============================================================
var modeWindowSize = 2; // Window radius used to compute the mode
                         // 2 = 5x5 total window
                         // 1 = 3x3 total window

var min_connect_pixel = 11; // minimum area: 6 pixels = 0.5 ha
                             // 11 pixels = 1 ha

var years = [
    1985, 1986, 1987, 1988, 1989,
    1990, 1991, 1992, 1993, 1994,
    1995, 1996, 1997, 1998, 1999,
    2000, 2001, 2002, 2003, 2004,
    2005, 2006, 2007, 2008, 2009,
    2010, 2011, 2012, 2013, 2014,
    2015, 2016, 2017, 2018, 2019,
    2020, 2021, 2022, 2023, 2024, 2025
];


// ============================================================
// SECTION 3 — INPUT DATA
// ============================================================
// 🔁 REPLACE: Update to your own GEE asset folder for the final
// classification output.
var assetClass = 'projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-3/GENERAL/CLASSIFICATION/FINAL_CLASSIFICATION/MPHA';

// 🔁 REPLACE: Zones FeatureCollection (Monte, Puna and High Andes
// regions).
var assetRegions = 'projects/YOUR-PROJECT/assets/ANCILLARY_DATA/VECTOR/MPHA/regional-assets_mpha-argcol2_buffer2km_reg';
var regions = ee.FeatureCollection(assetRegions);

// Careful with the version — it must include the spatial filter, the
// 3-4-5-year temporal filters, and the edge-year corrections.
// 🔁 REPLACE: Fully corrected classification (script 13 output).
var class4GAP = ee.Image('projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-3/GENERAL/CLASSIFICATION/FILTERS/MPHA/MPHA-FINAL-3-1sp-T3y-4y-5y-v2026-b-Ext-dom-remaps');


// ============================================================
// SECTION 4 — CONNECTIVITY BANDS
// ============================================================
var bandNames = ee.List(
    years.map(
        function (year) {
            return 'classification_' + String(year);
        }
    )
);

// add connected pixels bands
class4GAP = class4GAP.addBands(
    class4GAP
        .connectedPixelCount(20, true)
        .rename(bandNames.map(
            function (band) {
                return ee.String(band).cat('_conn');
            }
        ))
);


// ============================================================
// SECTION 5 — PER-YEAR SPATIAL FILTER
// ============================================================
var class_outTotal;

for (var i_year = 0; i_year < years.length; i_year++) {
    var year = years[i_year];

    var mode = class4GAP.select('classification_' + year).focal_mode(modeWindowSize, 'square', 'pixels');
    mode = mode.mask(class4GAP.select('classification_' + year + '_conn').lte(min_connect_pixel));
    var class_out = class4GAP.select('classification_' + year).blend(mode);

    if (i_year === 0) { class_outTotal = class_out; }
    else { class_outTotal = class_outTotal.addBands(class_out); }
}


// ============================================================
// SECTION 6 — EXPORT
// ============================================================
// Double-check the output naming
Export.image.toAsset({
    "image": class_outTotal,
    "description": 'MPHA-FINAL-v1',
    // 🔁 REPLACE: Update to your own GEE asset folder (see `assetClass`
    // above).
    "assetId": assetClass + '/MPHA-FINAL-v1',
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "overwrite": true,
    "maxPixels": 1e13,
    "region": regions
});
