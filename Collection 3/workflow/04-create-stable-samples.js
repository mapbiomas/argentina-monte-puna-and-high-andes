// ============================================================
// Monte, Puna and High Andes | Collection 3 | Script 04 — Create Stable Point Samples
// ============================================================
//
// LEGEND C3
// 3       | Closed forest
// 4       | Open forest
// 66      | Closed shrubland
// 77      | Open shrubland
// 45      | Sparse shrubland
// 12      | Grassland
// 11      | Wetland (floodable herbaceous)
// 9       | Cultivated woody vegetation
// 21      | Mosaic of uses
// 25      | Non-vegetated areas
// 33      | Rivers, lagoons and lakes
// 34      | Surface ice and snow
//
// DESCRIPTION:
//   For one region, draws a stratified random sample of points from the
//   stable map (script 03 output), sized per class by `nSamplesPerClass`
//   (set manually from script 03's printed class-area proportions). Then,
//   for every year in the time series, extracts the predictor mosaic +
//   terrain slope at those points and exports one feature table per year.
//
// METHODOLOGY:
//   1. Draw a stratified sample of points from the stable map
//      (`ee.Image.stratifiedSample`), sized per class by
//      `nSamplesPerClass`.
//   2. For each year (1985–2025): build that year's Landsat mosaic, add
//      slope, extract predictor values at the sample points via
//      `reduceRegions`, drop rows with nulls, and export the year's
//      feature table.
//
// INPUT:
//   - Stable map (script 03 output).
//   - Zones FeatureCollection (Monte, Puna and High Andes regions,
//     property `Id2`).
//   - Annual Landsat mosaics for Argentina.
//   - ALOS World 3D-30m terrain model (public, `JAXA/ALOS/AW3D30_V1_1`).
//
// OUTPUT:
//   - Per-year FeatureCollection of predictor values at the stable-class
//     sample points, band `class` holding the reference class. Exported
//     as `samples-stable-<year>-<regionId>-<version>`.
//
// USAGE NOTE: this script processes ONE region per run — change
// `regionId` (SECTION 1) and re-set `nSamplesPerClass` (from script 03's
// printed proportions for that region) per run.
//
// PREVIOUS STEP: 03-stable-classes.js (produces the stable map and the
//                printed class-area proportions used to size the samples
//                here)
// NEXT STEP:     05-aditional-points.js (uses these per-year samples to
//                classify the stable-class map, plus complementary
//                points)
//
// AUTHORS: MapBiomas Argentina — Monte, Puna and High Andes team
// ============================================================


// ============================================================
// SECTION 1 — CONFIGURATION PARAMETERS
// ============================================================
var regionId = 15;

var version = {
    'stable_map': '1',
    'output_samples': '1' // all points, no exclusions, full feature space
};

var years = [
    1985, 1986, 1987, 1988, 1989,
    1990, 1991, 1992, 1993, 1994,
    1995, 1996, 1997, 1998, 1999,
    2000, 2001, 2002, 2003, 2004,
    2005, 2006, 2007, 2008, 2009,
    2010, 2011, 2012, 2013, 2014,
    2015, 2016, 2017, 2018, 2019,
    2020, 2021, 2022, 2023, 2024,
    2025
];

// Set per metaregion // see slides; stratification by area + 10% extra for outlier filtering
// 🔁 REPLACE: Set from script 03's printed class-area proportions for
// this region. Classes commented out here (3, 4, 9) had no representative
// area in this particular region — uncomment/add as needed elsewhere.
var nSamplesPerClass = [
//  { 'class_id':  3, 'n_samples':220  },   // 3   | Closed forest
//  { 'class_id':  4, 'n_samples':220  },   // 4   | Open forest
//  { 'class_id':  9, 'n_samples':220  },   // 9   | Cultivated woody vegetation
    { 'class_id': 11, 'n_samples':330  },   // 11  | Wetland
    { 'class_id': 12, 'n_samples':3561 },   // 12  | Grassland
    { 'class_id': 21, 'n_samples':330  },   // 21  | Mosaic of uses
    { 'class_id': 25, 'n_samples':4400  },   // 25  | Non-vegetated areas
    { 'class_id': 33, 'n_samples':330  },   // 33  | Rivers, lagoons and lakes
    { 'class_id': 34, 'n_samples':330  },   // 34  | Surface ice and snow
    { 'class_id': 45, 'n_samples':425 },   // 45  | Sparse shrubland
    { 'class_id': 66, 'n_samples':330  },   // 66  | Closed shrubland
    { 'class_id': 77, 'n_samples':330 }    // 77  | Open shrubland
];


// ============================================================
// SECTION 3 — INPUT DATA
// ============================================================
// 🔁 REPLACE: Zones FeatureCollection (Monte, Puna and High Andes
// regions, property `Id2`).
var assetRegions = 'projects/YOUR-PROJECT/assets/ANCILLARY_DATA/VECTOR/MPHA/regional-assets_mpha-argcol2_buffer2km_reg';
// 🔁 REPLACE: Update to your own GEE asset folder for the point-sample
// outputs.
var outputFolder = 'projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-3/GENERAL/SAMPLES/RANDOM_STABLE/MPHA';
// 🔁 REPLACE: Stable map (script 03 output).
var assetStable = 'projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-3/GENERAL/CLASSIFICATION/STABLEMAP/MPHA/MPHA-STABLE-REGION-R1-11-1';
// 🔁 REPLACE: Annual Landsat mosaics for Argentina.
var assetMosaics = 'projects/YOUR-PROJECT/LANDSAT/ARGENTINA/mosaics-1';

var regions = ee.FeatureCollection(assetRegions);

// Reduced feature space (alternative, smaller predictor set — not used
// by default; the full feature space below is what's actually selected)
//var featureSpace = [
//    'slope',
//    'green_median_texture',
//    'gcvi_median_wet',
//    'gcvi_median',
//    'gcvi_median_dry',
//    "blue_median",
//    "evi2_median",
//    "green_median",
//    "red_median",
//    "nir_median",
//    "swir1_median",
//    "swir2_median",
//    "gv_median",
//    "gvs_median",
//    "npv_median",
//    "soil_median",
//    "shade_median",
//    "ndfi_median",
//    "ndfi_median_wet",
//    "ndvi_median",
//    "ndvi_median_dry",
//    "ndvi_median_wet",
//    "ndwi_median",
//    "ndwi_median_wet",
//    "savi_median",
//    "sefi_median",
//    "ndfi_stdDev",
//    "sefi_stdDev",
//    "soil_stdDev",
//    "npv_stdDev",
//    "ndwi_amp"
//];

// Full feature space
var featureSpace = [
    'blue_median',
    'blue_median_wet',
    'blue_median_dry',
    'blue_min',
    'blue_stdDev',
    'green_median',
    'green_median_dry',
    'green_median_wet',
    'green_median_texture',
    'green_min',
    'green_stdDev',
    'red_median',
    'red_median_dry',
    'red_min',
    'red_median_wet',
    'red_stdDev',
    'nir_median',
    'nir_median_dry',
    'nir_median_wet',
    'nir_min',
    'nir_stdDev',
    'swir1_median',
    'swir1_median_dry',
    'swir1_median_wet',
    'swir1_min',
    'swir1_stdDev',
    'swir2_median',
    'swir2_median_wet',
    'swir2_median_dry',
    'swir2_min',
    'swir2_stdDev',
    'ndvi_median_dry',
    'ndvi_median_wet',
    'ndvi_median',
    'ndvi_amp',
    'ndvi_stdDev',
    'ndwi_median',
    'ndwi_median_dry',
    'ndwi_median_wet',
    'ndwi_amp',
    'ndwi_stdDev',
    'evi2_median',
    'evi2_median_dry',
    'evi2_median_wet',
    'evi2_amp',
    'evi2_stdDev',
    'savi_median_dry',
    'savi_median_wet',
    'savi_median',
    'savi_stdDev',
    'pri_median_dry',
    'pri_median',
    'pri_median_wet',
    'gcvi_median',
    'gcvi_median_dry',
    'gcvi_median_wet',
    'gcvi_stdDev',
    'hallcover_median',
    'hallcover_stdDev',
    'cai_median',
    'cai_median_dry',
    'cai_stdDev',
    'gv_median',
    'gv_median_dry',
    'gv_median_wet',
    'gv_max',
    'gv_min',
    'gv_amp',
    'gv_stdDev',
    'gvs_median',
    'gvs_median_dry',
    'gvs_median_wet',
    'gvs_max',
    'gvs_min',
    'gvs_amp',
    'gvs_stdDev',
    'npv_median',
    'npv_median_dry',
    'npv_median_wet',
    'npv_max',
    'npv_min',
    'npv_amp',
    'npv_stdDev',
    'soil_median',
    'soil_median_dry',
    'soil_median_wet',
    'soil_max',
    'soil_min',
    'soil_amp',
    'soil_stdDev',
    'cloud_median',
    'cloud_median_dry',
    'cloud_median_wet',
    'cloud_max',
    'cloud_min',
    'cloud_amp',
    'cloud_stdDev',
    'shade_median',
    'shade_median_dry',
    'shade_median_wet',
    'shade_max',
    'shade_min',
    'shade_amp',
    'shade_stdDev',
    'ndfi_median',
    'ndfi_median_dry',
    'ndfi_median_wet',
    'ndfi_max',
    'ndfi_min',
    'ndfi_amp',
    'ndfi_stdDev',
    'sefi_median',
    'sefi_stdDev',
    'sefi_median_dry',
    'wefi_median',
    'wefi_median_wet',
    'wefi_amp',
    'wefi_stdDev',
    'slope'
];

var classValues = nSamplesPerClass.map(
    function (item) {
        return item.class_id;
    }
);

var classPoints = nSamplesPerClass.map(
    function (item) {
        return item.n_samples;
    }
);

var mosaics = ee.ImageCollection(assetMosaics);

var stable = ee.Image(assetStable).rename('reference');


// ============================================================
// SECTION 4 — STRATIFIED SAMPLING & PER-YEAR EXTRACTION
// ============================================================
var terrain = ee.Image("JAXA/ALOS/AW3D30_V1_1").select("AVE");
var slope = ee.Terrain.slope(terrain);

var stableSamples = stable.stratifiedSample({
    'numPoints': 0,
    'classBand': 'reference',
    'region': regions.filter(ee.Filter.eq('Id2', regionId)).geometry(),
    'classValues': classValues,
    'classPoints': classPoints,
    'scale': 30,
    'seed': 1,
    'geometries': true
});

years.forEach(
    function (year) {

        var mosaicYear = mosaics
            .filter(ee.Filter.eq('year', year))
            .filter(ee.Filter.bounds(regions))
            .mosaic()
            .addBands(slope);

        mosaicYear = mosaicYear.select(featureSpace);

        // Collect the spectral information to get the trained samples
        var trainedSamples = stable
            .rename('class')
            .addBands(mosaicYear)
            .reduceRegions({
                'collection': stableSamples,
                'reducer': ee.Reducer.first(),
                'scale': 30,
            });

        trainedSamples = trainedSamples.filter(ee.Filter.notNull(['green_median_texture']));

        var outputName = 'samples-stable-' + year.toString() + '-' + regionId.toString() + '-' + version.output_samples;

        Export.table.toAsset(
            {
                'collection': trainedSamples,
                'description': outputName,
                // 🔁 REPLACE: Update to your own GEE asset folder (see
                // `outputFolder` above).
                'assetId': outputFolder + '/' + outputName
            }
        );
    }
);
