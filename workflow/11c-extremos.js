Map.setOptions("HYBRID");

var regions = ee.FeatureCollection('projects/mapbiomas-argentina/assets/ANCILLARY_DATA/VECTOR/CUYO/Cuyo_regiones')

var palettes = require('users/mapbiomas/modules:Palettes.js');
var mapbiomasPalette = palettes.get('classification7');

print(mapbiomasPalette)

//
var visClass = {
    'min': 0,
    'max': 62,
    'palette': mapbiomasPalette,
    'format': 'png'
};


//Carga la clasificación de entrada
var Filter_5years = ee.Image('projects/mapbiomas-argentina/assets/COLLECTION1/CLASSIFICATION/FINAL_CLASSIFICATION/CUYO/CUYO-FINAL-3-1Sp-Tf3y4y5y-1y2Ext')


// the first number will have priority
var ordem_exec_first = [3,4,45,12,11,9,21,25,27]; //[3, 33, 21, 13, 25];[3,67,12,11,63,21,9,22,27,34]
var ordem_exec_last = [3,4,45,12,11,9,21,25,27]; //[21];
//var ordem_exec_middle = [33,3, 11,12,15, 19, 22]

var filtered = Filter_5years 

var mask3first = function(valor, imagem){
  var mask = imagem.select('classification_1985').neq (valor)
        .and(imagem.select('classification_1986').eq(valor))
        .and(imagem.select('classification_1987').eq (valor))
  var muda_img = imagem.select('classification_1985').mask(mask.eq(1)).where(mask.eq(1), valor);  
  var img_out = imagem.select('classification_1985').blend(muda_img)
  img_out = img_out.addBands([imagem.select('classification_1986'),
                              imagem.select('classification_1987'), 
                              imagem.select('classification_1988'),
                              imagem.select('classification_1989'),
                              imagem.select('classification_1990'),
                              imagem.select('classification_1991'),
                              imagem.select('classification_1992'),
                              imagem.select('classification_1993'),
                              imagem.select('classification_1994'),
                              imagem.select('classification_1995'),
                              imagem.select('classification_1996'),
                              imagem.select('classification_1997'),
                              imagem.select('classification_1998'),
                              imagem.select('classification_1999'),
                              imagem.select('classification_2000'),
                              imagem.select('classification_2001'),
                              imagem.select('classification_2002'),
                              imagem.select('classification_2003'),
                              imagem.select('classification_2004'),
                              imagem.select('classification_2005'),
                              imagem.select('classification_2006'),
                              imagem.select('classification_2007'),
                              imagem.select('classification_2008'),
                              imagem.select('classification_2009'),
                              imagem.select('classification_2010'),
                              imagem.select('classification_2011'),
                              imagem.select('classification_2012'),
                              imagem.select('classification_2013'),
                              imagem.select('classification_2014'),
                              imagem.select('classification_2015'),
                              imagem.select('classification_2016'),
                              imagem.select('classification_2017'),
                              imagem.select('classification_2018'),
                              imagem.select('classification_2019'),
                              imagem.select('classification_2020'),
                              imagem.select('classification_2021'),
                              imagem.select('classification_2022')])
  return img_out;
}

//var mask3last = function(valor, imagem){
//  var mask = imagem.select('classification_2020').eq (valor)
//        .and(imagem.select('classification_2021').eq(valor))
//        .and(imagem.select('classification_2022').neq (valor))
//  var muda_img = imagem.select('classification_2022').mask(mask.eq(1)).where(mask.eq(1), valor);  
//  var img_out = imagem.select('classification_1998')
//  img_out = img_out.addBands([imagem.select('classification_1998'),
//                              imagem.select('classification_1999'),
//                              imagem.select('classification_2000'),
//                              imagem.select('classification_2001'),
//                              imagem.select('classification_2002'),
//                              imagem.select('classification_2003'),
//                              imagem.select('classification_2004'),
//                              imagem.select('classification_2005'),
//                              imagem.select('classification_2006'),
//                              imagem.select('classification_2007'),
//                              imagem.select('classification_2008'),
//                              imagem.select('classification_2009'),
//                              imagem.select('classification_2010'),
//                              imagem.select('classification_2011'),
//                              imagem.select('classification_2012'),
//                              imagem.select('classification_2013'),
//                              imagem.select('classification_2014'),
//                              imagem.select('classification_2015'),
//                              imagem.select('classification_2016'),
//                              imagem.select('classification_2017'),
//                              imagem.select('classification_2018'),
//                              imagem.select('classification_2019'),
//                              imagem.select('classification_2020'),
//                              imagem.select('classification_2021')])
//  var img_out = img_out.addBands(imagem.select('classification_2022').blend(muda_img))
//  return img_out;
//}

for (var i_class=0;i_class<ordem_exec_first.length; i_class++){  
   var id_class = ordem_exec_first[i_class]; 
   filtered = mask3first(id_class, filtered)
}

//for (var i_class=0;i_class<ordem_exec_last.length; i_class++){  
//   var id_class = ordem_exec_last[i_class]; 
//   filtered = mask3last(id_class, filtered)
//}

// for (var i_class=0;i_class<ordem_exec_middle.length; i_class++){  
//   var id_class = ordem_exec_middle[i_class]; 
//   filtered = window5years(filtered, id_class)
//   filtered = window4years(filtered, id_class)
//   filtered = window3years(filtered, id_class)
// }

print(filtered, 'filtered')


Map.addLayer(Filter_5years.select('classification_1985'), visClass, 'Filter_5years', true);
Map.addLayer(filtered.select('classification_1985'), visClass, 'class_final', true);

Map.addLayer(Filter_5years, null, 'Filter_5years_', true);
Map.addLayer(filtered, null, 'class_final_', true);


var assetClass = 'projects/mapbiomas-argentina/assets/COLLECTION1/CLASSIFICATION/FINAL_CLASSIFICATION/CUYO/';

Export.image.toAsset({
    "image": filtered,
    "description": 'CUYO-FINAL-3-1Sp-Tf3y4y5y-1y2y3Ext' ,
    "assetId": assetClass + 'CUYO-FINAL-3-1Sp-Tf3y4y5y-1y2y3Ext' ,
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": regions
}); 



