var LeniosasCerradas = /* color: #d63000 */ee.FeatureCollection(
    [ee.Feature(
        ee.Geometry.Point([-62.12494644466, -42.469389034043225]),
        {
          "class": 3,
          "system:index": "0"
        })]),
LeniosasAbiertas = /* color: #d63000 */ee.FeatureCollection(
    [ee.Feature(
        ee.Geometry.Point([-61.64154800716, -42.48559480565056]),
        {
          "class": 4,
          "system:index": "0"
        })]),
LeniosasDispersas = /* color: #98ff00 */ee.FeatureCollection(
    [ee.Feature(
        ee.Geometry.Point([-61.86127456966, -42.32334826023925]),
        {
          "class": 45,
          "system:index": "0"
        })]),
HerbaceasInundables = /* color: #0b4a8b */ee.FeatureCollection(
    [ee.Feature(
        ee.Geometry.Point([-61.86127456966, -42.22579896743479]),
        {
          "class": 11,
          "system:index": "0"
        })]),
Herbaceas = /* color: #ffc82d */ee.FeatureCollection(
    [ee.Feature(
        ee.Geometry.Point([-61.72943863216, -42.25833217467175]),
        {
          "class": 12,
          "system:index": "0"
        })]),
LeniosasCultivadas = /* color: #00ffff */ee.FeatureCollection(
    [ee.Feature(
        ee.Geometry.Point([-61.86127456966, -42.29084860621225]),
        {
          "class": 9,
          "system:index": "0"
        })]),
MosaicoUsos = /* color: #bf04c2 */ee.FeatureCollection(
    [ee.Feature(
        ee.Geometry.Point([-61.77338394466, -42.12809871005434]),
        {
          "class": 21,
          "system:index": "0"
        })]),
CuerposAgua = /* color: #999900 */ee.FeatureCollection(
    [ee.Feature(
        ee.Geometry.Point([-62.25678238216, -42.32334826023925]),
        {
          "class": 33,
          "system:index": "0"
        })]),
HieloNieve = /* color: #009999 */ee.FeatureCollection(
    [ee.Feature(
        ee.Geometry.Point([-61.81732925716, -42.160682233252544]),
        {
          "class": 34,
          "system:index": "0"
        })]),
NoObservado = /* color: #ff00ff */ee.FeatureCollection(
    [ee.Feature(
        ee.Geometry.Point([-61.81732925716, -41.83409266857029]),
        {
          "class": 27,
          "system:index": "0"
        })]),
OtrasSinVegetacion = /* color: #0000ff */ee.FeatureCollection(
    [ee.Feature(
        ee.Geometry.Point([-61.64154800716, -42.06288136098127]),
        {
          "class": 25,
          "system:index": "0"
        })])
;
// 
//
var assetMosaics = 'projects/nexgenmap/MapBiomas2/LANDSAT/ARGENTINA/mosaics-1';

//
var assetRegions = 'projects/mapbiomas-argentina/assets/ANCILLARY_DATA/VECTOR/CUYO/Cuyo_regiones';

//
var assetStableSamples = 'projects/mapbiomas-argentina/assets/COLLECTION1/SAMPLES/STABLE/CUYO';

// 
var assetAdditionalSamples = 'projects/mapbiomas-argentina/assets/COLLECTION1/SAMPLES/ADDITIONAL/CUYO';

//
var assetClass = 'projects/mapbiomas-argentina/assets/COLLECTION1/CLASSIFICATION/COMPLEMENT_CLASSIFICATION/CUYO';

// define a region id
var regionId = 3;

var version = {
    'classification': '1',
    'stable_map': '1',
    'stable_samples': '1',
    'output': '2',
};

var assetStable = 'projects/mapbiomas-argentina/assets/COLLECTION1/CLASSIFICATION/STABLEMAP/CUYO/'
    + 'CUYO-STABLE-REGION-'
    + regionId.toString()
    + '-'
    + version.stable_map;
    
    
var clasif = 'projects/mapbiomas-argentina/assets/COLLECTION1/CLASSIFICATION/COMPLEMENT_CLASSIFICATION/CUYO/'
    + 'CUYO-REGION-'
    + regionId.toString()
    + '-'
    + version.stable_map;
    
    
    

var nTrainingPoints = 2000;   // Number of points to training
var nValidationPoints = 500;   // Number of points to validate

// number of complementary points
var complementary = [
//  [3, 1], //3 1.1 Leñosas cerradas
    [4, 1000], //4 1.2 Leñosas abiertas
    [45, 1000], //45 1.3 Leñosas dispersas
    [12, 1000], //12 2.1 Herbáceas
    [11, 1000], //11 2.2 Vegetación natural no leñosa inudable
//  [9, 1], //9 3.3 Leñosas cultivadas
    [21, 1000], //21 3.4. Mosaico de Usos
//  [24, 1], //24 4.1 Áreas urbanas
//  [61, 1], //61 4.2 Salares
    [25, 1000],  //25 4.3 Otras áreas sin vegetación
    [33, 1000], //33 5.1 Ríos, lagunas y lagos
    [34, 1000], //34 5.2 Hielo y nieve en superficie
//  [27, 0], //27 6. No Observado

];

// Landsat images that will be added to Layers
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

// random forest parameters
var rfParams = {
    'numberOfTrees': 70, //100
    'variablesPerSplit': 4,
    'minLeafPopulation': 25,
    'seed': 1
};

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
//
var palettes = require('users/mapbiomas/modules:Palettes.js');

var mosaics = ee.ImageCollection(assetMosaics);
var regions = ee.FeatureCollection(assetRegions);

var selectedRegion = regions.filter(ee.Filter.eq('Id', regionId));

var region = typeof (userRegion) !== 'undefined' ? userRegion : selectedRegion;

var mapbiomasPalette = palettes.get('classification7');

//
var visClass = {
    'min': 0,
    'max': 62,
    'palette': mapbiomasPalette,
    'format': 'png'
};

var visMos = {
    'bands': [
        'swir1_median',
        'nir_median',
        'red_median'
    ],
    'gain': [0.08, 0.06, 0.2],
    'gamma': 0.85
};

//------------------------------------------------------------------
// User defined functions
//------------------------------------------------------------------
/**
 * Create a function to collect random point inside the polygons
 * @param {*} polygons 
 * @param {*} nPoints 
 * @returns 
 */
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

/**
 * Create a function to collect random point inside the polygons
 * @param {*} polygons 
 * @param {*} nPoints 
 * @returns 
 */
var stratifiedPoints = function (image, nPoints, region) {

    image = image.rename('class');

    // Generate N random points inside the polygons
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
/**
 * 
 * @param {*} collection 
 * @param {*} seed 
 */
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
//
// stable
var stable = ee.Image(assetStable);

// Add mosaic for each year
//years.forEach(
//    function (year) {
//        var mosaicYear = mosaics
//            .filter(ee.Filter.eq('year', year))
//            .filter(ee.Filter.bounds(region))
//            .mosaic();
//
//        Map.addLayer(mosaicYear, visMos, year + ' ' + regionId, false);
//    }
//);


var samplesList = [
//    typeof (LeniosasCerradas    ) !== 'undefined' ? LeniosasCerradas : ee.FeatureCollection([]), //1.1 Leñosas cerradas
      typeof (LeniosasAbiertas    ) !== 'undefined' ? LeniosasAbiertas : ee.FeatureCollection([]), //1.2 Leñosas abiertas
      typeof (LeniosasDispersas   ) !== 'undefined' ? LeniosasDispersas : ee.FeatureCollection([]), //1.3 Leñosas dispersas
      typeof (Herbaceas           ) !== 'undefined' ? Herbaceas : ee.FeatureCollection([]), //2.1 Herbáceas
      typeof (HerbaceasInundables ) !== 'undefined' ? HerbaceasInundables : ee.FeatureCollection([]), //2.2 Vegetación natural no leñosa inudable
//    typeof (LeniosasCultivadas  ) !== 'undefined' ? LeniosasCultivadas : ee.FeatureCollection([]), //3.3 Leñosas cultivadas
      typeof (MosaicoUsos         ) !== 'undefined' ? MosaicoUsos : ee.FeatureCollection([]), //3.4. Mosaico de Usos
//    typeof (Urbano              ) !== 'undefined' ? Urbano : ee.FeatureCollection([]), //4.1 Áreas urbanas
//    typeof (Salares             ) !== 'undefined' ? Salares : ee.FeatureCollection([]), //4.2 Salares
      typeof (OtrasSinVegetacion  ) !== 'undefined' ? OtrasSinVegetacion : ee.FeatureCollection([]), //4.3 Otras áreas sin vegetación
      typeof (CuerposAgua         ) !== 'undefined' ? CuerposAgua : ee.FeatureCollection([]), //5.1 Ríos, lagunas y lagos
      typeof (HieloNieve          ) !== 'undefined' ? HieloNieve : ee.FeatureCollection([]), //5.2 Hielo y nieve en superficie
//    typeof (NoObservado         ) !== 'undefined' ? NoObservado : ee.FeatureCollection([]), //6. No Observado
];

print(samplesList);

//------------------------------------------------------------------
// User defined functions
//------------------------------------------------------------------
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

// generate validation points
var aditionalValidationPoints = generateAditionalPoints(samplesPolygons, classValues, classPoints);

print('trainingPoints', aditionalTrainingPoints.aggregate_histogram('class'));
print('validationPoints', aditionalValidationPoints.aggregate_histogram('class'));

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

// visualize points using mapbiomas color palette
var samplesPointsVis = aditionalSamplesPoints.map(
    function (feature) {
        return feature.set('style', {
            'color': ee.List(mapbiomasPalette).get(feature.get('class')),
            'width': 1,
        });
    }
);

//
var terrain = ee.Image("JAXA/ALOS/AW3D30_V1_1").select("AVE");
var slope = ee.Terrain.slope(terrain);

var classifiedList = [];

years.forEach(
    function (year) {

        // read stable samples generated by step 4
        var stableSamples = assetStableSamples + '/samples-stable-' + year.toString() + '-' + regionId.toString() + '-' + version.stable_samples;

        var stableSamplesPoints = ee.FeatureCollection(stableSamples);

       // print('stablePoints', stableSamplesPoints.aggregate_histogram('class'));

        // visualize points using mapbiomas color palette
        var stableSamplesPointsVis = stableSamplesPoints.map(
            function (feature) {
                return feature.set('style', {
                    'color': ee.List(mapbiomasPalette).get(feature.get('class')),
                    'width': 1,
                });
            }
        );

        var mosaicYear = mosaics
            .filter(ee.Filter.eq('year', year))
            .filter(ee.Filter.bounds(region))
            .mosaic()
            .addBands(slope);

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

       
          Map.addLayer(mosaicYear, visMos, year + ' ' + regionId + ' mosaic', false);      

          Map.addLayer(ee.Image(clasif).select('classification_' + year).clip(regions.filter(ee.Filter.eq('Id', regionId))), visClass, year.toString() + ' ' + regionId.toString() + 'class anterior', false);
      
          Map.addLayer(classified.clip(regions.filter(ee.Filter.eq('Id', regionId))), visClass, year.toString() + ' ' + regionId.toString() + ' class actual', false);
      
      //  Map.addLayer(stableSamplesPointsVis.style({ 'styleProperty': 'style' }), {}, year.toString() + ' ' + regionId.toString() + ' stable sample points', false);

        // Export points to asset
        var pointsName = 'samples-stable-additional-' + year.toString() + '-' + regionId.toString() + '-' + version.output;

        Export.table.toAsset({
            "collection": samplesFinal,
            "description": 'additional' + pointsName,
            "assetId": assetAdditionalSamples + '/' + pointsName
        });
    }
);

//muestras estables vis

var stableSamples_ = assetStableSamples + '/samples-stable-' + 2022 + '-' + regionId.toString() + '-' + version.stable_samples;

var stableSamplesPoints_ = ee.FeatureCollection(stableSamples_);

// visualize points using mapbiomas color palette
        var stableSamplesPointsVis = stableSamplesPoints_.map(
            function (feature) {
                return feature.set('style', {
                    'color': ee.List(mapbiomasPalette).get(feature.get('class')),
                    'width': 1,
                });
            }
        );

Map.addLayer(stableSamplesPointsVis.style({ 'styleProperty': 'style' }), {}, ' ' + regionId.toString() + ' stable sample points', false);

//
// Map.addLayer(classification.select('classification_' + year), visClass, 'classification ' + year, true);
Map.addLayer(stable.clip(regions.filter(ee.Filter.eq('Id', regionId))), visClass, 'stable', false);
Map.addLayer(selectedRegion.style({color:'black',fillColor:'FF000000'}), {}, 'region ' + regionId.toString(), true);
//Map.centerObject(selectedRegion, 7).setOptions("SATELLITE");

Map.addLayer(samplesPointsVis.style({ 'styleProperty': 'style' }), {}, 'aditional samples - points', false);

// Export polygons to asset
var polygonsName = 'samples-stable-additional-polygons-' + regionId.toString() + '-' + version.output;

//Export.table.toAsset({
//    "collection": samplesPolygons,
//    "description": polygonsName,
//    "assetId": assetSamples + '/POLYGONS/' + polygonsName
//});

var classifiedStack = ee.Image(classifiedList);

classifiedStack = classifiedStack
    .set('collection_id', 1.0)
    .set('region_id', regionId)
    .set('version', version.classification)
    .set('territory', 'CUYO');
    
    
Map.addLayer(classifiedStack ,null, 'Clas - Región ' + regionId, false);

//modifica orden de layers
// Obtiene el número total de capas
var numCapas = Map.layers().length();
//print(numCapas);

// Obtiene la última capa
var ultimaCapa = Map.layers().get(numCapas - 1);

// Almacena las capas en un arreglo temporal (excepto la última)
var capasTemporales = [];
for (var i = 0; i < numCapas - 1; i++) {
  capasTemporales.push(Map.layers().get(i));
}

// Elimina todas las capas del mapa
Map.clear();

// Agrega la última capa al principio
Map.add(ultimaCapa);

// Agrega las capas restantes en el orden original
for (var j = 0; j < numCapas - 1; j++) {
  Map.add(capasTemporales[j]);
}










Export.image.toAsset({
    "image": classifiedStack,
    "description": 'CUYO-REGION-' + regionId + '-' + version.output,
    "assetId": assetClass + '/CUYO-REGION-' + regionId + '-' + version.output,
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": region
}); 

//////////////////////LEYENDA///////////////////////////////  
var colors = [
'1f8d49',//'3  Leñosas cerradas', ok
'7dc975',//'4  Leñosas abiertas', ok
'c8ffb4',//'45 Leñosas dispersas',
'd6bc74',//'12 Herbáceas', ok
'519799',//'11 Vegetación natural no leñosa inudable', ok
'7a6c00',//'9  Leñosas cultivadas',
'ffefc3',//'21 Mosaico de Usos', ok
'd4271e',//'24 Áreas urbanas',
'faf5de',//'61 Salares',
'db4d4f',//'25 Otras áreas sin vegetación',ok
'2532e4',//'33 Ríos, lagunas y lagos', ok
'93dfe6' //34 Hielo y nieve en superficie'
]
 
var names = [
'3  Leñosas cerradas',
'4  Leñosas abiertas',
'45 Leñosas dispersas',
'12 Herbáceas',
'11 Vegetación natural no leñosa inudable',
'9  Leñosas cultivadas',
'21 Mosaico de Usos',
'24 Áreas urbanas',
'61 Salares',
'25 Otras áreas sin vegetación',
'33 Ríos, lagunas y lagos',
'34 Hielo y nieve en superficie'
  ];



var legend = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px 15px'
  }
});

// Create and add the legend title.
var legendTitle = ui.Label({
  value: 'Leyenda',
  style: {
    fontWeight: 'bold',
    fontSize: '16px',
    margin: '0 0 4px 0',
    padding: '0'
  }
});

legend.add(legendTitle);

// var loading = ui.Label('Legend:', {margin: '2px 0 4px 0'});
// legend.add(loading);

var makeRow = function(color, name) {
  // Create the label that is actually the colored box.
  var colorBox = ui.Label({
    style: {
      backgroundColor: '#' + color,
      // Use padding to give the box height and width.
      padding: '8px',
      margin: '0 0 4px 0'
    }
  });

  // Create the label filled with the description text.
  var description = ui.Label({
    value: name,
    style: {margin: '0 0 4px 6px'}
  });

  return ui.Panel({
    widgets: [colorBox, description],
    layout: ui.Panel.Layout.Flow('horizontal')
  });
};

for (var i = 0; i < names.length; i++){
legend.add(makeRow(colors[i], names[i]));
}

Map.add(legend)

// inicio y fien periodo series de tiempo
var startDate = '1985-01-01';
var endDate = '2023-12-31';
var sampleBands = ee.List(['NDVI']); 

var titulo = 'coordenadas'


var get_time_serie_plot = function(punto){

  ///--------------------- SERIE DE TIEMPO LANDSAT ---------------------------------------///

  // Landsat processing ----------------------------------------------------------

  // includes basic cleaning such as cloud/shadow masking using the 'cfmask' band
  // and trimming scene edges; doesn't mask saturated pixels

  var sensorBandDictLandsatTOA = ee.Dictionary({
                        L8 : ee.List([1,2,3,4,5,9,6,'BQA']),
                        L7 : ee.List([0,1,2,3,4,5,7,'BQA']),
                        L5 : ee.List([0,1,2,3,4,5,6,'BQA']),
                        L4 : ee.List([0,1,2,3,4,5,6,'BQA'])
  });

  var bandNamesLandsatTOA = ee.List(['blue','green','red','nir','swir1','temp','swir2','BQA']);



// cloud mask for Landsat Collection 2  
var cloudMaskC2 = function(image) {
  var dilatedCloud = (1 << 1)
  var cloud = (1 << 3)
  var cloudShadow = (1 << 4)
  var qa = image.select('QA_PIXEL');
  // var mask = qa.bitwiseAnd(dilatedCloud)
  //   .and(qa.bitwiseAnd(cloud))
  //   .or(qa.bitwiseAnd(cloudShadow))
  var mask = qa.bitwiseAnd(dilatedCloud).eq(0).and(
      qa.bitwiseAnd(cloud).eq(0)).and(qa.bitwiseAnd(cloudShadow).eq(0))
  //var mask2 = image.mask().reduce(ee.Reducer.min());
  return image.updateMask(mask);
}

// Applies scaling factors.
function applyScaleFactors(image) {
  var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2);
  var thermalBands = image.select('ST_B.*').multiply(0.00341802).add(149.0);
  return image.addBands(opticalBands, null, true)
              .addBands(thermalBands, null, true);
}


///////////////////////////

  var l5 = ee.ImageCollection('LANDSAT/LT05/C02/T1_L2')
      .filterDate(startDate,endDate)
      .filterBounds(punto)
      .filterMetadata("CLOUD_COVER", "less_than",5)
      .map(cloudMaskC2)
      .map(applyScaleFactors)
      .select(['SR_B1','SR_B2','SR_B3','SR_B4','SR_B5','SR_B7'],['blue','green','red','nir','swir1','swir2'])
      //.rename(['blue','green','red','nir','swir1','temp','swir2'])
      //.select(sensorBandDictLandsatTOA.get('L5'), bandNamesLandsatTOA);
//print(l5.first())
  var l80 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
      .filterDate(startDate,endDate)
      .filterBounds(punto)
      .filterMetadata("CLOUD_COVER", "less_than", 5)
      .map(cloudMaskC2)
      .map(applyScaleFactors)
      .select(['SR_B2','SR_B3','SR_B4','SR_B5','SR_B6','SR_B7'],['blue','green','red','nir','swir1','swir2'])
      //.rename(['blue','green','red','nir','swir1','temp','swir2'])
      //.select(sensorBandDictLandsatTOA.get('L8'), bandNamesLandsatTOA);
//print(l80.first())
  var l7 = ee.ImageCollection('LANDSAT/LE07/C02/T1_L2')
      .filterDate(startDate,endDate)
      .filterBounds(punto)
      .filterMetadata("CLOUD_COVER", "less_than", 5)
      .map(cloudMaskC2)
      .map(applyScaleFactors)
      .select(['SR_B1','SR_B2','SR_B3','SR_B4','SR_B5','SR_B7'],['blue','green','red','nir','swir1','swir2'])
      //.rename(['blue','green','red','nir','swir1','temp','swir2'])

      //.select(sensorBandDictLandsatTOA.get('L7'), bandNamesLandsatTOA);
//print(l7.first())

// merge Landsat 5 and 7 (same band naming system)
  var l5l7Merge = ee.ImageCollection(l5.merge(l7));


// CREA FUNCIONES PARA GENERAR MASCARA Y NDVI
// create function to mask clouds, cloud shadows, snow using the cfmask layer in SR products
  // var cloudMaskLX = function(img){
  //   var cfmask_conf = ee.Image(img.select(['BQA']));
  //   var img = img.mask(cfmask_conf.eq(672));
  //   return img
  // };

  // var cloudMaskL8 = function(img){
  //   var cfmask_conf = ee.Image(img.select(['BQA']));
  //   var img = img.mask(cfmask_conf.eq(2720));
  //   return img
  // };


// Generacion NDVI
  var addGreenTimeBands = function(image) {
    return image.clip(punto)
  // NDVI
    .addBands(image.normalizedDifference(['nir','red']).rename('NDVI'))
  // system time
    .addBands(image.metadata('system:time_start').rename("time"))
  };


// APLICA FUNCIONES SOBRE CADA Image Collection
// apply functions over the image collection: l5 and l7
  var l5l7Merge2 = l5l7Merge
    .map(addGreenTimeBands)
    // .map(cloudMaskLX);

// apply functions over the image collection: l8
  var l8 = l80
    .map(addGreenTimeBands)
    // .map(cloudMaskL8);


// COMBINA L5 y L7 con L8
  var annualSR0 = ee.ImageCollection(l5l7Merge2.merge(l8));

// Selecciona banda de interés (NDVI)
  var cToSample = annualSR0.select(sampleBands)
  //print(cToSample)






// DOES NOT INTERPOLATE WITH "vAxis" (LINE 132)

  // var tsLANDSAT2 = ui.Chart.image.seriesByRegion({
  //   imageCollection: cToSample,
  //   regions: punto.buffer(30),
  //   reducer: ee.Reducer.mean(),
  //   scale: 30,
  //   band: 'NDVI',
  //   xProperty: 'system:time_start',
  //   seriesProperty: 'clase'
  // });

  // // Does not interpolate with "vAxis"
  //   tsLANDSAT2.setOptions(
  //   {
  //     title: ee.String('LANDSAT: (').cat(lon).cat(', ').cat(lat).cat(')\n').cat(titulo).getInfo(),
  //     vAxis: { title: "IVN (x10.000)", viewWindow: {min:0, max:1} },  //  <<<<<<<<<<<<<<<<<<<
  //     interpolateNulls: true
  //   });

  // INTERPOLATES WITHOUT "vAxis" (LINE 113)
    var tsLANDSAT = ui.Chart.image.seriesByRegion({
      imageCollection: cToSample,
      regions: punto.buffer(30),
      reducer: ee.Reducer.mean(),
      scale: 30,
      band: 'NDVI',
      xProperty: 'system:time_start',
      seriesProperty: 'clase'
    });

    // Interpolates without "vAxis"
    tsLANDSAT.setOptions(
      { colors: ['black'],
        title: 'LANDSAT: Serie NDVI',
      });


  return tsLANDSAT;
}


var panel = null;
var chk_refresh_plot_flag = null;
var get_panel_chart_ts = function(){
  
  Map.onClick(function(point){

    var punto = ee.Geometry.Point([point["lon"], point["lat"]]);
    
    if(chk_refresh_plot_flag.getValue()){
      panel.remove(panel.widgets().get(1))
      panel.insert(1,get_time_serie_plot(punto));
      
    }
    
  });
  
  chk_refresh_plot_flag = ui.Checkbox("¿Actualizar serie?")
  
  var panel = ui.Panel({
    widgets: [chk_refresh_plot_flag],
    layout: ui.Panel.Layout.Flow('vertical')
  })
  return panel
}

panel = ui.Panel({
  widgets: [get_panel_chart_ts()],
  style: {width: "35%", position: "bottom-right"}
  
})
Map.add(panel)
////// 