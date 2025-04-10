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


var Filter_3years = ee.Image('projects/mapbiomas-argentina/assets/COLLECTION1/CLASSIFICATION/FINAL_CLASSIFICATION/CUYO/CUYO-FINAL-3-1Sp-Tf3y')


//corrige antrópico 
var anos = [
   2020,2018,2016,2014,
   2012,2010,2008,2006,2004,2002,
   2000, 1998, 1996, 1994, 1992, 1990, 1988
            ];

//var anos = [2020];

var window4years = function(imagem, classe){
   var class_final = imagem.select('classification_2022')
   class_final = class_final.addBands(imagem.select('classification_2021'))
   
   for (var i_ano=0;i_ano<anos.length; i_ano++){
     var ano = anos[i_ano];
     var class_ano = imagem.select('classification_'+ano)
     var mask_3 = imagem.select('classification_'+ (ano + 1)).neq(classe)
                .and(imagem.select('classification_'+ (ano)).eq(classe))
                .and(imagem.select('classification_'+ (ano - 1)).eq(classe))
                .and(imagem.select('classification_'+ (ano - 2)).neq(classe))
     mask_3 = imagem.select('classification_'+ (ano - 2)).remap([3,4,45,12,11,9,21,25,27],[3,4,45,12,11,9,21,25,27]).updateMask(mask_3)//
     var class_corr = class_ano.blend(mask_3.rename('classification_'+ (ano)))
     class_final = class_final.addBands(class_corr)
     var class_corr2 = imagem.select('classification_'+ (ano - 1)).blend(mask_3.rename('classification_'+ (ano - 1)))
     class_final = class_final.addBands(class_corr2)
   }
   //class_final = class_final.addBands(imagem.select('classification_1987'))
   class_final = class_final.addBands(imagem.select('classification_1986'))
   class_final = class_final.addBands(imagem.select('classification_1985'))
   return class_final
}

var filtered = window4years(Filter_3years, 4)
filtered = window4years(filtered, 45)
filtered = window4years(filtered, 12)
filtered = window4years(filtered, 11)
filtered = window4years(filtered, 9)
filtered = window4years(filtered, 21)
filtered = window4years(filtered, 25)
filtered = window4years(filtered, 27)
filtered = window4years(filtered, 3)

print('pares',filtered)

//corrige antrópico 
var anos = [
   2021,2019,2017,2015,2013,
   2011,2009,2007,2005,2003,2001, 1999, 1997, 1995, 1993, 1991, 1989, 1987
   
            ];

//var anos = [2020];

var window4years = function(imagem, classe){
   var class_final2 = imagem.select('classification_2022')

   for (var i_ano=0;i_ano<anos.length; i_ano++){
     var ano = anos[i_ano];
     var class_ano = imagem.select('classification_'+ano)
     var mask_3 = imagem.select('classification_'+ (ano + 1)).neq(classe)
                .and(imagem.select('classification_'+ (ano)).eq(classe))
                .and(imagem.select('classification_'+ (ano - 1)).eq(classe))
                .and(imagem.select('classification_'+ (ano - 2)).neq(classe))
     mask_3 = imagem.select('classification_'+ (ano - 2)).remap([3,4,45,12,11,9,21,25],[3,4,45,12,11,9,21,25]).updateMask(mask_3)//.remap([3,22,13,12,11, 4,29,19, 9,21],[3,22,13,12,11, 4,29,19, 9,21])
     var class_corr = class_ano.blend(mask_3.rename('classification_'+ (ano)))
     class_final2 = class_final2.addBands(class_corr)
     var class_corr2 = imagem.select('classification_'+ (ano - 1)).blend(mask_3.rename('classification_'+ (ano - 1)))
     class_final2 = class_final2.addBands(class_corr2)
   }
   //class_final2 = class_final2.addBands(imagem.select('classification_1986'))
   class_final2 = class_final2.addBands(imagem.select('classification_1985'))
   return class_final2
}

var filtered = window4years(filtered, 4)
filtered = window4years(filtered, 45)
filtered = window4years(filtered, 12)
filtered = window4years(filtered, 11)
filtered = window4years(filtered, 9)
filtered = window4years(filtered, 21)
filtered = window4years(filtered, 25)
filtered = window4years(filtered, 3)

print('impares',filtered)

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


print(filtered)
print(class_outTotal)


Map.addLayer(Filter_3years, {}, 'Filter_3years', false);
Map.addLayer(class_outTotal, {}, 'filtered_4years', false);

Map.addLayer(Filter_3years.select('classification_2020'), visClass, 'Filter_3years', true);
Map.addLayer(class_outTotal.select('classification_2020'), visClass, 'filtered_ 4years', true);

Map.addLayer(regions.style({color:'black',fillColor:'FF000000'}), {}, 'Region', true);
Map.centerObject(regions, 5).setOptions("SATELLITE")

var assetClass = 'projects/mapbiomas-argentina/assets/COLLECTION1/CLASSIFICATION/FINAL_CLASSIFICATION/CUYO/';

Export.image.toAsset({
    "image": class_outTotal,
    "description": 'CUYO-FINAL-3-1Sp-Tf3y-4y' ,
    "assetId": assetClass + 'CUYO-FINAL-3-1Sp-Tf3y-4y' ,
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": regions
}); 