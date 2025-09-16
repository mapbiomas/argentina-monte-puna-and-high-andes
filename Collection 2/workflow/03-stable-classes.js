// define a region id 
var regionId = 1;
var versionclas = 1

//
//
var assetRegions = 'projects/mapbiomas-argentina/assets/ANCILLARY_DATA/VECTOR/CUYO/regional-assets_cuyo-argcol2_buffer2km_reg';

var assetStable = 'projects/mapbiomas-argentina/assets/LAND-COVER/COLLECTION-2/GENERAL/CLASSIFICATION/STABLEMAP/CUYO';

var assetClass = 'projects/mapbiomas-argentina/assets/LAND-COVER/COLLECTION-2/GENERAL/CLASSIFICATION/PRECLASSIFICATION/CUYO/CUYO-REGION-' + regionId + '-' + versionclas;

var version = {
    'classification': '1',
    'output_stable_map': '1'
};

//
var regions = ee.FeatureCollection(assetRegions);

var selectedRegion = regions.filter(ee.Filter.eq('Id', regionId));

var region = typeof (userRegion) !== 'undefined' ? userRegion : selectedRegion;

var mapbiomasPalette = require('users/mapbiomas/modules:Palettes.js').get('classification9')
.concat(["#000000","#000000","#000000","#000000","#000000","#000000","#000000","#a2c830"])

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

//
var visSerie = {"opacity":1,"bands":["classification_2022"],"min":0,"max":77,"palette":mapbiomasPalette};


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
                        .reduce(ee.Reducer.sum()).gte(34))
.selfMask(); 
// filtrar por frecuencia... tiene que ser mayor a 85% (por lo menos 34 de los 40 años)

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
