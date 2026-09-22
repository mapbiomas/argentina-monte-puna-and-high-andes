// ============================================================
// Monte, Puna and High Andes | Collection 3 | Script 05b — Add Complementary Points & Classify (v2)
// ============================================================
//
// Generates v2 of the metaregional Complement_Classification using v4 of
// the random stable samples and complementary points.
// Compared against complement v1 metaregional, generated using only v4
// of the stable samples (script 05).
//
// LEGEND
// 3   | Closed forest              | #1f8d49
// 4   | Open forest                | #7dc975
// 9   | Cultivated woody veg.      | #7a6c00
// 11  | Wetland (floodable herb.)  | #519799
// 12  | Grassland                  | #d6bc74
// 21  | Mosaic of uses             | #ffefc3
// 25  | Non-vegetated areas        | #db4d4f
// 33  | Rivers, lagoons and lakes  | #2532e4
// 34  | Surface ice and snow       | #93dfe6
// 45  | Sparse shrubland           | #e04cfa
// 66  | Closed shrubland           | #91ff36
// 77  | Open shrubland             | #a2c830
//
// DESCRIPTION:
//   Second iteration of script 05: same stable-samples + complementary-
//   points classification, but with real per-class complementary point
//   counts (script 05 ran with all counts at 0 for this region) and a
//   slightly different predictor mosaic (no ALOS `slope` band, only the
//   FABDEM-derived `slope_fab`).
//
// METHODOLOGY: identical to script 05 — see that script's header for the
// full methodology. The only functional differences here are the
// non-zero `complementary` counts and the predictor mosaic composition
// (SECTION 5).
//
// INPUT / OUTPUT: same as script 05.
//
// NOTE (kept as in the original): this script tags the exported image
// with `collection_id: 3.0`, while script 05 (v1) tags it `1.0` — kept
// exactly as found; if you rely on `collection_id` downstream, confirm
// which value is intended for your own run.
//
// USAGE NOTE: this script processes ONE region per run — change
// `regionId` (SECTION 1) and redraw the correction polygons (SECTION 2)
// for each region.
//
// PREVIOUS STEP: 05-aditional-points.js (v1 of this same step)
// NEXT STEP:     06a-integration.js (mosaics the regions and integrates
//                the classifications produced here)
//
// AUTHORS: MapBiomas Argentina — Monte, Puna and High Andes team
// ============================================================


// ============================================================
// SECTION 1 — CONFIGURATION PARAMETERS
// ============================================================
// MetaRegion
var regionId = 15;

// CAREFUL WITH THIS AND THE SAMPLE VERSIONS
var version = {
    'classification': '1',
    'stable_map': '1',
    'stable_samples': '4',
    'output': '2', // second metaregional pass
};

var nTrainingPoints = 2000;   // Number of points to training
var nValidationPoints = 500;   // Number of points to validate

// EDIT — number of complementary points per class for this region.
var complementary = [
    [ 3, 0],   // 3   | Closed forest
    [ 4, 0],   // 4   | Open forest
    [ 9, 0],   // 9   | Cultivated woody vegetation
    [11, 300], //11  | Wetland
    [12, 300], //12  | Grassland
    [21, 300], //21  | Mosaic of uses
    [25, 300], //25  | Non-vegetated areas
    [33, 300], //33  | Rivers, lagoons and lakes
    [34, 300], //34  | Surface ice and snow
    [45, 500], //45  | Sparse shrubland
    [66, 300], //66  | Closed shrubland
    [77, 700]  //77  | Open shrubland
];

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

// random forest parameters
var rfParams = {
    'numberOfTrees': 70,
    'variablesPerSplit': 4,
    'minLeafPopulation': 25,
    'seed': 1
};

var featureSpace = [
    'slope_fab',
    'green_median_texture',
    'gcvi_median_wet',
    'gcvi_median',
    'gcvi_median_dry',
    "blue_median",
    "evi2_median",
    "green_median",
    "red_median",
    "nir_median",
    "swir1_median",
    "swir2_median",
    "gv_median",
    "gvs_median",
    "npv_median",
    "soil_median",
    "shade_median",
    "ndfi_median",
    "ndfi_median_wet",
    "ndvi_median",
    "ndvi_median_dry",
    "ndvi_median_wet",
    "ndwi_median",
    "ndwi_median_wet",
    "savi_median",
    "sefi_median",
    "ndfi_stdDev",
    "sefi_stdDev",
    "soil_stdDev",
    "npv_stdDev",
    "ndwi_amp"
];


// ============================================================
// SECTION 2 — MANUALLY DIGITIZED CORRECTION POLYGONS
// ============================================================
// 🔁 REPLACE: For the region being processed, digitize one FeatureCollection
// of polygons per class that needs correction (draw them as GEE Code
// Editor geometry imports, property `class` = the class code). Any class
// left as an empty FeatureCollection below simply contributes 0 points.
var ClosedForest = ee.FeatureCollection([]);        // 3  | Closed forest
var OpenForest = ee.FeatureCollection([]);          // 4  | Open forest
var ClosedShrubland = ee.FeatureCollection([]);     // 66 | Closed shrubland
var OpenShrubland = ee.FeatureCollection([]);       // 77 | Open shrubland
var SparseShrubland = ee.FeatureCollection([]);     // 45 | Sparse shrubland
var Grassland = ee.FeatureCollection([]);           // 12 | Grassland
var Wetland = ee.FeatureCollection([]);             // 11 | Wetland
var CultivatedWoody = ee.FeatureCollection([]);     // 9  | Cultivated woody vegetation
var Mosaic = ee.FeatureCollection([]);              // 21 | Mosaic of uses
var Bare = ee.FeatureCollection([]);                // 25 | Non-vegetated areas
var Water = ee.FeatureCollection([]);               // 33 | Rivers, lagoons and lakes
var Snow = ee.FeatureCollection([]);                // 34 | Surface ice and snow


// ============================================================
// SECTION 3 — INPUT DATA
// ============================================================
// 🔁 REPLACE: Annual Landsat mosaics for Argentina.
var assetMosaics = 'projects/YOUR-PROJECT/LANDSAT/ARGENTINA/mosaics-1';
// 🔁 REPLACE: Zones FeatureCollection (Monte, Puna and High Andes
// regions, property `Id2`).
var assetRegions = 'projects/YOUR-PROJECT/assets/ANCILLARY_DATA/VECTOR/MPHA/regional-assets_mpha-argcol2_buffer2km_reg';
// 🔁 REPLACE: Per (region, year) stable sample points (script 04 output).
var assetStableSamples = 'projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-3/GENERAL/SAMPLES/RANDOM_STABLE/MPHA';
// 🔁 REPLACE: Update to your own GEE asset folder for the complementary
// training points/polygons.
var assetAdditionalSamples = 'projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-3/GENERAL/SAMPLES/COMPLEMENT/MPHA';
// 🔁 REPLACE: Update to your own GEE asset folder for the classification
// output.
var assetClass = 'projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-3/GENERAL/CLASSIFICATION/COMPLEMENT_CLASSIFICATION/MPHA';

// 🔁 REPLACE: Stable map (script 03 output).
var assetStable = ee.Image('projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-3/GENERAL/CLASSIFICATION/STABLEMAP/MPHA/MPHA-STABLE-REGION-R1-11-1');

var mosaics = ee.ImageCollection(assetMosaics);
var regions = ee.FeatureCollection(assetRegions);

var selectedRegion = regions.filter(ee.Filter.eq('Id2', regionId));

// Optional override: define `userRegion` (Code Editor import) to process
// a custom geometry instead of the selected region.
var region = typeof (userRegion) !== 'undefined' ? userRegion : selectedRegion;


// ============================================================
// SECTION 4 — GENERATE COMPLEMENTARY TRAINING/VALIDATION POINTS
// ============================================================
var generateAditionalPoints = function (polygons, classValues, classPoints) {

    var polygonsRaster = ee.Image().paint({
        featureCollection: polygons,
        color: 'class'
    }).rename('class');

    var points = polygonsRaster.stratifiedSample({
        'numPoints': 1,
        'classBand': 'class',
        'classValues': classValues,
        'classPoints': classPoints,
        'region': polygons,
        'scale': 30,
        'seed': 1,
        'dropNulls': true,
        'geometries': true,
    });

    return points;
};

// Unused in this saved run, kept as available helpers.
var stratifiedPoints = function (image, nPoints, region) {

    image = image.rename('class');

    var points = image.stratifiedSample({
        'numPoints': nPoints,
        'classBand': 'class',
        'region': region,
        'scale': 30,
        'seed': 1,
        'dropNulls': true,
        'geometries': true
    });

    return points;
};

var shuffle = function (collection, seed) {

    collection = collection.randomColumn('random', seed || 1)
        .sort('random', true)
        .map(
            function (feature) {
                var rescaled = ee.Number(feature.get('random'))
                    .multiply(1000000000)
                    .round();
                return feature.set('new_id', rescaled);
            }
        );

    var randomIdList = ee.List(
        collection.reduceColumns(ee.Reducer.toList(), ['new_id'])
            .get('list'));

    var sequentialIdList = ee.List.sequence(1, collection.size());

    var shuffled = collection.remap(randomIdList, sequentialIdList, 'new_id');

    return shuffled;
};

var stable = ee.Image(assetStable);

var samplesList = [
      typeof (ClosedForest)     !== 'undefined' ? ClosedForest     : ee.FeatureCollection([]), //3   | Closed forest
      typeof (OpenForest)       !== 'undefined' ? OpenForest       : ee.FeatureCollection([]), //4   | Open forest
      typeof (CultivatedWoody)  !== 'undefined' ? CultivatedWoody  : ee.FeatureCollection([]), //9   | Cultivated woody vegetation
      typeof (Wetland)          !== 'undefined' ? Wetland          : ee.FeatureCollection([]), //11  | Wetland
      typeof (Grassland)        !== 'undefined' ? Grassland        : ee.FeatureCollection([]), //12  | Grassland
      typeof (Mosaic)           !== 'undefined' ? Mosaic           : ee.FeatureCollection([]), //21  | Mosaic of uses
      typeof (Bare)             !== 'undefined' ? Bare             : ee.FeatureCollection([]), //25  | Non-vegetated areas
      typeof (Water)            !== 'undefined' ? Water            : ee.FeatureCollection([]), //33  | Rivers, lagoons and lakes
      typeof (Snow)             !== 'undefined' ? Snow             : ee.FeatureCollection([]), //34  | Surface ice and snow
      typeof (SparseShrubland)  !== 'undefined' ? SparseShrubland  : ee.FeatureCollection([]), //45  | Sparse shrubland
      typeof (ClosedShrubland)  !== 'undefined' ? ClosedShrubland  : ee.FeatureCollection([]), //66  | Closed shrubland
      typeof (OpenShrubland)    !== 'undefined' ? OpenShrubland    : ee.FeatureCollection([]), //77  | Open shrubland
];

// merges all polygons
var samplesPolygons = ee.List(samplesList).iterate(
    function (sample, samplesPolygon) {
        return ee.FeatureCollection(samplesPolygon).merge(sample);
    },
    ee.FeatureCollection([])
);

// filter by user defined region "userRegion" if exists
samplesPolygons = ee.FeatureCollection(samplesPolygons)
    .filter(ee.Filter.bounds(region));

// avoid geodesic operation error
samplesPolygons = samplesPolygons.map(
    function (polygon) {
        return polygon.buffer(1, 10);
    }
);

var classValues = complementary.map(
    function (array) {
        return array[0];
    }
);

var classPoints = complementary.map(
    function (array) {
        return array[1];
    }
);

// generate training points
var aditionalTrainingPoints = generateAditionalPoints(samplesPolygons, classValues, classPoints);

// generate validation points (held out — not used for training in this script)
var aditionalValidationPoints = generateAditionalPoints(samplesPolygons, classValues, classPoints);

// set sample type
aditionalTrainingPoints = aditionalTrainingPoints.map(
    function (sample) {
        return sample.set('sample_type', 'training');
    }
);

aditionalValidationPoints = aditionalValidationPoints.map(
    function (sample) {
        return sample.set('sample_type', 'validation');
    }
);

// merge training and validation points
var aditionalSamplesPoints = aditionalTrainingPoints.merge(aditionalValidationPoints);


// ============================================================
// SECTION 5 — PER-YEAR TRAIN + CLASSIFY (stable + complementary)
// ============================================================
var terrain = ee.Image("JAXA/ALOS/AW3D30_V1_1").select("AVE");
var slope = ee.Terrain.slope(terrain);
// 🔁 REPLACE: Region-specific slope derived from a FABDEM DEM.
var slope_fab = ee.Image("projects/YOUR-PROJECT/assets/ANCILLARY_DATA/RASTER/MPHA/slope_JAXA-FABDEM_HD").select("FABDEM").rename('slope_fab');

var classifiedList = [];

years.forEach(
    function (year) {

        // read stable samples generated by step 4
        var stableSamples = assetStableSamples + '/samples-stable-' + year.toString() + '-' + regionId.toString() + '-' + version.stable_samples;

        // filter outliers
        var stableSamplesPoints = ee.FeatureCollection(stableSamples).filter(ee.Filter.eq('is_outlier', 'no'));

        var mosaicYear = mosaics
            .filter(ee.Filter.eq('year', year))
            .filter(ee.Filter.bounds(region))
            .mosaic()
            .addBands(slope_fab);

        mosaicYear = mosaicYear.select(featureSpace);

        // Collect the spectral information to get the trained samples
        var additionalTrainedSamples = mosaicYear.reduceRegions({
            'collection': aditionalTrainingPoints,
            'reducer': ee.Reducer.first(),
            'scale': 30,
        });

        additionalTrainedSamples = additionalTrainedSamples.filter(ee.Filter.notNull(['green_median_texture']));

        var samplesFinal = stableSamplesPoints.merge(additionalTrainedSamples);

        var classifier = ee.Classifier.smileRandomForest(rfParams)
            .train(samplesFinal, 'class', featureSpace);

        var classified = ee.Algorithms.If(
            samplesFinal.size().gt(0),
            mosaicYear.classify(classifier),
            ee.Image(0)
        );

        classified = ee.Image(classified).rename('classification_' + year.toString());

        classifiedList.push(classified);

        // Export points to asset (disabled in this saved run — uncomment
        // to also export the merged sample set used for this year).
        //var pointsName = 'samples-stable-additional-' + year.toString() + '-' + regionId.toString() + '-' + version.output;
        //Export.table.toAsset({
        //    "collection": samplesFinal,
        //    "description": 'additional' + pointsName,
        //    "assetId": assetAdditionalSamples + '/' + pointsName
        //});
    }
);


// ============================================================
// SECTION 6 — EXPORT
// ============================================================
// Export polygons to asset (disabled in this saved run — uncomment to
// also export the digitized correction polygons).
var polygonsName = 'samples-stable-additional-polygons-' + regionId.toString() + '-' + version.output;
//Export.table.toAsset({
//    "collection": samplesPolygons,
//    "description": polygonsName,
//    "assetId": assetAdditionalSamples + '/POLYGONS/' + polygonsName
//});

var classifiedStack = ee.Image(classifiedList);

classifiedStack = classifiedStack
    .set('collection_id', 3.0)
    .set('region_id', regionId)
    .set('version', version.classification)
    .set('territory', 'MPHA');

Export.image.toAsset({
    "image": classifiedStack,
    "description": 'MPHA-REGION-' + regionId + '-' + version.output,
    // 🔁 REPLACE: Update to your own GEE asset folder (see `assetClass`
    // above).
    "assetId": assetClass + '/MPHA-REGION-' + regionId + '-' + version.output,
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": region
});
