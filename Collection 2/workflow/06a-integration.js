var geometry = 
    /* color: #d63000 */
    /* shown: false */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[-66.56099906348487, -25.605319028631047],
          [-66.56099906348487, -25.62962061726622],
          [-66.52580848120948, -25.62962061726622],
          [-66.52580848120948, -25.605319028631047]]], null, false);
 // Cargar región
var assetRegions = 'projects/mapbiomas-argentina/assets/ANCILLARY_DATA/VECTOR/CUYO/regional-assets_cuyo-argcol2_buffer2km_reg';
var regions = ee.FeatureCollection(assetRegions);

// Cargar imágenes
var assetClass = 'projects/mapbiomas-argentina/assets/LAND-COVER/COLLECTION-2/GENERAL/CLASSIFICATION/COMPLEMENT_CLASSIFICATION/CUYO';
var R15 = ee.Image('projects/mapbiomas-argentina/assets/LAND-COVER/COLLECTION-2/GENERAL/CLASSIFICATION/COMPLEMENT_CLASSIFICATION/CUYO/CUYO-REGION-15-2');
var R68 = ee.Image('projects/mapbiomas-argentina/assets/LAND-COVER/COLLECTION-2/GENERAL/CLASSIFICATION/COMPLEMENT_CLASSIFICATION/CUYO/CUYO-REGION-68-2');
var R911 = ee.Image('projects/mapbiomas-argentina/assets/LAND-COVER/COLLECTION-2/GENERAL/CLASSIFICATION/COMPLEMENT_CLASSIFICATION/CUYO/CUYO-REGION-911-2');

// Crear geometrías disueltas con buffer de 100m
var geom15 = regions.filter(ee.Filter.eq('Id2', 15)).geometry().buffer(100);
var geom68 = regions.filter(ee.Filter.eq('Id2', 68)).geometry().buffer(100);
var geom911 = regions.filter(ee.Filter.eq('Id2', 911)).geometry().buffer(100);

// Enmascarar y recortar cada imagen con su región disuelta + buffer
var R15_masked = R15.updateMask(R15.mask()).clip(geom15);
var R68_masked = R68.updateMask(R68.mask()).clip(geom68);
var R911_masked = R911.updateMask(R911.mask()).clip(geom911);

// Crear mosaico con prioridad local
var mosaic = ee.ImageCollection([R15_masked, R68_masked, R911_masked]).min()
  // .blend(R68_masked)
  // .blend(R911_masked);

// Visualización
//
var palettes = require('users/mapbiomas/modules:Palettes.js').get('classification9')
.concat(["#000000","#000000","#000000","#000000","#000000","#000000","#000000","#a2c830"]);

var mapbiomasPalette = palettes;

var visClass = {
    'min': 0,
    'max': 77,
    'palette': mapbiomasPalette,
    'format': 'png'
};

//Map.centerObject(regions);
Map.addLayer(ee.Image(mosaic), null, 'Mosaico con prioridad local (dissolve + buffer 100m)', false);
Map.addLayer(ee.Image(mosaic).select('classification_2024'), visClass, 'Mosaico con prioridad local (dissolve + buffer 100m)');


Export.image.toAsset({
    "image": mosaic,
    "description": 'CUYO-INTEGRADO-1',
    "assetId": assetClass + '/CUYO-INTEGRADO-1',
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": regions
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
