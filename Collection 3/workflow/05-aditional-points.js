// ============================================================
// Cuyo Collection 3 | Script 05 — Add Complementary Points & Classify
// ============================================================
//
// Genera v1 metaregional de Complement_Classification usando la v4 de
// las random stable samples, sin muestras complementarias (este run
// particular no usó puntos complementarios — ver `complementary` abajo).
// Adaptado a MetaRegion usando la v4 de las muestras estables.
//
// LEYENDA
// 3   | Bosques cerrados             | #1f8d49
// 4   | Bosques abiertos             | #7dc975
// 9   | Leñosas cultivadas           | #7a6c00
// 11  | Herbacéas inundables         | #519799
// 12  | Pastizales                   | #d6bc74
// 21  | Mosaico de Usos              | #ffefc3
// 25  | Áreas sin vegetación         | #db4d4f
// 33  | Ríos, lagunas y lagos        | #2532e4
// 34  | Hielo y nieve en superficie  | #93dfe6
// 45  | Arbustales dispersos         | #e04cfa
// 66  | Arbustales cerrados          | #91ff36
// 77  | Arbustales abiertos          | #a2c830
//
// DESCRIPTION:
//   Refines one region's stable-samples classification by adding
//   manually digitized "complementary" correction points for classes
//   that are poorly represented in the stable samples. For each year,
//   merges the stable samples (filtered to drop outliers) with the
//   complementary points, retrains, and classifies.
//
// METHODOLOGY:
//   1. For each land-cover class that needs correction, the analyst
//      manually digitizes one or more polygons in the Code Editor
//      (imported at the top of the script) marking areas of that class.
//   2. Merge all class polygons into one FeatureCollection and draw a
//      stratified sample of training + validation points from them
//      (counts per class set in `complementary`).
//   3. For each year: load that (region, year)'s stable sample points
//      (script 04 output, outliers excluded), extract predictor values
//      at the complementary training points, merge both sample sets,
//      train `ee.Classifier.smileRandomForest`, and classify.
//   4. Stack all years into one multi-year classification image and
//      export it.
//
// INPUT:
//   - Manually digitized per-class correction polygons (drawn per region
//     — see SECTION 2).
//   - Per (region, year) stable sample points (script 04 output).
//   - Zones FeatureCollection (Cuyo regions, property `Id2`).
//   - Annual Landsat mosaics for Argentina.
//   - ALOS World 3D-30m terrain slope (public) and a FABDEM-derived
//     slope layer specific to this repository.
//
// OUTPUT:
//   - Multi-year classification image for the region, one
//     `classification_<year>` band per year. Exported as
//     `CUYO-REGION-<regionId>-<version.output>`.
//
// USAGE NOTE: this script processes ONE region per run — change
// `regionId` (SECTION 1) and redraw the correction polygons (SECTION 2)
// for each region. See also 05b-aditional-points.js, a later iteration of
// this same step with a refined outlier-filtering and complementary-point
// workflow.
//
// PREVIOUS STEP: 04-create-stable-samples.js (produces the per-year
//                sample points refined here)
// NEXT STEP:     06a-integration.js (mosaics the regions and integrates
//                the classifications produced here)
//
// AUTHORS: MapBiomas Argentina — Cuyo team
// ============================================================


// ============================================================
// SECTION 1 — CONFIGURATION PARAMETERS
// ============================================================
// MetaRegion
var regionId = 15;

// OJO CON ESTO Y LAS VERSIONES DE LAS SAMPLES
var version = {
    'classification': '1',
    'stable_map': '1',
    'stable_samples': '4',
    'output': '1', // primera metaregional
};

var nTrainingPoints = 2000;   // Number of points to training
var nValidationPoints = 500;   // Number of points to validate

// EDITAR — number of complementary points per class for this region. All
// 0 in this saved run (no complementary points were needed here); set to
// the desired count per class when correcting a different region.
var complementary = [
    [ 3, 0], // 3   | Bosques cerrados
    [ 4, 0], // 4   | Bosques abiertos
    [ 9, 0], // 9   | Leñosas cultivadas
    [11, 0], //11  | Herbacéas inundables
    [12, 0], //12  | Pastizales
    [21, 0], //21  | Mosaico de Usos
    [25, 0], //25  | Áreas sin vegetación
    [33, 0], //33  | Ríos, lagunas y lagos
    [34, 0], //34  | Hielo y nieve en superficie
    [45, 0], //45  | Arbustales dispersos
    [66, 0], //66  | Arbustales cerrados
    [77, 0]  //77  | Arbustales abiertos
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
var BosquesCerrados = ee.FeatureCollection([]);       // 3  | Bosques cerrados
var BosquesAbiertos = ee.FeatureCollection([]);       // 4  | Bosques abiertos
var ArbustalesCerrados = ee.FeatureCollection([]);    // 66 | Arbustales cerrados
var ArbustalesAbiertos = ee.FeatureCollection([]);    // 77 | Arbustales abiertos
var ArbustalesDispersos = ee.FeatureCollection([]);   // 45 | Arbustales dispersos
var Pastizales = ee.FeatureCollection([]);            // 12 | Pastizales
var HerbaceasInundables = ee.FeatureCollection([]);   // 11 | Herbacéas inundables
var LeniosasCultivadas = ee.FeatureCollection([]);    // 9  | Leñosas cultivadas
var MosaicoUsos = ee.FeatureCollection([]);           // 21 | Mosaico de Usos
var OtrasSinVegetacion = ee.FeatureCollection([]);    // 25 | Áreas sin vegetación
var CuerposAgua = ee.FeatureCollection([]);           // 33 | Ríos, lagunas y lagos
var HieloNieve = ee.FeatureCollection([]);            // 34 | Hielo y nieve en superficie


// ============================================================
// SECTION 3 — INPUT DATA
// ============================================================
// 🔁 REPLACE: Annual Landsat mosaics for Argentina.
var assetMosaics = 'projects/YOUR-PROJECT/LANDSAT/ARGENTINA/mosaics-1';
// 🔁 REPLACE: Zones FeatureCollection (Cuyo regions, property `Id2`).
var assetRegions = 'projects/YOUR-PROJECT/assets/ANCILLARY_DATA/VECTOR/CUYO/regional-assets_cuyo-argcol2_buffer2km_reg';
// 🔁 REPLACE: Per (region, year) stable sample points (script 04 output).
var assetStableSamples = 'projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-3/GENERAL/SAMPLES/RANDOM_STABLE/CUYO';
// 🔁 REPLACE: Update to your own GEE asset folder for the complementary
// training points/polygons.
var assetAdditionalSamples = 'projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-3/GENERAL/SAMPLES/COMPLEMENT/CUYO';
// 🔁 REPLACE: Update to your own GEE asset folder for the classification
// output.
var assetClass = 'projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-3/GENERAL/CLASSIFICATION/COMPLEMENT_CLASSIFICATION/CUYO';

// Areas Estables MetaRegion — history: earlier versions mosaicked 5
// separate per-region stable maps (R1..R5); the current stable map
// (script 03) already covers all regions in one asset (R1-11).
// var stablemapR1 = ee.Image('.../STABLEMAP/CUYO/CUYO-STABLE-REGION-1-1');
// ... (R2..R5) ...
// var assetStable = ee.ImageCollection([stablemapR1, ..., stablemapR5]).mosaic();

// 🔁 REPLACE: Stable map (script 03 output).
var assetStable = ee.Image('projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-3/GENERAL/CLASSIFICATION/STABLEMAP/CUYO/CUYO-STABLE-REGION-R1-11-1');

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

    // convert polygons to raster
    var polygonsRaster = ee.Image().paint({
        featureCollection: polygons,
        color: 'class'
    }).rename('class');

    // Generate N random points inside the polygons
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

    // Adds a column of deterministic pseudorandom numbers to a collection.
    // The range 0 (inclusive) to 1000000000 (exclusive).
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

    // list of random ids
    var randomIdList = ee.List(
        collection.reduceColumns(ee.Reducer.toList(), ['new_id'])
            .get('list'));

    // list of sequential ids
    var sequentialIdList = ee.List.sequence(1, collection.size());

    // set new ids
    var shuffled = collection.remap(randomIdList, sequentialIdList, 'new_id');

    return shuffled;
};

var stable = ee.Image(assetStable);

var samplesList = [
      typeof (BosquesCerrados)      !== 'undefined' ? BosquesCerrados      : ee.FeatureCollection([]), //3   | Bosques cerrados
      typeof (BosquesAbiertos)      !== 'undefined' ? BosquesAbiertos      : ee.FeatureCollection([]), //4   | Bosques abiertos
      typeof (LeniosasCultivadas)   !== 'undefined' ? LeniosasCultivadas   : ee.FeatureCollection([]), //9   | Leñosas cultivadas
      typeof (HerbaceasInundables)  !== 'undefined' ? HerbaceasInundables  : ee.FeatureCollection([]), //11  | Herbacéas inundables
      typeof (Pastizales)           !== 'undefined' ? Pastizales           : ee.FeatureCollection([]), //12  | Pastizales
      typeof (MosaicoUsos)          !== 'undefined' ? MosaicoUsos          : ee.FeatureCollection([]), //21  | Mosaico de Usos
      typeof (OtrasSinVegetacion)   !== 'undefined' ? OtrasSinVegetacion   : ee.FeatureCollection([]), //25  | Áreas sin vegetación
      typeof (CuerposAgua)          !== 'undefined' ? CuerposAgua          : ee.FeatureCollection([]), //33  | Ríos, lagunas y lagos
      typeof (HieloNieve)           !== 'undefined' ? HieloNieve           : ee.FeatureCollection([]), //34  | Hielo y nieve en superficie
      typeof (ArbustalesDispersos)  !== 'undefined' ? ArbustalesDispersos  : ee.FeatureCollection([]), //45  | Arbustales dispersos
      typeof (ArbustalesCerrados)   !== 'undefined' ? ArbustalesCerrados   : ee.FeatureCollection([]), //66  | Arbustales cerrados
      typeof (ArbustalesAbiertos)   !== 'undefined' ? ArbustalesAbiertos   : ee.FeatureCollection([]), //77  | Arbustales abiertos
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
var slope_fab = ee.Image("projects/YOUR-PROJECT/assets/ANCILLARY_DATA/RASTER/CUYO/slope_JAXA-FABDEM_HD").select("FABDEM").rename('slope_fab');

var classifiedList = [];

years.forEach(
    function (year) {

        // read stable samples generated by step 4
        var stableSamples = assetStableSamples + '/samples-stable-' + year.toString() + '-' + regionId.toString() + '-' + version.stable_samples;

        // filtra outliers
        var stableSamplesPoints = ee.FeatureCollection(stableSamples).filter(ee.Filter.eq('is_outlier', 'no'));

        var mosaicYear = mosaics
            .filter(ee.Filter.eq('year', year))
            .filter(ee.Filter.bounds(region))
            .mosaic()
            .addBands(slope)
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
    .set('collection_id', 1.0)
    .set('region_id', regionId)
    .set('version', version.classification)
    .set('territory', 'CUYO');

Export.image.toAsset({
    "image": classifiedStack,
    "description": 'CUYO-REGION-' + regionId + '-' + version.output,
    // 🔁 REPLACE: Update to your own GEE asset folder (see `assetClass`
    // above).
    "assetId": assetClass + '/CUYO-REGION-' + regionId + '-' + version.output,
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": region
});
