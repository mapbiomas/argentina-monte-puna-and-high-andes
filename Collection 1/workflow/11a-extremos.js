

Map.setOptions("HYBRID");

var version = {         
    'output': '3',
};



var regions = ee.FeatureCollection('projects/mapbiomas-argentina/assets/ANCILLARY_DATA/VECTOR/CUYO/Cuyo_regiones')

var palettes = require('users/mapbiomas/modules:Palettes.js');
var mapbiomasPalette = palettes.get('classification7');

//
var visClass = {
    'min': 0,
    'max': 62,
    'palette': mapbiomasPalette,
    'format': 'png'
};


//Carga la clasificación con filtro espacial 
//var Filter_5years = ee.Image('projects/mapbiomas-chile/assets/COLLECTION1/integraciones_finales/CHILE-INTEGRACION-Spatial_Filter-5')
var Filter_5years = ee.Image('projects/mapbiomas-argentina/assets/COLLECTION1/CLASSIFICATION/FINAL_CLASSIFICATION/CUYO/CUYO-FINAL-3-1Sp-Tf3y4y5y');



var anos = [
    1985, 1986, 1987, 1988, 1989, 1990,
    1991, 1992, 1993, 1994, 1995,
    1996, 1997, 1998, 1999, 2000,
    2001, 2002, 2003, 2004, 2005,
    2006, 2007, 2008, 2009, 2010,
    2011, 2012, 2013, 2014, 2015,
    2016, 2017, 2018, 2019, 2020,
    2021, 2022
];

//3     Leñosas cerradas
//4     Leñosas abiertas
//45    Leñosas dispersas
//12    Herbáceas
//11    Vegetación natural no leñosa inudable
//9     Leñosas cultivadas
//21    Mosaico de Usos
//25    Otras áreas sin vegetación
//33    Ríos, lagunas y lagos
//34    Hielo y nieve en superficie


for (var i_ano=0;i_ano<anos.length; i_ano++){
  var ano = anos[i_ano];
  
  var class_ano = Filter_5years.select('classification_'+ano)


  var class_nivel0_ano = class_ano.remap([3,4,45,12,11,9,21,25, 33, 34, 27],[1,1,1,1,1,10,10,1,1,1,1]).rename('classification_'+ano)

  if (i_ano == 0){ var class_nivel0 = class_nivel0_ano }  
  else {class_nivel0 = class_nivel0.addBands(class_nivel0_ano); }
}

var nivel0_2022 = class_nivel0.select('classification_2022')
var nivel0_2021 = class_nivel0.select('classification_2021')

// corrige desmatamentos pequenos no último ano
var desmat = nivel0_2022.eq(10).and(nivel0_2021.eq(1))
var conectedDesmat = desmat.selfMask().connectedPixelCount(20,true).reproject('epsg:4326', null, 30);
var desmat1ha = conectedDesmat.lte(11)
var ruido_desmat22 = Filter_5years.select('classification_2021').updateMask(desmat1ha)

// corrige REGEN pequenos no último ano
var regen = nivel0_2022.eq(1).and(nivel0_2021.eq(10))
var conectedRegen = regen.selfMask().connectedPixelCount(25,true).reproject('epsg:4326', null, 30);
var regen1ha = conectedRegen.lte(11)
var ruido_regen22 = Filter_5years.select('classification_2021').updateMask(regen1ha)


var nivel0_1985 = class_nivel0.select('classification_1985')
var nivel0_1986 = class_nivel0.select('classification_1986')

// corrige desmatamentos pequenos no primeiro ano
var desmat = nivel0_1985.eq(1).and(nivel0_1986.eq(10))
var conectedDesmat = desmat.selfMask().connectedPixelCount(30,true).reproject('epsg:4326', null, 30);
var desmat1ha = conectedDesmat.lte(11)
var ruido_desmat85 = Filter_5years.select('classification_1986').updateMask(desmat1ha)


// corrige REGEN pequenos no primeiro ano
var regen = nivel0_1985.eq(10).and(nivel0_1986.eq(1))
var conectedregen = regen.selfMask().connectedPixelCount(30,true).reproject('epsg:4326', null, 30);
var regen1ha = conectedregen.lte(11)
var ruido_regen85 = Filter_5years.select('classification_1986').updateMask(regen1ha)


for (var i_ano=0;i_ano<anos.length; i_ano++){
  var ano = anos[i_ano];
  
  var class_ano = Filter_5years.select('classification_'+ano)

  if (ano == 1985) {  var class_corr = class_ano.blend(ruido_desmat85).blend(ruido_regen85)}
  else if (ano == 2022) {  
    class_corr = class_ano.blend(ruido_desmat22).blend(ruido_regen22)  }
  else {class_corr = class_ano}

  if (i_ano == 0){ var class_final = class_corr}  
  else {class_final = class_final.addBands(class_corr)}

}



Map.addLayer(Filter_5years.select('classification_2022'), visClass, 'Filter_5years', true);
Map.addLayer(class_final.select('classification_2022'), visClass, 'class_final', true);
Map.addLayer(Filter_5years.select('classification_1985'), visClass, 'Filter_5years', true);
Map.addLayer(class_final.select('classification_1985'), visClass, 'class_final', true);
Map.centerObject(regions, 5).setOptions("SATELLITE")

print(class_final, 'classfinal')
print(Filter_5years, 'f5y')


var assetClass = 'projects/mapbiomas-argentina/assets/COLLECTION1/CLASSIFICATION/FINAL_CLASSIFICATION/CUYO/';

Export.image.toAsset({
    "image": class_final,
    "description": 'CUYO-FINAL-3-1Sp-Tf3y4y5y-1Ext' ,
    "assetId": assetClass + 'CUYO-FINAL-3-1Sp-Tf3y4y5y-1Ext' ,
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": regions
});