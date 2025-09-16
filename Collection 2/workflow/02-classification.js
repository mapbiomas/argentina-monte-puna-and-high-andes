 
// Leyenda C2

// 3       | Bosques cerrados              |
// 4       | Bosques abiertos              |
// 66      | Arbustales cerrados           |
// 77      | Arbustales abiertos           |
// 45      | Arbustales dispersos          |
// 12      | Pastizales                    |
// 11      | Herbacéas inundables          |
// 9       | Leñosas cultivadas            |
// 21      | Mosaico de Usos               |
// 25      | Áreas sin vegetación          |
// 33      | Ríos, lagunas y lagos         |
// 34      | Hielo y nieve en superficie   |


// define a region name
var regionId = 1;

// assets version
var version = {
    'samples': '2',           // input samples, outliers excluidos
    'aditional_samples': '1', // output samples
    'classification': '1',    // output classification
};

// [0] none
// [0.5] 50% of points
// [0.75] 75% of points
// [1] all points

//Revisar weights!
var classWeights = [
    [3  , 0], //Bosques cerrados           
    [4  , 0],   //Bosques abiertos           
    [66 , 0],   //Arbustales cerrados        
    [77 , 0.4],   //Arbustales abiertos        
    [45 , 1], //Arbustales dispersos       
    [12 , 1],   //Pastizales                 
    [11 , 0], //Herbacéas inundables       
    [9  , 0], //Leñosas cultivadas         
    [21 , 0], //Mosaico de Usos            
    [25 , 0.4],   //Áreas sin vegetación       
    [33 , 0], //Ríos, lagunas y lagos      
    [34 , 0], //Hielo y nieve en superficie
];



// no aplica
// number of complementary points
//var complementary = [
//    [3  , 0.1], //Bosques cerrados           
//    [4  , 1],   //Bosques abiertos           
//    [66 , 1],   //Arbustales cerrados        
//    [77 , 1],   //Arbustales abiertos        
//    [45 , 0.5], //Arbustales dispersos       
//    [12 , 0],   //Pastizales                 
//    [11 , 0.1], //Herbacéas inundables       
//    [9  , 0.1], //Leñosas cultivadas         
//    [21 , 0.1], //Mosaico de Usos            
//    [25 , 1],   //Áreas sin vegetación       
//    [33 , 0.1], //Ríos, lagunas y lagos      
//    [34 , 0.1], //Hielo y nieve en superficie
//];



// min and max number of samples allowed
var nSamplesAllowed = {
    'min': 200,
    'max': 2000,
};

// random forest parameters
var rfParams = {
    'numberOfTrees': 70, //100
    'variablesPerSplit': 4,
    'minLeafPopulation': 25,
    'seed': 1
}


//2025
var assetMosaics = 'projects/nexgenmap/MapBiomas2/LANDSAT/ARGENTINA/mosaics-1';

//2025
var assetRegions = 'projects/mapbiomas-argentina/assets/ANCILLARY_DATA/VECTOR/CUYO/regional-assets_cuyo-argcol2_buffer2km_reg';


// Classes that will be exported
var assetSamples = 'projects/mapbiomas-argentina/assets/LAND-COVER/COLLECTION-2/GENERAL/SAMPLES/STABLE/CUYO';

//2025
var assetClass = 'projects/mapbiomas-argentina/assets/LAND-COVER/COLLECTION-2/GENERAL/CLASSIFICATION/PRECLASSIFICATION/CUYO';

//
var years = [
    1985, 1986, 1987, 1988, 1989, 
    1990, 1991, 1992, 1993, 1994, 
    1995, 1996, 1997, 1998, 1999, 
    2000, 2001, 2002, 2003, 2004, 
    2005, 2006, 2007, 2008, 2009, 
    2010, 2011, 2012, 2013, 2014, 
    2015, 2016, 2017, 2018, 2019, 
    2020, 2021, 2022, 2023, 2024
];


// Estilos & Visualización
var mapbiomasPalette = require('users/mapbiomas/modules:Palettes.js').get('classification9')
.concat(["#000000","#000000","#000000","#000000","#000000","#000000","#000000","#a2c830"])
//print(mapbiomasPalette)

var visClass = {
    'min': 0,
    'max': 77,
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

//2025
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



// No aplica
//------------------------------------------------------------------
// User defined functions
//------------------------------------------------------------------
/**
 * Create a function to collect random point inside the polygons
 * @param {*} polygons 
 * @param {*} nPoints 
 * @returns 
 */
//var generateAditionalPoints = function (polygons, classValues, classPoints) {
//
//    // convert polygons to raster
//    var polygonsRaster = ee.Image().paint({
//        featureCollection: polygons,
//        color: 'class'
//    }).rename('class');
//
//    // Generate N random points inside the polygons
//    var points = polygonsRaster.stratifiedSample({
//        'numPoints': 1,
//        'classBand': 'class',
//        'classValues': classValues,
//        'classPoints': classPoints,
//        'region': polygons,
//        'scale': 30,
//        'seed': 1,
//        'dropNulls': true,
//        'geometries': true,
//    });
//
//    return points;
//};



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
var mosaics = ee.ImageCollection(assetMosaics);
var regions = ee.FeatureCollection(assetRegions);

var selectedRegion = regions.filter(ee.Filter.eq('Id', regionId));


var region = typeof (userRegion) !== 'undefined' ? userRegion : selectedRegion;
//No aplica, eventualmente actualizar a clases C2
//
//var samplesList = [
//    typeof (c03) !== 'undefined' ? c03 : ee.FeatureCollection([]), //1.1 Leñosas cerradas
//    typeof (c04) !== 'undefined' ? c04 : ee.FeatureCollection([]), //1.2 Leñosas abiertas
//    typeof (c45) !== 'undefined' ? c45 : ee.FeatureCollection([]), //1.3 Leñosas dispersas
//    typeof (c12) !== 'undefined' ? c12 : ee.FeatureCollection([]), //2.1 Herbáceas
//    typeof (c11) !== 'undefined' ? c11 : ee.FeatureCollection([]), //2.2 Vegetación natural no leñosa inudable
//    typeof (c09) !== 'undefined' ? c09 : ee.FeatureCollection([]), //3.3 Leñosas cultivadas
//    typeof (c21) !== 'undefined' ? c21 : ee.FeatureCollection([]), //3.4. Mosaico de Usos
//    typeof (c24) !== 'undefined' ? c24 : ee.FeatureCollection([]), //4.1 Áreas urbanas
//    typeof (c61) !== 'undefined' ? c61 : ee.FeatureCollection([]), //4.2 Salares
//    typeof (c25) !== 'undefined' ? c25 : ee.FeatureCollection([]), //4.3 Otras áreas sin vegetación
//    typeof (c33) !== 'undefined' ? c33 : ee.FeatureCollection([]), //5.1 Ríos, lagunas y lagos
//    typeof (c34) !== 'undefined' ? c34 : ee.FeatureCollection([]), //5.2 Hielo y nieve en superficie
//    typeof (c27) !== 'undefined' ? c27 : ee.FeatureCollection([]), //6. No Observado
//];

//print(samplesList);

// merges all polygons
//var samplesPolygons = ee.List(samplesList).iterate(
//    function (sample, samplesPolygon) {
//        return ee.FeatureCollection(samplesPolygon).merge(sample);
//    },
//    ee.FeatureCollection([])
//);

// filter by user defined region "userRegion" if exists
//samplesPolygons = ee.FeatureCollection(samplesPolygons)
//    .filter(ee.Filter.bounds(region));

// avoid geodesic operation error
//samplesPolygons = samplesPolygons.map(
//    function (polygon) {
//        return polygon.buffer(1, 10);
//    }
//);
//
//var classValues = complementary.map(
//    function (array) {
//        return array[0];
//    }
//);
//
//var classPoints = complementary.map(
//    function (array) {
//        return array[1];
//    }
//);
//
//// generate training points
//var aditionalTrainingPoints = generateAditionalPoints(samplesPolygons, classValues, classPoints);
//
//// generate validation points
//var aditionalValidationPoints = generateAditionalPoints(samplesPolygons, classValues, classPoints);
//
//print('trainingPoints', aditionalTrainingPoints.aggregate_histogram('class'));
//print('validationPoints', aditionalValidationPoints.aggregate_histogram('class'));
//
//// set sample type
//aditionalTrainingPoints = aditionalTrainingPoints.map(
//    function (sample) {
//        return sample.set('sample_type', 'training');
//    }
//);
//
//aditionalValidationPoints = aditionalValidationPoints.map(
//    function (sample) {
//        return sample.set('sample_type', 'validation');
//    }
//);

// merge training and validation points
//var aditionalSamplesPoints = aditionalTrainingPoints.merge(aditionalValidationPoints);

// visualize points using mapbiomas color palette
//var samplesPointsVis = aditionalSamplesPoints.map(
//    function (feature) {
//        return feature.set('style', {
//            'color': ee.List(mapbiomasPalette).get(feature.get('class')),
//            'width': 1,
//        });
//    }
//);
//

var terrain = ee.Image("JAXA/ALOS/AW3D30_V1_1").select("AVE");
var slope = ee.Terrain.slope(terrain);

var classifiedList = [];



years.forEach(
    function (year) {

        var mosaicYear = mosaics
            .filter(ee.Filter.eq('year', year))
            .filter(ee.Filter.bounds(region))
            .mosaic()
            .addBands(slope);

        mosaicYear = mosaicYear.select(featureSpace);

        var trainedSamples = ee.FeatureCollection(
            assetSamples + '/samples-points-regionID-' + regionId.toString() + '-' + year.toString() + '-v' + version.samples);

        // shuffle the points
        var shuffledSamples = shuffle(trainedSamples, 2);

        var weightedSamples = classWeights.map(
            function (classWeight) {
                var classId = classWeight[0];
                var weight = classWeight[1];

                var nSamples = Math.max(Math.round(nSamplesAllowed.max * weight), nSamplesAllowed.min);

                return shuffledSamples.filter(ee.Filter.eq('class', classId))
                    .limit(nSamples);
            }
        );

        var weightedSamples = ee.FeatureCollection(weightedSamples).flatten();

        //print(weightedSamples.aggregate_histogram('class'));

        // No aplica
        // Collect the spectral information to get the trained samples
        //var additionalTrainedSamples = mosaicYear.reduceRegions({
        //    'collection': aditionalTrainingPoints,
        //    'reducer': ee.Reducer.first(),
        //    'scale': 30,
        //    'tileScale': 4
        //});
//
        //additionalTrainedSamples = additionalTrainedSamples.filter(ee.Filter.notNull(['green_median_texture']));
//
        //// merge stable and additional training samples
        var allTrainedSamples = weightedSamples//.merge(additionalTrainedSamples); ojo acá si hay complementarias

        var numberOfClassRemaining = ee.Number(weightedSamples.aggregate_count_distinct('class'));

        var classifier = ee.Classifier.smileRandomForest(rfParams)
            .train(allTrainedSamples, 'class', featureSpace);

        var classified = ee.Algorithms.If(
            allTrainedSamples.size().gt(0),
            ee.Algorithms.If(
                numberOfClassRemaining.gt(1),
                mosaicYear.classify(classifier),
                ee.Image(0)
            ),
            ee.Image(0)
        );

        classified = ee.Image(classified).rename('classification_' + year.toString());

        classifiedList.push(classified);

        Map.addLayer(mosaicYear, visMos, year + ' R' + regionId.toString() + ' ' + 'rgb', false);
        Map.addLayer(classified, visClass, year + ' R' + regionId.toString() + ' ' + 'class', false);

        // visualize points using mapbiomas color palette
        var samplesPointsVis = weightedSamples.map(
            function (feature) {
                return feature.set('style', {
                    'color': ee.List(mapbiomasPalette).get(feature.get('class')),
                    'width': 1,
                });
            }
        );

        Map.addLayer(samplesPointsVis.style({ 'styleProperty': 'style' }), {}, 'weighted samples - ' + year.toString(), false);
        
        // Export points to asset
        //var pointsName = 'samples-points-' + regionId.toString() + '-' + year.toString() + '-aditional-' + version.aditional_samples;

        /*Export.table.toAsset({
            "collection": allTrainedSamples,
            "description": pointsName,
            "assetId": assetSamples + '/' + pointsName
        });*/
    }
);

Map.addLayer(selectedRegion.style({color:'black',fillColor:'FF000000'}), {}, 'Zona ' + regionId.toString(), false);
Map.setOptions('SATELLITE');

var classifiedStack = ee.Image(classifiedList);

classifiedStack = classifiedStack
    .set('collection_id', 1.0)
    .set('version', version.classification)
    .set('territory', 'CUYO');

Export.image.toAsset({
    "image": classifiedStack,
    "description": 'CUYO-REGION-' + regionId + '-' + version.classification,
    "assetId": assetClass + '/CUYO-REGION-' + regionId + '-' + version.classification,
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": region
}); 




///////////////////////////////////
// Diccionario con clases, nombres y colores
var legendItems = [
  {code: 3,  name: 'Bosques cerrados'},
  {code: 4,  name: 'Bosques abiertos'},
  {code: 66, name: 'Arbustales cerrados'},
  {code: 77, name: 'Arbustales abiertos'},
  {code: 45, name: 'Arbustales dispersos'},
  {code: 12, name: 'Pastizales'},
  {code: 11, name: 'Herbacéas inundables'},
  {code: 9,  name: 'Leñosas cultivadas'},
  {code: 21, name: 'Mosaico de Usos'},
  {code: 25, name: 'Áreas sin vegetación'},
  {code: 33, name: 'Ríos, lagunas y lagos'},
  {code: 34, name: 'Hielo y nieve en superficie'}
];

// Crear el panel de leyenda
var legendPanel = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '6px 10px',
    backgroundColor: 'rgba(255,255,255,0.8)'
  }
});

// Título de la leyenda
legendPanel.add(ui.Label({
  value: 'Leyenda',
  style: {
    fontWeight: 'bold',
    fontSize: '12px',
    margin: '0 0 4px 0'
  }
}));

// Agregar cada entrada a la leyenda
legendItems.forEach(function(item) {
  var color = mapbiomasPalette[item.code];
  var entry = ui.Panel({
    layout: ui.Panel.Layout.Flow('horizontal'),
    style: {margin: '0 0 2px 0'}
  });

  var colorBox = ui.Label('', {
    backgroundColor: color,
    padding: '6px',
    margin: '0 6px 0 0'
  });

  var labelText = item.name + ' (' + item.code + ')';
  var description = ui.Label(labelText, {
    fontSize: '11px',
    margin: '2px 0'
  });

  entry.add(colorBox).add(description);
  legendPanel.add(entry);
});

// Agregar la leyenda al mapa
Map.add(legendPanel);