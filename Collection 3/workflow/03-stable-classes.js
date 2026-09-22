// ============================================================
// Monte, Puna and High Andes | Collection 3 | Script 03 — Stable Classes Map
// ============================================================
//
// DESCRIPTION:
//   Identifies pixels whose land-cover class stayed stable across the
//   full 1985–2024 classification record for the Monte, Puna and High
//   Andes region (11 zones, R1–R11, processed together), using a
//   "modal class, ≥36-of-40-years" rule, and exports the stable map.
//   Also computes each class's share of the total area, printed for the
//   analyst to use when sizing the per-class sample counts in the next
//   script (04-create-stable-samples).
//
// METHODOLOGY:
//   1. Load the multi-year Collection 2 final classification.
//   2. Compute two stability measures: `stable` (strict — same class in
//      every year) and `stable2` (flexible — the modal class, only where
//      the zone has fewer than 5 distinct classes overall and the modal
//      class covers ≥36 of the 40 years). `stable2` is the one actually
//      exported.
//   3. Export the stable map as a GEE asset.
//   4. Compute each class's share of the total area (using the 2021
//      band) and print it — used manually to set `nSamplesPerClass` in
//      script 04.
//
// INPUT:
//   - Multi-year classification image (Collection 2 final classification
//     for Monte, Puna and High Andes), bands `classification_<year>`.
//   - Zones FeatureCollection (Monte, Puna and High Andes regions R1–R11,
//     with buffer).
//
// OUTPUT:
//   - Stable map, band `stable`. Exported as `MPHA-STABLE-REGION-R1-11-<version>`.
//   - Printed class-area proportions (no asset export) — read off the
//     Console to size script 04's `nSamplesPerClass`.
//
// PREVIOUS STEP: none — first script in the pipeline (runs on the
//                existing Collection 2 classification)
// NEXT STEP:     04-create-stable-samples.js (draws point samples sized
//                by the printed class-area proportions)
//
// AUTHORS: MapBiomas Argentina — Monte, Puna and High Andes team
// ============================================================


// ============================================================
// SECTION 1 — CONFIGURATION PARAMETERS
// ============================================================
var versionclas = 1;

var version = {
    'classification': '1',
    'output_stable_map': '1'
};


// ============================================================
// SECTION 3 — INPUT DATA
// ============================================================
// 🔁 REPLACE: Zones FeatureCollection (Monte, Puna and High Andes
// regions R1–R11, with buffer).
var assetRegions = 'projects/YOUR-PROJECT/assets/ANCILLARY_DATA/VECTOR/MPHA/regional-assets_mpha-argcol2_buffer2km_reg';

// 🔁 REPLACE: Update to your own GEE asset folder for the stable-map
// output.
var assetStable = 'projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-3/GENERAL/CLASSIFICATION/STABLEMAP/MPHA';

// 🔁 REPLACE: Multi-year classification image (Collection 2 final
// classification for Monte, Puna and High Andes).
var assetClass = 'projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-2/GENERAL/CLASSIFICATION/FINAL_CLASSIFICATION/MPHA/MPHA-FINAL-v1';

var regions = ee.FeatureCollection(assetRegions);

var selectedRegion = regions;

// Optional override: define `userRegion` (Code Editor import) to process
// a custom geometry instead of the full regions FeatureCollection.
var region = typeof (userRegion) !== 'undefined' ? userRegion : selectedRegion;


// ============================================================
// SECTION 4 — STABLE CLASSES COMPUTATION
// ============================================================
var calculateNumberOfClasses = function (image) {
    var nClasses = image.reduce(ee.Reducer.countDistinctNonNull());
    return nClasses.rename('number_of_classes');
};

var classification = ee.Image(assetClass).selfMask();

// number of classes
var nClasses = calculateNumberOfClasses(classification);

// stable (strict — every year the same class)
var stable = classification.select(0).multiply(nClasses.eq(1)).selfMask();

// stable with flexibility (modal class, >=36 of 40 years)
var modalClass = classification.reduce(ee.Reducer.mode());
var stable2 = modalClass.multiply(nClasses.lt(5))
.multiply(classification.updateMask(classification.eq(modalClass)).gt(0)
                        .reduce(ee.Reducer.sum()).gte(36))
.selfMask();
// filter by frequency... (at least 36 of the 40 years)


// ============================================================
// SECTION 5 — EXPORT
// ============================================================
stable = stable2
    .rename('stable')
    .set('collection_id', 1.0)
    .set('version', version.classification)
    .set('territory', 'MPHA');

var stableName = 'MPHA-STABLE-REGION-R1-11' + '-' + version.output_stable_map;

Export.image.toAsset({
    "image": stable,
    "description": stableName,
    // 🔁 REPLACE: Update to your own GEE asset folder (see `assetStable`
    // above).
    "assetId": assetStable + '/' + stableName,
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": region
});


// ============================================================
// SECTION 6 — CLASS-AREA PROPORTIONS (for sizing script 04's samples)
// ============================================================
// calculate sample size according to each class's representativeness in the zone

// Total geometry (union of all polygons)
var geomTotal = regions.geometry();

// Total area in hectares
var areaTotal = geomTotal.area().divide(1e4);

// Image with area proportion per pixel + class
var props = ee.Image.pixelArea()
  .divide(1e4)
  .divide(areaTotal)
  .rename("prop_area")
  .addBands(classification.select(36));

// Reduce over the whole area
var propsTotal = props.reduceRegion({
  reducer: ee.Reducer.sum().group({
    groupField: 1,
    groupName: 'class'
  }),
  geometry: geomTotal,
  scale: 30,
  maxPixels: 1e13
});

// Convert to class -> proportion dictionary
var classProps = ee.List(propsTotal.get('groups'));

var classPropList = classProps.map(function(item) {
  item = ee.Dictionary(item);
  return ee.List([
    ee.Number(item.get('class')).format(),
    ee.Number(item.get('sum'))
  ]);
});

var result = ee.Dictionary(classPropList.flatten());

// Final result as a single Feature
var resultFeature = ee.Feature(geomTotal, result);

// This print is the actual deliverable of this section — the analyst
// reads the per-class proportions off the Console to size
// `nSamplesPerClass` in 04-create-stable-samples.js.
print('Area proportion per class (total)', resultFeature);
