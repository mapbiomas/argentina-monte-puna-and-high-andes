

Map.setOptions("HYBRID");


var version = {         
    'output': '3',
}; // Versión Filtro temporal


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
var Filter_4years = ee.Image('projects/mapbiomas-argentina/assets/COLLECTION1/CLASSIFICATION/FINAL_CLASSIFICATION/CUYO/CUYO-FINAL-3-1Sp-Tf3y-4y')






//corrige antrópico 
var anos = [
   2020,2017,2014,
   2011,2008,2005,2002, 1999, 1996, 1993, 1990
            ];

var window5years = function(imagem, classe){
   var class_final = imagem.select('classification_2022')
   class_final = class_final.addBands(imagem.select('classification_2021'))
   
   for (var i_ano=0;i_ano<anos.length; i_ano++){
     var ano = anos[i_ano];
     var class_ano = imagem.select('classification_'+ano)
     var mask_3 = imagem.select('classification_'+ (ano + 1)).neq(classe)
                .and(imagem.select('classification_'+ (ano)).eq(classe))
                .and(imagem.select('classification_'+ (ano - 1)).eq(classe))
                .and(imagem.select('classification_'+ (ano - 2)).eq(classe))
                .and(imagem.select('classification_'+ (ano - 3)).neq(classe))
     mask_3 = imagem.select('classification_'+ (ano - 3)).remap([3,4,45,12,11,9,21,25, 27],[3,4,45,12,11,9,21,25,27]).updateMask(mask_3)
     var class_corr = class_ano.blend(mask_3.rename('classification_'+ ano))
     class_final = class_final.addBands(class_corr)
     var class_corr2 = imagem.select('classification_'+ (ano - 1)).blend(mask_3.rename('classification_'+ (ano - 1)))
     class_final = class_final.addBands(class_corr2)
     var class_corr3 = imagem.select('classification_'+ (ano - 2)).blend(mask_3.rename('classification_'+ (ano - 2)))
     class_final = class_final.addBands(class_corr3)
   }
   class_final = class_final.addBands(imagem.select('classification_1987'))
   class_final = class_final.addBands(imagem.select('classification_1986'))
   class_final = class_final.addBands(imagem.select('classification_1985'))
   return class_final
}

var filtered = window5years(Filter_4years, 4)
filtered = window5years(filtered, 45)
filtered = window5years(filtered, 12)
filtered = window5years(filtered, 11)
filtered = window5years(filtered, 9)
filtered = window5years(filtered, 21)
filtered = window5years(filtered, 25)
filtered = window5years(filtered, 27)
filtered = window5years(filtered, 3)

print('pares',filtered)

//corrige antrópico 
var anos = [
   2019,2016,2013,
   2010,2007,2004,2001, 1998, 1995, 1992, 1989
            ];

//var anos = [2020];

var window5years = function(imagem, classe){
   var class_final2 = imagem.select('classification_2022')
   class_final2 = class_final2.addBands(imagem.select('classification_2021'))
   class_final2 = class_final2.addBands(imagem.select('classification_2020'))
   
   for (var i_ano=0;i_ano<anos.length; i_ano++){
     var ano = anos[i_ano];
     var class_ano = imagem.select('classification_'+ano)
     var mask_3 = imagem.select('classification_'+ (ano + 1)).neq(classe)
                .and(imagem.select('classification_'+ (ano)).eq(classe))
                .and(imagem.select('classification_'+ (ano - 1)).eq(classe))
                .and(imagem.select('classification_'+ (ano - 2)).eq(classe))
                .and(imagem.select('classification_'+ (ano - 3)).neq(classe))
     mask_3 = imagem.select('classification_'+ (ano - 3)).remap([3,4,45,12,11,9,21,25,27],[3,4,45,12,11,9,21,25,27]).updateMask(mask_3) //aplico solo a mis clases de interés
     var class_corr = class_ano.blend(mask_3.rename('classification_'+ ano))
     class_final2 = class_final2.addBands(class_corr)
     var class_corr2 = imagem.select('classification_'+ (ano - 1)).blend(mask_3.rename('classification_'+ (ano - 1)))
     class_final2 = class_final2.addBands(class_corr2)
     var class_corr3 = imagem.select('classification_'+ (ano - 2)).blend(mask_3.rename('classification_'+ (ano - 2)))
     class_final2 = class_final2.addBands(class_corr3)
   }
   class_final2 = class_final2.addBands(imagem.select('classification_1986'))
   class_final2 = class_final2.addBands(imagem.select('classification_1985'))
   return class_final2
}



var filtered = window5years(filtered, 4)
filtered = window5years(filtered, 45)
filtered = window5years(filtered, 12)
filtered = window5years(filtered, 11)
filtered = window5years(filtered, 9)
filtered = window5years(filtered, 21)
filtered = window5years(filtered, 25)
filtered = window5years(filtered, 27)
filtered = window5years(filtered, 3)


print('impares',filtered)

//corrige antrópico 
var anos = [
   2021,2018,2015,2012,
   2009,2006,2003, 2000, 1997, 1994, 1991, 1988
            ];

//var anos = [2020];

var window5years = function(imagem, classe){
   var class_final3 = imagem.select('classification_2022')
//   class_final3 = class_final3.addBands(imagem.select('classification_2020'))
//   class_final3 = class_final3.addBands(imagem.select('classification_2019'))
   
   for (var i_ano=0;i_ano<anos.length; i_ano++){
     var ano = anos[i_ano];
     var class_ano = imagem.select('classification_'+ano)
     var mask_3 = imagem.select('classification_'+ (ano + 1)).neq(classe)
                .and(imagem.select('classification_'+ (ano)).eq(classe))
                .and(imagem.select('classification_'+ (ano - 1)).eq(classe))
                .and(imagem.select('classification_'+ (ano - 2)).eq(classe))
                .and(imagem.select('classification_'+ (ano - 3)).neq(classe))
     mask_3 = imagem.select('classification_'+ (ano - 3)).remap([3,4,45,12,11,9,21,25,27],[3,4,45,12,11,9,21,25,27]).updateMask(mask_3)
     var class_corr = class_ano.blend(mask_3.rename('classification_'+ ano))
     class_final3 = class_final3.addBands(class_corr)
     var class_corr2 = imagem.select('classification_'+ (ano - 1)).blend(mask_3.rename('classification_'+ (ano - 1)))
     class_final3 = class_final3.addBands(class_corr2)
     var class_corr3 = imagem.select('classification_'+ (ano - 2)).blend(mask_3.rename('classification_'+ (ano - 2)))
     class_final3 = class_final3.addBands(class_corr3)
   }
   //class_final3 = class_final3.addBands(imagem.select('classification_1987'))
   //class_final3 = class_final3.addBands(imagem.select('classification_1986'))
   class_final3 = class_final3.addBands(imagem.select('classification_1985'))
   return class_final3
}

var filtered = window5years(filtered, 4)
filtered = window5years(filtered, 45)
filtered = window5years(filtered, 12)
filtered = window5years(filtered, 11)
filtered = window5years(filtered, 9)
filtered = window5years(filtered, 21)
filtered = window5years(filtered, 25)
filtered = window5years(filtered, 27)
filtered = window5years(filtered, 3)

print('3',filtered)

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

var prueba = class_outTotal
var drawinfTools = Map.drawingTools();

var geometryList = drawinfTools.layers().map(
    function (obj) {

        var eeObject = obj.getEeObject();

        return ee.Algorithms.If(
            ee.String(ee.Algorithms.ObjectType(eeObject)).equals('FeatureCollection'),
            eeObject,
            ee.FeatureCollection(eeObject)
        );

    }
);

var featCollection = ee.FeatureCollection(geometryList);

// flatten collection of collections into a single collection and
// removes non-standard data
featCollection = featCollection.flatten()
    .filter(ee.Filter.neq('from', null))
    .filter(ee.Filter.neq('to', null));

print(featCollection);

var imageFrom = ee.Image().paint(featCollection, 'from');
var imageTo = ee.Image().paint(featCollection, 'to');

prueba = prueba.where(prueba.eq(imageFrom), imageTo);

Map.addLayer(Filter_4years, {}, 'filtered_4years', false);
Map.addLayer(class_outTotal, {}, 'filtered_5years', false);

Map.addLayer(Filter_4years.select('classification_2019'), visClass, 'filtered_4years', true);
Map.addLayer(class_outTotal.select('classification_2019'), visClass, 'filtered_5years', false);
//Map.addLayer(prueba.select('classification_2019'), visClass, 'remap_5years', true);

Map.addLayer(regions.style({color:'black',fillColor:'FF000000'}), {}, 'Region', true);
Map.centerObject(regions, 5).setOptions("SATELLITE")

print(filtered)
print(class_outTotal)


var assetClass = 'projects/mapbiomas-argentina/assets/COLLECTION1/CLASSIFICATION/FINAL_CLASSIFICATION/CUYO/';

Export.image.toAsset({
    "image": class_outTotal,
    "description": 'CUYO-FINAL-3-1Sp-Tf3y4y5y' ,
    "assetId": assetClass + 'CUYO-FINAL-3-1Sp-Tf3y4y5y' ,
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": regions
}); 