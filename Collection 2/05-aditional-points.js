var BosquesCerrados = /* color: #1f8d49 */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Point([-62.12494644466, -42.469389034043225]),
            {
              "class": 3,
              "system:index": "0"
            })]),
    BosquesAbiertos = /* color: #7dc975 */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Point([-61.86127456966, -42.29084860621225]),
            {
              "class": 4,
              "system:index": "0"
            })]),
    ArbustalesCerrados = /* color: #91ff36 */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Point([-62.12494644466, -42.469389034043225]),
            {
              "class": 66,
              "system:index": "0"
            })]),
    ArbustalesAbiertos = /* color: #a2c830 */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Point([-61.64154800716, -42.48559480565056]),
            {
              "class": 77,
              "system:index": "0"
            })]),
    ArbustalesDispersos = /* color: #e04cfa */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Point([-61.86127456966, -42.32334826023925]),
            {
              "class": 45,
              "system:index": "0"
            })]),
    Pastizales = /* color: #d6bc74 */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Point([-61.72943863216, -42.25833217467175]),
            {
              "class": 12,
              "system:index": "0"
            })]),
    HerbaceasInundables = /* color: #519799 */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Point([-61.81732925716, -42.160682233252544]),
            {
              "class": 11,
              "system:index": "0"
            })]),
    LeniosasCultivadas = /* color: #7a6c00 */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Point([-61.86127456966, -42.29084860621225]),
            {
              "class": 9,
              "system:index": "0"
            })]),
    MosaicoUsos = /* color: #ffefc3 */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Point([-61.77338394466, -42.12809871005434]),
            {
              "class": 21,
              "system:index": "0"
            })]),
    OtrasSinVegetacion = /* color: #db4d4f */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Point([-61.64154800716, -42.06288136098127]),
            {
              "class": 25,
              "system:index": "0"
            })]),
    CuerposAgua = /* color: #2532e4 */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Point([-62.25678238216, -42.32334826023925]),
            {
              "class": 33,
              "system:index": "0"
            })]),
    HieloNieve = /* color: #93dfe6 */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Point([-61.81732925716, -42.160682233252544]),
            {
              "class": 34,
              "system:index": "0"
            })]);

//Genera v1 de Complement_Classification usando la v1 de las random stable samples, sin muestras complementarias

 

//3   | Bosques cerrados             | #1f8d49  
//4   | Bosques abiertos             | #7dc975  
//9   | Leñosas cultivadas           | #7a6c00  
//11  | Herbacéas inundables         | #519799  
//12  | Pastizales                   | #d6bc74  
//21  | Mosaico de Usos              | #ffefc3  
//25  | Áreas sin vegetación         | #db4d4f  
//33  | Ríos, lagunas y lagos        | #2532e4  
//34  | Hielo y nieve en superficie  | #93dfe6  
//45  | Arbustales dispersos         | #e04cfa  
//66  | Arbustales cerrados          | #91ff36  
//77  | Arbustales abiertos          | #a2c830 

//
var assetMosaics = 'projects/nexgenmap/MapBiomas2/LANDSAT/ARGENTINA/mosaics-1';

var assetRegions = 'projects/mapbiomas-argentina/assets/ANCILLARY_DATA/VECTOR/CUYO/regional-assets_cuyo-argcol2_buffer2km_reg';

var assetStableSamples = 'projects/mapbiomas-argentina/assets/LAND-COVER/COLLECTION-2/GENERAL/SAMPLES/RANDOM_STABLE/CUYO';

var assetAdditionalSamples = 'projects/mapbiomas-argentina/assets/LAND-COVER/COLLECTION-2/GENERAL/SAMPLES/COMPLEMENT/CUYO';

var assetClass = 'projects/mapbiomas-argentina/assets/LAND-COVER/COLLECTION-2/GENERAL/CLASSIFICATION/COMPLEMENT_CLASSIFICATION/CUYO';

// define a region id
var regionId = 1;

//OJO CON ESTO Y LAS VERSIONES DE LAS SAMPLES
var version = {
    'classification': '1',
    'stable_map': '1',
    'stable_samples': '1',
    'output': '1',
};

var assetStable = 'projects/mapbiomas-argentina/assets/LAND-COVER/COLLECTION-2/GENERAL/CLASSIFICATION/STABLEMAP/CUYO/'
    + 'CUYO-STABLE-REGION-'
    + regionId.toString()
    + '-'
    + version.stable_map;
    
    
var clasif = 'projects/mapbiomas-argentina/assets/LAND-COVER/COLLECTION-2/GENERAL/CLASSIFICATION/COMPLEMENT_CLASSIFICATION/CUYO/'
    + 'CUYO-REGION-'
    + regionId.toString()
    + '-'
    + version.stable_map;
    
    
var nTrainingPoints = 2000;   // Number of points to training
var nValidationPoints = 500;   // Number of points to validate


//EDITAR
// number of complementary points
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
    2020, 2021, 2022, 2023, 2024
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
var palettes = require('users/mapbiomas/modules:Palettes.js').get('classification9')
.concat(["#000000","#000000","#000000","#000000","#000000","#000000","#000000","#a2c830"]);

var mosaics = ee.ImageCollection(assetMosaics);
var regions = ee.FeatureCollection(assetRegions);

var selectedRegion = regions.filter(ee.Filter.eq('Id', regionId));

var region = typeof (userRegion) !== 'undefined' ? userRegion : selectedRegion;

var mapbiomasPalette = palettes;

//
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

//
var samplesList = [
      typeof (BosquesCerrados            ) !== 'undefined'   ? BosquesCerrados     : ee.FeatureCollection([]), //3   | Bosques cerrados           
      typeof (BosquesAbiertos            ) !== 'undefined'   ? BosquesAbiertos     : ee.FeatureCollection([]), //4   | Bosques abiertos           
      typeof (LeniosasCultivadas           ) !== 'undefined' ? LeniosasCultivadas  : ee.FeatureCollection([]), //9   | Leñosas cultivadas         
      typeof (HerbaceasInundables         ) !== 'undefined'  ? HerbaceasInundables : ee.FeatureCollection([]), //11  | Herbacéas inundables       
      typeof (Pastizales                   ) !== 'undefined' ? Pastizales          : ee.FeatureCollection([]), //12  | Pastizales                 
      typeof (MosaicoUsos              ) !== 'undefined'     ? MosaicoUsos         : ee.FeatureCollection([]), //21  | Mosaico de Usos            
      typeof (OtrasSinVegetacion         ) !== 'undefined'   ? OtrasSinVegetacion  : ee.FeatureCollection([]), //25  | Áreas sin vegetación       
      typeof (CuerposAgua              ) !== 'undefined'     ? CuerposAgua         : ee.FeatureCollection([]), //33  | Ríos, lagunas y lagos      
      typeof (HieloNieve               ) !== 'undefined'     ? HieloNieve          : ee.FeatureCollection([]), //34  | Hielo y nieve en superficie
      typeof (ArbustalesDispersos         ) !== 'undefined'  ? ArbustalesDispersos : ee.FeatureCollection([]), //45  | Arbustales dispersos       
      typeof (ArbustalesCerrados          ) !== 'undefined'  ? ArbustalesCerrados  : ee.FeatureCollection([]), //66  | Arbustales cerrados        
      typeof (ArbustalesAbiertos          ) !== 'undefined'  ? ArbustalesAbiertos  : ee.FeatureCollection([]), //77  | Arbustales abiertos        

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

        //print('stablePoints', stableSamplesPoints.aggregate_histogram('class'));

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

          //Map.addLayer(ee.Image(clasif).select('classification_' + year).clip(regions.filter(ee.Filter.eq('Id', regionId))), visClass, year.toString() + ' ' + regionId.toString() + 'class anterior', false);
      
          Map.addLayer(classified.clip(regions.filter(ee.Filter.eq('Id', regionId))), visClass, year.toString() + ' ' + regionId.toString() + ' class actual', false);
      
      //  Map.addLayer(stableSamplesPointsVis.style({ 'styleProperty': 'style' }), {}, year.toString() + ' ' + regionId.toString() + ' stable sample points', false);

        // Export points to asset
        var pointsName = 'samples-stable-additional-' + year.toString() + '-' + regionId.toString() + '-' + version.output;

 //       Export.table.toAsset({
 //           "collection": samplesFinal,
 //           "description": 'additional' + pointsName,
 //           "assetId": assetAdditionalSamples + '/' + pointsName
 //       });
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
//Map.addLayer(classification.select('classification_' + year), visClass, 'classification ' + year, true);
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

/////////////////////Panel NDVI
var ts_tools = require("users/hdieguez/MBCuyo:time_series.js");

var panel = ui.Panel({
    style: { 
        //width: '400px',  // Ancho del panel (puedes ajustar según sea necesario)
        //height: '200px', // Alto del panel (ajustado para que sea la mitad del ancho)
        position: 'bottom-right', // Posición en la esquina inferior derecha
        stretch: 'horizontal' // Estira el panel en la dirección horizontal
    }
});

var chk_refresh_plot_flag = ui.Checkbox("Mostrar Firma Fenologica NDVI");

panel.add(chk_refresh_plot_flag);  // Agrega el checkbox al panel


// Función para manejar el clic en el mapa
var get_panel_chart_ts = function() {
    Map.onClick(function(point) {
        var punto = ee.Geometry.Point([point.lon, point.lat]);
        
        // Limpiar el panel antes de agregar un nuevo gráfico
        panel.clear(); 
        panel.add(chk_refresh_plot_flag);  // Reagregar el checkbox

        // Solo agregar la firma fenológica si el checkbox está marcado
        if (chk_refresh_plot_flag.getValue()) {
            panel.add(ts_tools.get_time_serie_plot(punto));
        }
    });
};

// Agregar el panel al mapa
Map.add(panel);

// Llamar a la función para configurar el clic en el mapa
get_panel_chart_ts();
//
//////



/*
var areaZona = selectedRegion.geometry().area().divide(1e4)
print("area zona (ha)", areaZona)

var calculateClassProp_ant = function(feature) {
    var props = ee.Image.pixelArea().divide(1e4).divide(areaZona).rename("prop_area")
    .addBands(ee.Image(clasif).select(36)) 
    .reduceRegion({
      reducer: ee.Reducer.sum().group({
      groupField: 1,
      groupName: 'class',
    }),
    geometry: feature.geometry(),
    scale: 30,
    maxPixels: 1e13
    })
    
    var classProps = ee.List(props.get('groups'))
    var classPropList = classProps.map(function(item) {
      var dict = ee.Dictionary(item)
      var classNumber = ee.Number(dict.get('class')).format()
      var areaProp = ee.Number(
        dict.get('sum'))
      return ee.List([classNumber, areaProp])
    })
 
    var result = ee.Dictionary(classPropList.flatten())
    
    var Zona = feature.get('Id')
    return ee.Feature(
      feature.geometry(),
      result.set('Id', Zona))
}
 
var class_anterior_prop = selectedRegion.map(calculateClassProp_ant).first();

print("proporcion de area por clase anterior (ref. 2022)", class_anterior_prop)

var calculateClassProp_act = function(feature) {
    var props = ee.Image.pixelArea().divide(1e4).divide(areaZona).rename("prop_area")
    .addBands(classifiedStack.select(36)) 
    .reduceRegion({
      reducer: ee.Reducer.sum().group({
      groupField: 1,
      groupName: 'class',
    }),
    geometry: feature.geometry(),
    scale: 30,
    maxPixels: 1e13
    })
    
    var classProps = ee.List(props.get('groups'))
    var classPropList = classProps.map(function(item) {
      var dict = ee.Dictionary(item)
      var classNumber = ee.Number(dict.get('class')).format()
      var areaProp = ee.Number(
        dict.get('sum'))
      return ee.List([classNumber, areaProp])
    })
 
    var result = ee.Dictionary(classPropList.flatten())
    
    var Zona = feature.get('Id')
    return ee.Feature(
      feature.geometry(),
      result.set('Id', Zona))
}

var class_actual_prop = selectedRegion.map(calculateClassProp_act).first();

print("proporcion de area por clase actual (ref. 2022)", class_actual_prop)//*/