Map.setOptions("HYBRID");

var version = {         
    'output': '3',
};


var palettes = require('users/mapbiomas/modules:Palettes.js');
var mapbiomasPalette = palettes.get('classification7');

//
var visClass = {
    'min': 0,
    'max': 62,
    'palette': mapbiomasPalette,
    'format': 'png'
};

var assetRegions = 'projects/mapbiomas-argentina/assets/ANCILLARY_DATA/VECTOR/CUYO/Cuyo_regiones';
var regions = ee.FeatureCollection(assetRegions);

//Carga la clasificación con filtro espacial 
var spatialFilter = ee.Image('projects/mapbiomas-argentina/assets/COLLECTION1/CLASSIFICATION/FINAL_CLASSIFICATION/CUYO/CUYO-FINAL-3-1Sp')
                    
//print(spatialFilter, 'Imagen con Filtro espacial');

//corrige antrópico 
var anos = [
    2021, 2020, 2019, 2018, 2017,
    2016, 2015, 2014, 2013, 2012,
    2011, 2010, 2009, 2008, 2007,
    2006, 2005, 2004, 2003, 2002,
    2001, 2000, 1999, 1998, 1997,
    1996, 1995, 1994, 1993, 1992,
    1991, 1990, 1989, 1988, 1987,
    1986
];


var window3years = function(imagem, classe){
   var class_final = imagem.select('classification_2022')
   
   for (var i_ano=0;i_ano<anos.length; i_ano++){
     var ano = anos[i_ano];
     var class_ano = imagem.select('classification_'+ano)
     var mask_3 = imagem.select('classification_'+ (ano + 1)).neq(classe)
                .and(imagem.select('classification_'+ (ano)).eq(classe))
                .and(imagem.select('classification_'+ (ano - 1)).neq(classe))
     mask_3 = imagem.select('classification_'+ (ano - 1)).remap([3,4,45,12,11,9,21,25,27],[3,4,45,12,11,9,21,25,27]).updateMask(mask_3)
     var class_corr = class_ano.blend(mask_3.rename('classification_'+ (ano)))
     class_final = class_final.addBands(class_corr)
   }
   class_final = class_final.addBands(imagem.select('classification_1985'))
   return class_final
}


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
//27    No Observado
    


//REVISAR
var filtered = window3years(spatialFilter, 4)
filtered = window3years(filtered, 45)
filtered = window3years(filtered, 12)
filtered = window3years(filtered, 11)
filtered = window3years(filtered, 9)
filtered = window3years(filtered, 21)
filtered = window3years(filtered, 25)
filtered = window3years(filtered, 27)
filtered = window3years(filtered, 3)


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

for (var i_ano=0;i_ano<anos.length; i_ano++){  
  var ano = anos[i_ano]; 
  
  var filtered_ano = filtered.select('classification_'+ano)
  if (i_ano == 0){ var class_outTotal = filtered_ano }  
  else {class_outTotal = class_outTotal.addBands(filtered_ano); }

}



anos.forEach(
    function (year) {

          Map.addLayer(ee.Image(spatialFilter).select('classification_' + year), visClass, year.toString() + ' '  + 'sin filtro 3 años', false);
          Map.addLayer(ee.Image(class_outTotal).select('classification_' + year), visClass, year.toString() + ' '  + 'con filtro 3 años', false);

    }
);

print(filtered)
print(class_outTotal)

Map.addLayer(regions.style({color:'black',fillColor:'FF000000'}), {}, 'Region', true);
Map.centerObject(regions, 5).setOptions("SATELLITE")
//Map.addLayer(spatialFilter, {}, 'Filtro espacial todos', false);
//Map.addLayer(class_outTotal, {}, 'Filtro Temporal de 3 años todos', false);

//Map.addLayer(spatialFilter.select('classification_2015'), visClass, 'spatialFilter 2015', true);
//Map.addLayer(class_outTotal.select('classification_2015'), visClass, 'class_final2 2015', true);

var assetClass = 'projects/mapbiomas-argentina/assets/COLLECTION1/CLASSIFICATION/FINAL_CLASSIFICATION/CUYO/';

Export.image.toAsset({
    "image": class_outTotal,
    "description": 'CUYO-FINAL-3-1Sp-Tf3y' ,
    "assetId": assetClass + 'CUYO-FINAL-3-1Sp-Tf3y' ,
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": regions
}); 
