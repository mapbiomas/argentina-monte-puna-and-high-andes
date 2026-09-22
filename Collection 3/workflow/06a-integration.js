// ============================================================
// Monte, Puna and High Andes | Collection 3 | Script 06a — Integrate Neighboring Regions
// ============================================================
//
// DESCRIPTION:
//   Combines the per-region complementary classifications (script 05b
//   output) of three neighboring Monte, Puna and High Andes regions (15,
//   68, 911) into a single mosaic, using each region's own
//   dissolved-and-buffered geometry to resolve overlaps, then exports
//   the combined image.
//
// METHODOLOGY:
//   1. Load the three regions' complementary classifications.
//   2. Dissolve and buffer (100 m) each region's geometry.
//   3. Mask and clip each classification to its own buffered geometry.
//   4. Combine the three into one mosaic (NOTE — kept as in the
//      original: combined with `ee.ImageCollection(...).min()`, i.e. the
//      per-pixel minimum class value across the three images, rather
//      than a `.blend()` chain like the commented-out lines below it
//      suggest was tried; the two commented `.blend(...)` lines are kept
//      as a record of that alternative, not used).
//   5. Export the combined mosaic.
//
// INPUT:
//   - Zones FeatureCollection (Monte, Puna and High Andes regions,
//     property `Id2`).
//   - Complementary classifications for regions 15, 68, 911 (script 05b
//     output, or 05 where no 05b run exists for that region).
//
// OUTPUT:
//   - Combined classification mosaic. Exported as `MPHA-INTEGRATED-1`.
//
// USAGE NOTE: region IDs (15, 68, 911) and the source asset version
// suffix (`-2`) are hardcoded for this particular neighboring-region
// group — edit SECTION 1 for a different group of regions.
//
// PREVIOUS STEP: 05b-aditional-points.js (produces each region's
//                complementary classification)
// NEXT STEP:     06b-remaps1.js (applies manual class-correction remaps
//                to the integrated mosaic)
//
// AUTHORS: MapBiomas Argentina — Monte, Puna and High Andes team
// ============================================================


// ============================================================
// SECTION 1 — CONFIGURATION PARAMETERS
// ============================================================
var regionIds = {
    'r15': 15,
    'r68': 68,
    'r911': 911
};

// Source classification version suffix (script 05/05b `version.output`).
var sourceVersion = '2';


// ============================================================
// SECTION 3 — INPUT DATA
// ============================================================
// 🔁 REPLACE: Zones FeatureCollection (Monte, Puna and High Andes
// regions, property `Id2`).
var assetRegions = 'projects/YOUR-PROJECT/assets/ANCILLARY_DATA/VECTOR/MPHA/regional-assets_mpha-argcol2_buffer2km_reg';
var regions = ee.FeatureCollection(assetRegions);

// 🔁 REPLACE: Update to your own GEE asset folder for the classification
// output (same folder as script 05/05b's `assetClass`).
var assetClass = 'projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-3/GENERAL/CLASSIFICATION/COMPLEMENT_CLASSIFICATION/MPHA';

var R15 = ee.Image(assetClass + '/MPHA-REGION-' + regionIds.r15 + '-' + sourceVersion);
var R68 = ee.Image(assetClass + '/MPHA-REGION-' + regionIds.r68 + '-' + sourceVersion);
var R911 = ee.Image(assetClass + '/MPHA-REGION-' + regionIds.r911 + '-' + sourceVersion);


// ============================================================
// SECTION 4 — INTEGRATE NEIGHBORING REGIONS
// ============================================================
// Create dissolved geometries with a 100 m buffer
var geom15 = regions.filter(ee.Filter.eq('Id2', regionIds.r15)).geometry().buffer(100);
var geom68 = regions.filter(ee.Filter.eq('Id2', regionIds.r68)).geometry().buffer(100);
var geom911 = regions.filter(ee.Filter.eq('Id2', regionIds.r911)).geometry().buffer(100);

// Mask and clip each image to its own dissolved region + buffer
var R15_masked = R15.updateMask(R15.mask()).clip(geom15);
var R68_masked = R68.updateMask(R68.mask()).clip(geom68);
var R911_masked = R911.updateMask(R911.mask()).clip(geom911);

// Create a mosaic with local priority
var mosaic = ee.ImageCollection([R15_masked, R68_masked, R911_masked]).min();
    // .blend(R68_masked)
    // .blend(R911_masked);


// ============================================================
// SECTION 5 — EXPORT
// ============================================================
Export.image.toAsset({
    "image": mosaic,
    "description": 'MPHA-INTEGRATED-1',
    // 🔁 REPLACE: Update to your own GEE asset folder (see `assetClass`
    // above).
    "assetId": assetClass + '/MPHA-INTEGRATED-1',
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": regions
});
