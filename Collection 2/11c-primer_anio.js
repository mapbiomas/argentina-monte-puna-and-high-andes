Map.setOptions("HYBRID");
 
var regions = ee.FeatureCollection('users/hdieguez/MBCuyo/Cuyo_regiones')

var palettes = require('users/mapbiomas/modules:Palettes.js').get('classification9')
.concat(["#000000","#000000","#000000","#000000","#000000","#000000","#000000","#a2c830"]);

var mapbiomasPalette = palettes;

var visClass = {
    'min': 0,
    'max': 77,
    'palette': mapbiomasPalette,
    'format': 'png'
};

var assetClass = 'projects/mapbiomas-argentina/assets/LAND-COVER/COLLECTION-2/GENERAL/CLASSIFICATION/FILTERS/CUYO/';

//Carga la clasificación con filtro temporal en ventanas de 4 años
var Filter_exts = ee.Image(assetClass + 'CUYO-FINAL-2-1sp-T3y-4y-5y-1y2Ext')


// the first number will have priority
var ordem_exec_first = [3,4,45,66,77,12,11,9,21,25,27]; //[3, 33, 21, 13, 25];[3,67,12,11,63,21,9,22,27,34]
var ordem_exec_last = [3,4,45,66,77,12,11,9,21,25,27]; //[21];
//var ordem_exec_middle = [33,3, 11,12,15, 19, 22]

var filtered = Filter_exts 

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
                              imagem.select('classification_2022'),
                              imagem.select('classification_2023'),
                              imagem.select('classification_2024')])
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


Map.addLayer(Filter_exts.select('classification_1985'), visClass, 'Filter_exts', false);
Map.addLayer(filtered.select('classification_1985'), visClass, 'class_final', false);
Map.addLayer(filtered.select('classification_1985')
                     .updateMask(filtered
                                .select('classification_1985')
                                .neq(Filter_exts.select('classification_1985'))), 
            visClass, 'cambios en el primer anio (class_final)', true);

Map.addLayer(Filter_exts, null, 'Filter_exts_', false);
Map.addLayer(filtered, null, 'class_final_', false);



Export.image.toAsset({
    "image": filtered,
    "description": 'CUYO-FINAL-2-1sp-T3y-4y-5y-12y3Ext' ,
    "assetId": assetClass + 'CUYO-FINAL-2-1sp-T3y-4y-5y-12y3Ext' ,
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": regions
}); 



/*


var anos = [1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022];
for (var i_ano=0;i_ano<anos.length; i_ano++){
  var ano = anos[i_ano];
  
  var class_ano = Filter_exts.select('classification_'+ano)
// CHILE falta atualizar esse REMAP com classes naturais
  var class_nivel0_ano = class_ano.remap([3,67,12,11,63,21,9,22,27,34],[3,67,12,11,63,21,9,22,27,34]).rename('classification_'+ano)

  if (i_ano == 0){ var class_nivel0 = class_nivel0_ano }  
  else {class_nivel0 = class_nivel0.addBands(class_nivel0_ano); }
}

var nivel0_2022 = class_nivel0.select('classification_2022')
var nivel0_2021 = class_nivel0.select('classification_2021')

// corrige desmatamentos pequenos no último ano
var desmat = nivel0_2022.eq(10).and(nivel0_2021.eq(1))
var conectedDesmat = desmat.selfMask().connectedPixelCount(20,true).reproject('epsg:4326', null, 30);
var desmat1ha = conectedDesmat.lte(11)
var ruido_desmat21 = Filter_exts.select('classification_2021').updateMask(desmat1ha)

// corrige REGEN pequenos no último ano
var regen = nivel0_2022.eq(1).and(nivel0_2021.eq(10))
var conectedRegen = regen.selfMask().connectedPixelCount(25,true).reproject('epsg:4326', null, 30);
var regen1ha = conectedRegen.lte(22)
var ruido_regen21 = Filter_exts.select('classification_2021').updateMask(regen1ha)


var nivel0_1998 = class_nivel0.select('classification_1998')
var nivel0_1999 = class_nivel0.select('classification_1999')

// corrige desmatamentos pequenos no primeiro ano
var desmat = nivel0_1998.eq(1).and(nivel0_1999.eq(10))
var conectedDesmat = desmat.selfMask().connectedPixelCount(30,true).reproject('epsg:4326', null, 30);
var desmat1ha = conectedDesmat.lte(22)
var ruido_desmat98 = Filter_exts.select('classification_1999').updateMask(desmat1ha)


// corrige REGEN pequenos no primeiro ano
var regen = nivel0_1998.eq(10).and(nivel0_1999.eq(1))
var conectedregen = regen.selfMask().connectedPixelCount(30,true).reproject('epsg:4326', null, 30);
var regen1ha = conectedregen.lte(11)
var ruido_regen98 = Filter_exts.select('classification_1999').updateMask(regen1ha)


for (var i_ano=0;i_ano<anos.length; i_ano++){
  var ano = anos[i_ano];
  
  var class_ano = Filter_exts.select('classification_'+ano)

  if (ano == 1998) {  var class_corr = class_ano.blend(ruido_desmat98).blend(ruido_regen98)}
  else if (ano == 2022) {  
    class_corr = class_ano.blend(ruido_desmat21).blend(ruido_regen21)  }
  else {class_corr = class_ano}

  if (i_ano == 0){ var class_final = class_corr}  
  else {class_final = class_final.addBands(class_corr)}

}

*/