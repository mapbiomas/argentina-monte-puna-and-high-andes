// ============================================================
// Cuyo Collection 3 | Script 07 — Spatial Filter
// ============================================================
//
// DESCRIPTION:
//   Removes small, likely-spurious patches from the gap-filled
//   classification (script 06c output) by replacing pixels that belong
//   to a small connected patch (from 06c's `_conn` bands) with the
//   focal-mode class of their neighborhood, per year.
//
// METHODOLOGY:
//   1. For each year: compute the focal mode over a square window
//      (`modeWindowSize` radius) of that year's classification band.
//   2. Mask the focal-mode result to only the pixels whose connected
//      patch size (`_conn` band, from 06c) is <= `min_connect_pixel`.
//   3. Blend the masked focal-mode result onto the original band — small
//      patches are replaced by their neighborhood's mode class, larger
//      patches are left untouched.
//   4. Stack all years' filtered bands and export.
//
// INPUT:
//   - Gap-filled classification with `_conn` bands (script 06c output).
//   - Zones FeatureCollection (Cuyo regions) — used only as the export
//     region.
//
// OUTPUT:
//   - Spatially filtered classification. Exported as
//     `CUYO-INTEGRADO-3-1Sp`.
//
// USAGE NOTE: `modeWindowSize` and `min_connect_pixel` (SECTION 1) can be
// tuned to generate alternative filter versions — inputs/outputs must be
// updated manually per version, as noted in the original script.
//
// PREVIOUS STEP: 06c-gapfill.js (produces the `_conn` bands this filter
//                relies on)
// NEXT STEP:     08-temporal_3y.js
//
// AUTHORS: MapBiomas Argentina — Cuyo team
// ============================================================


// ============================================================
// SECTION 1 — CONFIGURATION PARAMETERS
// ============================================================
// Posibilidad de generar distintas versiones modificando parámetros del
// filtro espacial. Inputs and outputs deben ser modificados manualmente.
var modeWindowSize = 2; // Tamaño del radio de la ventana para calcular la moda
                         // 2 = ventana total de 5x5
                         // 1 = ventana total de 3x3

var min_connect_pixel = 11; // area minima 6 pixels = 0,5 ha
                             // 11 pixels = 1 ha

// Landsat images that will be added to Layers
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
// 🔁 REPLACE: Update to your own GEE asset folder for the filtered
// classification output.
var assetClass = 'projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-3/GENERAL/CLASSIFICATION/FILTERS/CUYO';

// 🔁 REPLACE: Zones FeatureCollection (Cuyo regions).
var assetRegions = 'projects/YOUR-PROJECT/assets/ANCILLARY_DATA/VECTOR/CUYO/regional-assets_cuyo-argcol2_buffer2km_reg';
var regions = ee.FeatureCollection(assetRegions);

// 🔁 REPLACE: Gap-filled classification with `_conn` bands (script 06c
// output).
var class4GAP = ee.Image('projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-3/GENERAL/CLASSIFICATION/COMPLEMENT_CLASSIFICATION/CUYO/CUYO-INTEGRADO-3');


// ============================================================
// SECTION 4 — PER-YEAR SPATIAL FILTER
// ============================================================
var class_outTotal;

for (var i_ano = 0; i_ano < years.length; i_ano++) {
    var ano = years[i_ano];

    var moda = class4GAP.select('classification_' + ano).focal_mode(modeWindowSize, 'square', 'pixels');
    moda = moda.mask(class4GAP.select('classification_' + ano + '_conn').lte(min_connect_pixel));
    var class_out = class4GAP.select('classification_' + ano).blend(moda);

    if (i_ano === 0) { class_outTotal = class_out; }
    else { class_outTotal = class_outTotal.addBands(class_out); }
}

var class_final = class_outTotal;


// ============================================================
// SECTION 5 — EXPORT
// ============================================================
Export.image.toAsset({
    "image": class_final,
    "description": 'CUYO-INTEGRADO-3-1Sp',
    // 🔁 REPLACE: Update to your own GEE asset folder (see `assetClass`
    // above).
    "assetId": assetClass + '/CUYO-INTEGRADO-3-1Sp',
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": regions
});
