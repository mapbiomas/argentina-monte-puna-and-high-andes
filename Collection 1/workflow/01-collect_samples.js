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
    OtrasSinVegetacion = /* color: #0000ff */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Point([-61.64154800716, -42.06288136098127]),
            {
              "class": 25,
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
            })]);



//1. Vegetación natural leñosa
//3	1.1 Leñosas cerradas
//4	1.2 Leñosas abiertas
//45	1.3 Leñosas dispersas

//2. Vegetación natural no leñosa
//12	2.1 Herbáceas
//11	2.2 Vegetación natural no leñosa inudable

//3. Áreas agropecuarias
//9	3.3 Leñosas cultivadas 

//21	3.4. Mosaico de Usos 

//22	4. Áreas no vegetadas
//24	4.1 Áreas urbanas
//61	4.2 Salares
//25	4.3 Otras áreas sin vegetación

//5	5. Cuerpos de agua
//33	5.1 Ríos, lagunas y lagos
//34	5.2 Hielo y nieve en superficie

//27	6. No Observado//
// save the script with the name of the grid_name in the FOLDER of your institution
//
//
var assetMosaics = 'projects/nexgenmap/MapBiomas2/LANDSAT/ARGENTINA/mosaics-1';

//
var assetRegions = 'projects/mapbiomas-argentina/assets/ANCILLARY_DATA/VECTOR/CUYO/Cuyo_regiones';

// Classes that will be exported
var assetSamples = 'projects/mapbiomas-argentina/assets/COLLECTION1/SAMPLES/CUYO';

// Define a region id (1... 11)
var regionId = 3;

var nTrainingPoints = 2000   // Number of points to training
var nValidationPoints = 500   // Number of points to validate



// Landsat images that will be added to Layers
var years = [
    1985, 1986, 1987, 1988, 1989, 1990,
    1991, 1992, 1993, 1994, 1995,
    1996, 1997, 1998, 1999, 
    2000,
    2001, 2002, 2003, 2004, 2005,
    2006, 2007, 2008, 2009, 2010,
    2011, 2012, 
    2013, 2014, 2015,
    2016, 2017, 2018, 2019, 2020,
    2021, 2022
];

// Version that will be saved
var versionOutput = 1;

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

var visClass = {
    'min': 0,
    'max': 49,
    'palette': mapbiomasPalette
};

var visMos = {
    'bands': [
        'nir_median',
        'swir1_median',
        //'nir_median',
        'red_median'
    ],
    'gain': [0.06, 0.08, 0.1],
    'gamma': 1.15
};

var palettes = require('users/mapbiomas/modules:Palettes.js');

var mosaics = ee.ImageCollection(assetMosaics);
var regions = ee.FeatureCollection(assetRegions);
//print("mosaics",mosaics)
//print("regions",regions)

var selectedRegion = regions.filter(ee.Filter.eq('Id', regionId));

var mapbiomasPalette = palettes.get('classification6');

/**
 * List of feature collection you must should for sample collection
 */
var region = typeof (userRegion) !== 'undefined' ? userRegion : selectedRegion;


var samplesList = [
    typeof (LeniosasCerradas) !== 'undefined' ? LeniosasCerradas : ee.FeatureCollection([]), //1.1 Leñosas cerradas
    typeof (LeniosasAbiertas) !== 'undefined' ? LeniosasAbiertas : ee.FeatureCollection([]), //1.2 Leñosas abiertas
    typeof (LeniosasDispersas) !== 'undefined' ? LeniosasDispersas : ee.FeatureCollection([]), //1.3 Leñosas dispersas
    typeof (Herbaceas) !== 'undefined' ? Herbaceas : ee.FeatureCollection([]), //2.1 Herbáceas
    typeof (HerbaceasInundables) !== 'undefined' ? HerbaceasInundables : ee.FeatureCollection([]), //2.2 Vegetación natural no leñosa inudable
    typeof (LeniosasCultivadas) !== 'undefined' ? LeniosasCultivadas : ee.FeatureCollection([]), //3.3 Leñosas cultivadas
    typeof (MosaicoUsos) !== 'undefined' ? MosaicoUsos : ee.FeatureCollection([]), //3.4. Mosaico de Usos
//    typeof (Urbano) !== 'undefined' ? Urbano : ee.FeatureCollection([]), //4.1 Áreas urbanas
//    typeof (Salares) !== 'undefined' ? Salares : ee.FeatureCollection([]), //4.2 Salares
    typeof (OtrasSinVegetacion) !== 'undefined' ? OtrasSinVegetacion : ee.FeatureCollection([]), //4.3 Otras áreas sin vegetación
    typeof (CuerposAgua) !== 'undefined' ? CuerposAgua : ee.FeatureCollection([]), //5.1 Ríos, lagunas y lagos
    typeof (HieloNieve) !== 'undefined' ? HieloNieve : ee.FeatureCollection([]), //5.2 Hielo y nieve en superficie
    typeof (NoObservado) !== 'undefined' ? NoObservado : ee.FeatureCollection([]), //6. No Observado
];

print(samplesList);
//------------------------------------------------------------------
// User defined functions
//------------------------------------------------------------------

/**
 * Create a function to collect random point inside the polygons
 * @param {*} polygons 
 * @param {*} nPoints 
 * @returns 
 */
var generatePoints = function (polygons, nPoints) {

    // convert polygons to raster
    var polygonsRaster = ee.Image().paint({
        featureCollection: polygons,
        color: 'class'
    }).rename('class');

    // Generate N random points inside the polygons
    var points = polygonsRaster.stratifiedSample({
        'numPoints': nPoints,
        'classBand': 'class',
        'region': polygons,
        'scale': 30,
        'seed': 1,
        'dropNulls': true,
        'geometries': true
    });

    return points;
};
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

// generate training points
var trainingPoints = generatePoints(samplesPolygons, nTrainingPoints);

// generate validation points
var validationPoints = generatePoints(samplesPolygons, nValidationPoints);

print('trainingPoints', trainingPoints.aggregate_histogram('class'));
print('validationPoints', validationPoints.aggregate_histogram('class'));

// set sample type
trainingPoints = trainingPoints.map(
    function (sample) {
        return sample.set('sample_type', 'training');
    }
);

validationPoints = validationPoints.map(
    function (sample) {
        return sample.set('sample_type', 'validation');
    }
);

// merge training and validation points
var samplesPoints = trainingPoints.merge(validationPoints);

// visualize points using mapbiomas color palette
var samplesPointsVis = samplesPoints.map(
    function (feature) {
        return feature.set('style', {
            'color': ee.List(mapbiomasPalette).get(feature.get('class')),
            'width': 1,
        });
    }
);

var terrain = ee.Image("JAXA/ALOS/AW3D30_V1_1").select("AVE");
var slope = ee.Terrain.slope(terrain);

// Add mosaic for each year
years.forEach(
    function (year) {
        var mosaicYear = mosaics
            .filter(ee.Filter.eq('year', year))
            .filter(ee.Filter.bounds(region))
            .mosaic()
            .addBands(slope);

        mosaicYear = mosaicYear.select(featureSpace);

        Map.addLayer(mosaicYear, visMos, year.toString() + ' region ' + regionId.toString(), false);

        // Collect the spectral information to get the trained samples
        var trainedSamples = mosaicYear.reduceRegions({
            'collection': samplesPoints,
            'reducer': ee.Reducer.first(),
            'scale': 30,
        });

        trainedSamples = trainedSamples.filter(ee.Filter.notNull(['green_median_texture']));

        // Export points to asset
        var pointsName = 'samples-points-regionID-' + regionId.toString() + '-' + year.toString() + '-v' + versionOutput;

        Export.table.toAsset({
            "collection": trainedSamples,
            "description": pointsName,
            "assetId": assetSamples + '/' + pointsName
        });

    }
);

Map.addLayer(selectedRegion.geometry().bounds().symmetricDifference(selectedRegion.geometry(), ee.ErrorMargin(1)), {}, 'region ' + regionId.toString(), true);
Map.centerObject(selectedRegion, 7).setOptions("SATELLITE")


Map.addLayer(samplesPointsVis.style({ 'styleProperty': 'style' }), {}, 'samples - points');

// Export polygons to asset
var polygonsName = 'samples-polygons-regionID-' + regionId.toString() + '-v' + versionOutput;

/*Export.table.toAsset({
    "collection": samplesPolygons,
    "description": polygonsName,
    "assetId": assetSamples + '/' + polygonsName
});*/




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