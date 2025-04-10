 
//
var assetRegions = 'projects/mapbiomas-argentina/assets/ANCILLARY_DATA/VECTOR/CUYO/Cuyo_regiones';

//
var assetStable = 'projects/mapbiomas-argentina/assets/COLLECTION1/CLASSIFICATION/STABLEMAP/CUYO';

// define a region id
var regionId = 3;
var versionclas = 3

//
var assetClass = 'projects/mapbiomas-argentina/assets/COLLECTION1/CLASSIFICATION/PRECLASSIFICATION/CUYO/CUYO-REGION-' + regionId + '-' + versionclas;


//
//var assetClass = 'projects/mapbiomas-argentina/assets/COLLECTION1/CLASSIFICATION/PRECLASSIFICATION/CUYO/CUYO-REGION-' + regionId + '-1';


var version = {
    'classification': '3',
    'output_stable_map': '2'
};

//
var palettes = require('users/mapbiomas/modules:Palettes.js');

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

var visSerie = {"opacity":1,"bands":["classification_2022"],"min":0,"max":67,"palette":['ffffff','32a65e','32a65e','1f8d49','7dc975','04381d','026975','000000','000000','7a6c00','ad975a','519799','d6bc74','d89f5c','ffffb2','edde8e','000000','000000','f5b3c8','c27ba0','db7093','ffefc3','db4d4f','ffa07a','d4271e','db4d4f','0000ff','000000','000000','ffaa5f','9c0027','091077','fc8114','2532e4','93dfe6','9065d0','d082de','000000','000000','f5b3c8','c71585','f54ca9','000000','000000','000000','000000','d68fe2','9932cc','e6ccff','02d659','ad5100','000000','000000','000000','000000','000000','000000','000000','000000','000000','000000','000000','ff69b4','f8d81a','000000','000000','000000','f79c02']};


//------------------------------------------------------------------
// User defined functions
//------------------------------------------------------------------
/**
 * 
 * @param {*} image 
 * @returns 
 */
var calculateNumberOfClasses = function (image) {

    var nClasses = image.reduce(ee.Reducer.countDistinctNonNull());

    return nClasses.rename('number_of_classes');
};

//
//
var classification = ee.Image(assetClass)
    //.filter(ee.Filter.eq('version', version.classification))
    //.filter(ee.Filter.bounds(region))
    //.mosaic()
    .selfMask();

print('classification: ', classification)

// number of classes
var nClasses = calculateNumberOfClasses(classification);

// stable
var stable = classification.select(0).multiply(nClasses.eq(1)).selfMask();

// stable con flexibilidad
var modalClass = classification.reduce(ee.Reducer.mode())
var stable2 = modalClass.multiply(nClasses.lt(5))
.multiply(classification.updateMask(classification.eq(modalClass)).gt(0)
                        .reduce(ee.Reducer.sum()).gte(33))
.selfMask(); 
// filtrar por frecuencia... tiene que ser mayor a 84% (por lo menos 33 de los 37 años)

Map.addLayer(classification, visSerie, 'temporal series', false);
Map.addLayer(stable.clip(selectedRegion), visClass, 'stable', true);
Map.addLayer(stable2.clip(selectedRegion), visClass, 'stableflex', true);



stable = stable2
    .rename('stable')
    .set('collection_id', 1.0)
    .set('version', version.classification)
    .set('region_id', regionId)
    .set('territory', 'CUYO');

var stableName = 'CUYO-STABLE-REGION-' + regionId.toString() + '-' + version.output_stable_map;

Export.image.toAsset({
    "image": stable,
    "description": stableName,
    "assetId": assetStable + '/' + stableName,
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": region
}); 


////////////////////////////////////////////////////////////////////////////////////////////////
// calcular tamaño de muestras de acuerdo a la representatividad de cada clase en la zona 

// print(ui.Chart.image.histogram({
//   image: stable.clip(selectedRegion),
//   region: selectedRegion,
//   scale: 30,
//   minBucketWidth: 1,
//   maxPixels:1e13
// }))

var areaZona = selectedRegion.geometry().area().divide(1e4)
print("area zona (ha)", areaZona)

var areaEstable = stable2.gt(0).multiply(ee.Image.pixelArea().divide(1e4))
.reduceRegion({
  reducer:ee.Reducer.sum(), 
  geometry: selectedRegion,
  scale:30, 
  maxPixels:1e13
})
print("area estable (%)", areaEstable.getNumber("mode").divide(areaZona).multiply(100))

var calculateClassProp = function(feature) {
    var props = ee.Image.pixelArea().divide(1e4).divide(areaZona).rename("prop_area")
    .addBands(classification.select(36)) 
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
 
var class_stable_prop = selectedRegion.map(calculateClassProp).first();

print("proporcion de muestras según representatividad (ref. 2022)", class_stable_prop)

// Ajusta el centro y el nivel de zoom según tu área de interés
Map.centerObject(regions.filter(ee.Filter.eq('Id', regionId)), 7).setOptions("SATELLITE");
Map.addLayer(regions.filter(ee.Filter.eq('Id', regionId)).style({color:'black',fillColor:'FF000000'}), {}, 'Regiones', true);

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

