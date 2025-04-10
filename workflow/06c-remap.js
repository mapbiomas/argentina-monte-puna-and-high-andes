var image = ee.Image("projects/mapbiomas-argentina/assets/COLLECTION1/CLASSIFICATION/COMPLEMENT_CLASSIFICATION/CUYO/CUYO-INTEGRACION-Spatial_Filter-5anios-extremos2-Spatial_Filter-3");
 // Este script tienen todos los poligonos de remapeo
// Toma la clasificación que tienen todos los filtros espaciales y temporales
// Aplica remap para correccion de clases en base a poligonos, y la correccion de sombras por pendiente
// Exporta clasif final v1

var year = 2022


var zonif = ee.FeatureCollection('projects/mapbiomas-argentina/assets/ANCILLARY_DATA/VECTOR/CUYO/Cuyo_regiones')

var DEM = ee.Image("NASA/NASADEM_HGT/001").select("elevation")
var slope =  ee.Terrain.slope(DEM).clip(zonif).rename("slope")
//Map.addLayer(slope)

var palettes = require('users/mapbiomas/modules:Palettes.js');
var mapbiomasPalette = palettes.get('classification7');

//
var visClass = {
    'min': 0,
    'max': 62,
    'palette': mapbiomasPalette,
    'format': 'png'
};




//MosaicoToHerbaceas
// Cambia los pixeles con valor 21 dentro de la geometría a 12 en todas las bandas
var mask = image.eq(21).clip(MosaicoToHerbaceas);
var correccion = image.where(mask, 12);
var imagen_corregida = image.blend(correccion);

////HumedalToMosaico
////// Cambia los pixeles con valor 11 dentro de la geometría a 21 en todas las bandas
var mask = imagen_corregida.eq(11).clip(HumedalToMosaico);
var correccion = imagen_corregida.where(mask, 21);
var imagen_corregida = imagen_corregida.blend(correccion);

//HumedalToLeniosaCultivada
//// Cambia los pixeles con valor 11 dentro de la geometría a 9 en todas las bandas
var mask = imagen_corregida.eq(11).clip(HumedalToLeniosaCult);
var correccion = imagen_corregida.where(mask, 9);
var imagen_corregida = imagen_corregida.blend(correccion);

////LeniosaCultToLeniosaCerr
////// Cambia los pixeles con valor 9 dentro de la geometría a 3 en todas las bandas
var mask = imagen_corregida.eq(9).clip(LeniosaCultToLeniosaCerr);
var correccion = imagen_corregida.where(mask, 3);
var imagen_corregida = imagen_corregida.blend(correccion);

////MosaicoToLeniosaAb
////// Cambia los pixeles con valor 21 dentro de la geometría a 4 en todas las bandas
var mask = imagen_corregida.eq(21).clip(LeniosaCultToLeniosaCerr);
var correccion = imagen_corregida.where(mask, 4);
var imagen_corregida = imagen_corregida.blend(correccion);

////LeniosaCultToMosaico
////// Cambia los pixeles con valor 9 dentro de la geometría a 21 en todas las bandas
var mask = imagen_corregida.eq(9).clip(LeniosaCultToMosaico);
var correccion = imagen_corregida.where(mask, 21);
var imagen_corregida = imagen_corregida.blend(correccion);

////LeniosaCultToMosaico
////// Cambia los pixeles con valor 3 dentro de la geometría a 4 en todas las bandas
var mask = imagen_corregida.eq(3).clip(CerradasToAbiertas);
var correccion = imagen_corregida.where(mask, 4);
var imagen_corregida = imagen_corregida.blend(correccion);

////CerradaToHerbacea
////// Cambia los pixeles con valor 3 dentro de la geometría a 12 en todas las bandas
var mask = imagen_corregida.eq(3).clip(CerradasToHerbaceas);
var correccion = imagen_corregida.where(mask, 12);
var imagen_corregida = imagen_corregida.blend(correccion);

////CerradaToHerbacea
////// Cambia los pixeles con valor 34 dentro de la geometría a 25 en todas las bandas
var mask = imagen_corregida.eq(34).clip(NieveToSD);
var correccion = imagen_corregida.where(mask, 25);
var imagen_corregida = imagen_corregida.blend(correccion);


////HumedalToHerbacea
////// Cambia los pixeles con valor 11 dentro de la geometría a 12 en todas las bandas
var mask = imagen_corregida.eq(11).clip(NieveToSD);
var correccion = imagen_corregida.where(mask, 12);
var imagen_corregida = imagen_corregida.blend(correccion);

////MosaicoToHumedal
////// Cambia los pixeles con valor 21 dentro de la geometría a 12 en todas las bandas
var mask = imagen_corregida.eq(21).clip(MosaicoToHumedal);
var correccion = imagen_corregida.where(mask, 11);
var imagen_corregida = imagen_corregida.blend(correccion);

////HumedalToLeniosaCerr
////// Cambia los pixeles con valor 11 dentro de la geometría a 3 en todas las bandas
var mask = imagen_corregida.eq(11).clip(HumedalToLeniosaCerr);
var correccion = imagen_corregida.where(mask, 3);
var imagen_corregida = imagen_corregida.blend(correccion);

////LeniosaCultToHumedal
////// Cambia los pixeles con valor 9 dentro de la geometría a 11 en todas las bandas
var mask = imagen_corregida.eq(9).clip(LeniosaCultToHumedal);
var correccion = imagen_corregida.where(mask, 11);
var imagen_corregida = imagen_corregida.blend(correccion);

////HerbaceaToDispersas
////// Cambia los pixeles con valor 12 dentro de la geometría a 45 en todas las bandas
var mask = imagen_corregida.eq(12).clip(HerbaceaToDispersas);
var correccion = imagen_corregida.where(mask, 45);
var imagen_corregida = imagen_corregida.blend(correccion);

////HerbaceaToAbiertas
////// Cambia los pixeles con valor 12 dentro de la geometría a 4 en todas las bandas
var mask = imagen_corregida.eq(12).clip(HerbaceaToAbiertas);
var correccion = imagen_corregida.where(mask, 4);
var imagen_corregida = imagen_corregida.blend(correccion);


//AguaToNoObservado (where slope > 10)
var mask = imagen_corregida.eq(33).mask(slope.gt(10)).clip(zonif.filter(ee.Filter.lte('Id', 5)));
var correccion = imagen_corregida.where(mask, 27)
var imagen_corregida = imagen_corregida.blend(correccion);




Map.addLayer(zonif.style({fillColor:"ff000000"}),null, 'regiones')
Map.addLayer(image.select('classification_' + year).clip(zonif), visClass, "original", false)
Map.addLayer(imagen_corregida.select('classification_' + year).clip(zonif), visClass, "corregida", false)
//Map.centerObject(zonif, 5).setOptions("SATELLITE")

Map.addLayer(image.clip(zonif), null, "image", false)
Map.addLayer(imagen_corregida.clip(zonif), null, "imagecorregida", false)



var assetClass = 'projects/mapbiomas-argentina/assets/COLLECTION1/CLASSIFICATION/FINAL_CLASSIFICATION/CUYO/';
Export.image.toAsset({
    "image": imagen_corregida,
    "description": 'CUYO-FINAL-1',
    "assetId": assetClass + 'CUYO-FINAL-1',
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": zonif
}); 



//////////////////////LEYENDA///////////////////////////////  
var colors = [
'1f8d49',//'3  Leñosas cerradas', ok
'7dc975',//'4  Leñosas abiertas', ok
'c8ffb4',//'45 Leñosas dispersas',
'b8af4f',//'12 Herbáceas', ok
'519799',//'11 Vegetación natural no leñosa inudable', ok
'ad4413',//'9  Leñosas cultivadas',
'ffefc3',//'21 Mosaico de Usos', ok
//'d4271e',//'24 Áreas urbanas',
//'faf5de',//'61 Salares',
'ff8585',//'25 Otras áreas sin vegetación',ok
'2532e4',//'33 Ríos, lagunas y lagos', ok
'93dfe6', //34 Hielo y nieve en superficie'
'd5d5e5' // 27 No Observado
]
 
var names = [
'3  Leñosas cerradas',
'4  Leñosas abiertas',
'45 Leñosas dispersas',
'12 Herbáceas',
'11 Vegetación natural no leñosa inudable',
'9  Leñosas cultivadas',
'21 Mosaico de Usos',
//'24 Áreas urbanas',
//'61 Salares',
'25 Otras áreas sin vegetación',
'33 Ríos, lagunas y lagos',
'34 Hielo y nieve en superficie',
'27 No Observado' // 27 No Observado
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
