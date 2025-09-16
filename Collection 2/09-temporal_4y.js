 //////////////////////////
//Revisar versiones de inputs y outputs!
//////////////////////////
var assetClass = 'projects/mapbiomas-argentina/assets/LAND-COVER/COLLECTION-2/GENERAL/CLASSIFICATION/FILTERS/CUYO';

var assetRegions = 'projects/mapbiomas-argentina/assets/ANCILLARY_DATA/VECTOR/CUYO/regional-assets_cuyo-argcol2_buffer2km_reg';
var regions = ee.FeatureCollection(assetRegions);

//Ojo la versión según parámetros del filtro espacial, y del temporal de 3 años
var Filter_3years = ee.Image('projects/mapbiomas-argentina/assets/LAND-COVER/COLLECTION-2/GENERAL/CLASSIFICATION/FILTERS/CUYO/CUYO-INTEGRADO-2-1sp-T3y')

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


//corrige antrópico 
var anos = [
   2022, 2020,2018,2016,2014,
   2012,2010,2008,2006,2004,2002,
   2000, 1998, 1996, 1994, 1992, 1990, 1988
            ];

//var anos = [2020];

var window4years = function(imagem, classe){
   var class_final = imagem.select('classification_2024')
   class_final = class_final.addBands(imagem.select('classification_2023'))
   
   for (var i_ano=0;i_ano<anos.length; i_ano++){
     var ano = anos[i_ano];
     var class_ano = imagem.select('classification_'+ano)
     var mask_3 = imagem.select('classification_'+ (ano + 1)).neq(classe)
                .and(imagem.select('classification_'+ (ano)).eq(classe))
                .and(imagem.select('classification_'+ (ano - 1)).eq(classe))
                .and(imagem.select('classification_'+ (ano - 2)).neq(classe))
     mask_3 = imagem.select('classification_'+ (ano - 2)).remap([3,4,66,77,45,12,11,9,21,25,33,34],[3,4,66,77,45,12,11,9,21,25,33,34]).updateMask(mask_3)//
     var class_corr = class_ano.blend(mask_3.rename('classification_'+ (ano)))
     class_final = class_final.addBands(class_corr)
     var class_corr2 = imagem.select('classification_'+ (ano - 1)).blend(mask_3.rename('classification_'+ (ano - 1)))
     class_final = class_final.addBands(class_corr2)
   }
   //class_final = class_final.addBands(imagem.select('classification_1987')) //REVISAR ESTO!! Incluirlo resulta en el año duplicado
   class_final = class_final.addBands(imagem.select('classification_1986'))
   class_final = class_final.addBands(imagem.select('classification_1985'))
   return class_final
}

//3,  name: 'Bosques cerrados'},
//4,  name: 'Bosques abiertos'},
//66, name: 'Arbustales cerrados'},
//77, name: 'Arbustales abiertos'},
//45, name: 'Arbustales dispersos'},
//12, name: 'Pastizales'},
//11, name: 'Herbacéas inundables'},
//9,  name: 'Leñosas cultivadas'},
//21, name: 'Mosaico de Usos'},
//25, name: 'Áreas sin vegetación'},
//33, name: 'Ríos, lagunas y lagos'},
//34, name: 'Hielo y nieve en superficie'}
    


//Aquí se puede elegir a qué clases se aplica el filtro. El orden no es indiferente.
// manteniendo el orden aplicado 2025
var filtered = window4years(Filter_3years, 21)
filtered = window4years(filtered, 77)
filtered = window4years(filtered, 45)
filtered = window4years(filtered, 9)
filtered = window4years(filtered, 12)
filtered = window4years(filtered, 11)
filtered = window4years(filtered, 25)
filtered = window4years(filtered, 66)
filtered = window4years(filtered, 4)
filtered = window4years(filtered, 3)



print('pares',filtered)

//corrige antrópico 
var anos = [
   2023, 2021,2019,2017,2015,2013,
   2011,2009,2007,2005,2003,2001, 1999, 1997, 1995, 1993, 1991, 1989, 1987
   
            ];

//var anos = [2020];

var window4years = function(imagem, classe){
   var class_final2 = imagem.select('classification_2024')

   for (var i_ano=0;i_ano<anos.length; i_ano++){
     var ano = anos[i_ano];
     var class_ano = imagem.select('classification_'+ano)
     var mask_3 = imagem.select('classification_'+ (ano + 1)).neq(classe)
                .and(imagem.select('classification_'+ (ano)).eq(classe))
                .and(imagem.select('classification_'+ (ano - 1)).eq(classe))
                .and(imagem.select('classification_'+ (ano - 2)).neq(classe))
     mask_3 = imagem.select('classification_'+ (ano - 2)).remap([3,4,66,77,45,12,11,9,21,25,33,34],[3,4,66,77,45,12,11,9,21,25,33,34]).updateMask(mask_3)//
     var class_corr = class_ano.blend(mask_3.rename('classification_'+ (ano)))
     class_final2 = class_final2.addBands(class_corr)
     var class_corr2 = imagem.select('classification_'+ (ano - 1)).blend(mask_3.rename('classification_'+ (ano - 1)))
     class_final2 = class_final2.addBands(class_corr2)
   }
   //class_final2 = class_final2.addBands(imagem.select('classification_1986'))//REVISAR ESTO!! Incluirlo resulta en el año duplicado
   class_final2 = class_final2.addBands(imagem.select('classification_1985'))
   return class_final2
}

//Aquí se puede elegir a qué clases se aplica el filtro. El orden no es indiferente.
// manteniendo el orden aplicado 2025
var filtered = window4years(filtered, 21)
filtered = window4years(filtered, 77)
filtered = window4years(filtered, 45)
filtered = window4years(filtered, 9)
filtered = window4years(filtered, 12)
filtered = window4years(filtered, 11)
filtered = window4years(filtered, 25)
filtered = window4years(filtered, 66)
filtered = window4years(filtered, 4)
filtered = window4years(filtered, 3)

print('impares',filtered)

var anos = [
    1985, 1986, 1987, 1988, 1989, 
    1990, 1991, 1992, 1993, 1994, 
    1995, 1996, 1997, 1998, 1999, 
    2000, 2001, 2002, 2003, 2004, 
    2005, 2006, 2007, 2008, 2009, 
    2010, 2011, 2012, 2013, 2014, 
    2015, 2016, 2017, 2018, 2019, 
    2020, 2021, 2022, 2023, 2024
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


Export.image.toAsset({
    "image": class_outTotal,
    "description": 'CUYO-INTEGRADO-2-1sp-T3y-4y' ,
    "assetId": assetClass + '/CUYO-INTEGRADO-2-1sp-T3y-4y' ,
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