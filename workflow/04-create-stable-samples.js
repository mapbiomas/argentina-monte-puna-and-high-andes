/**
 *  
 */
var assetRegions = 'projects/mapbiomas-argentina/assets/ANCILLARY_DATA/VECTOR/CUYO/Cuyo_regiones';

var outputFolder = 'projects/mapbiomas-argentina/assets/COLLECTION1/SAMPLES/STABLE/CUYO';

var regionId = 3;

var version = {
    'stable_map': '2',
    'output_samples': '2'
};

var years = [
    1985, 1986, 1987, 1988, 1989, 1990,
    1991, 1992, 1993, 1994, 1995,
    1996, 1997, 1998, 1999, 2000,
    2001, 2002, 2003, 2004, 2005,
    2006, 2007, 2008, 2009, 2010,
    2011, 2012, 2013, 2014, 2015,
    2016, 2017, 2018, 2019, 2020,
    2021, 2022
];

var nSamplesPerClass = [
//  { 'class_id': 3, 'n_samples': 1000 },   //'3  Leñosas cerradas', ok
    { 'class_id': 4, 'n_samples': 500 },   //'4  Leñosas abiertas', ok
    { 'class_id': 45, 'n_samples': 500 },  //'45 Leñosas dispersas',
    { 'class_id': 12, 'n_samples': 1000 },  //'12 Herbáceas', ok
    { 'class_id': 11, 'n_samples': 200 },   //'11 Vegetación natural no leñosa inudable', ok
//  { 'class_id': 9, 'n_samples': 3000 },   //'9  Leñosas cultivadas',
    { 'class_id': 21, 'n_samples': 200 },   //'21 Mosaico de Usos', ok
//  { 'class_id': 24, 'n_samples': 3000 },  //'24 Áreas urbanas',
//  { 'class_id': 61, 'n_samples': 1000 },  //'61 Salares',
    { 'class_id': 25, 'n_samples': 2000 },   //'25 Otras áreas sin vegetación',ok
    { 'class_id': 33, 'n_samples': 200 },   //'33 Ríos, lagunas y lagos', ok
    { 'class_id': 34, 'n_samples': 200 },  //'34 Hielo y nieve en superficie'
];

//var gediThreshPerClass = [
//    { 'class_id': 59, 'min_value': 7, 'max_value': 100 },
//    { 'class_id': 60, 'min_value': 3, 'max_value': 6 },
//    { 'class_id': 12, 'min_value': 0, 'max_value': 2 },
//    { 'class_id': 21, 'min_value': 0, 'max_value': 2 },
//    { 'class_id': 33, 'min_value': 0, 'max_value': 2 },
//];

var assetStable = 'projects/mapbiomas-argentina/assets/COLLECTION1/CLASSIFICATION/STABLEMAP/CUYO/CUYO-STABLE-REGION-'
    + regionId.toString()
    + '-' +
    version.stable_map;

var assetMosaics = 'projects/nexgenmap/MapBiomas2/LANDSAT/ARGENTINA/mosaics-1';

//var assetGedi = 'users/potapovpeter/GEDI_V27/GEDI_SAM_v27';

var regions = ee.FeatureCollection(assetRegions);

//
var featureSpace = [
    'slope',
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

var palettes = require('users/mapbiomas/modules:Palettes.js');

var vis = {
    'min': 0,
    'max': 62,
    'palette': palettes.get('classification7')
};

var mosaics = ee.ImageCollection(assetMosaics);

var stable = ee.Image(assetStable).rename('reference');

Map.addLayer(stable.clip(regions.filter(ee.Filter.eq('Id', regionId))), vis, 'Stable', true);

//var gedi = ee.Image(assetGedi);
//
//var gediVis = {
//    "min": 0,
//    "max": 40,
//    "palette": [
//        "#86f1f3",
//        "#ffbeee",
//        "#daffe0",
//        "#c0debf",
//        "#08ff04",
//        "#037e07",
//        "#0b240a"
//    ]
//};
//
//Map.addLayer(gedi, gediVis, 'GEDI', false);
//
//var stableGedi = ee.List(gediThreshPerClass)
//    .iterate(
//        function (obj, stable) {
//            obj = ee.Dictionary(obj);
//            stable = ee.Image(stable);
//
//            var classId = ee.Image(ee.Number(obj.get('class_id')));
//            var minValue = ee.Image(ee.Number(obj.get('min_value')));
//            var maxValue = ee.Image(ee.Number(obj.get('max_value')));
//
//            stable = stable.where(stable.eq(classId).and((gedi.gte(minValue).and(gedi.lte(maxValue))).not()), 0);
//
//            return stable;
//        },
//        stable
//    );
//
//stableGedi = ee.Image(stableGedi);

//
// Create a drawing tool to build remaping polygons
// If there aren't polygons, the code works fine
//
//var drawinfTools = Map.drawingTools();
//
//var geometryList = drawinfTools.layers().map(
//    function (obj) {
//
//        var eeObject = obj.getEeObject();
//
//        return ee.Algorithms.If(
//            ee.String(ee.Algorithms.ObjectType(eeObject)).equals('FeatureCollection'),
//            eeObject,
//            ee.FeatureCollection(eeObject)
//        );
//
//    }
//);
//
//var featCollection = ee.FeatureCollection(geometryList);
//
//// flatten collection of collections into a single collection and
//// removes non-standard data
//featCollection = featCollection.flatten()
//    .filter(ee.Filter.neq('from', null))
//    .filter(ee.Filter.neq('to', null));
//
//print(featCollection);
//
//var imageFrom = ee.Image().paint(featCollection, 'from');
//var imageTo = ee.Image().paint(featCollection, 'to');
//
//// Apply images "from" and "to" to remap stable regions
//stableGedi = stableGedi.where(stableGedi.eq(imageFrom), imageTo);
//
//Map.addLayer(stableGedi, vis, 'Stable + GEDI', true);
Map.addLayer(regions.filter(ee.Filter.eq('Id', regionId)).style({color:'black',fillColor:'FF000000'}), {}, 'regions');
Map.centerObject(regions.filter(ee.Filter.eq('Id', regionId)), 7).setOptions("SATELLITE");


var terrain = ee.Image("JAXA/ALOS/AW3D30_V1_1").select("AVE");
var slope = ee.Terrain.slope(terrain);

////
var stableSamples = stable.stratifiedSample({
    'numPoints': 0,
    'classBand': 'reference',
    'region': regions.filter(ee.Filter.eq('Id', regionId)).geometry(),
    'classValues': classValues,
    'classPoints': classPoints,
    'scale': 30,
    'seed': 1,
    'geometries': true
});

 print(stableSamples.aggregate_histogram('reference'));

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
                'assetId': outputFolder + '/' + outputName
            }
        );
    }
);


//print(stableSamples.limit(100))
var mapbiomasPalette = palettes.get('classification7');
// visualize points using mapbiomas color palette
var samplesPointsVis = stableSamples.map(
    function (feature) {
        return feature.set('style', {
            'color': ee.List(mapbiomasPalette).get(feature.get('reference')),
            'width': 1,
        });
    }
);
Map.addLayer(samplesPointsVis.style({ 'styleProperty': 'style' }), {}, 'stableSamples');