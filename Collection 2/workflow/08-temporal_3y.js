 //////////////////////////
//Revisar versiones de inputs y outputs!
//////////////////////////
var assetClass = 'projects/mapbiomas-argentina/assets/LAND-COVER/COLLECTION-2/GENERAL/CLASSIFICATION/FILTERS/CUYO';

var assetRegions = 'projects/mapbiomas-argentina/assets/ANCILLARY_DATA/VECTOR/CUYO/regional-assets_cuyo-argcol2_buffer2km_reg';
var regions = ee.FeatureCollection(assetRegions);

//Ojo la versión según parámetros del filtro espacial
var spatialFilter = ee.Image('projects/mapbiomas-argentina/assets/LAND-COVER/COLLECTION-2/GENERAL/CLASSIFICATION/COMPLEMENT_CLASSIFICATION/CUYO/CUYO-INTEGRADO-2-1Sp')

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


//print(spatialFilter, 'Imagen con Filtro espacial');

//orden inverso sin extremos
var anos = [
    2023, 2022, 2021, 2020, 2019, 2018, 2017,
    2016, 2015, 2014, 2013, 2012,
    2011, 2010, 2009, 2008, 2007,
    2006, 2005, 2004, 2003, 2002,
    2001, 2000, 1999, 1998, 1997,
    1996, 1995, 1994, 1993, 1992,
    1991, 1990, 1989, 1988, 1987,
    1986
];

//identifica, por clase y en la serie temporal, pixeles con valores de clase diferentes al anterior y siguiente. Reasigna a la clase del año anterior.
var window3years = function(imagem, classe){
   var class_final = imagem.select('classification_2024')
   
   for (var i_ano=0;i_ano<anos.length; i_ano++){
     var ano = anos[i_ano];
     var class_ano = imagem.select('classification_'+ano)
     
    // aca se incluyen todas las clases como relleno del ruido...
    // classe = 33
    // 4-33-77 -- 4-4-77
    // classe = 12
    // 33-12-77 -- 33-33-77
    
    // propuesto:
    // 33-12-33 --> 33-33-33
    
    // mask_3 = imagem.select('classification_'+ (ano - 1)).remap([3,4,66,77,45,12,11,9,21,25,33,34],[3,4,66,77,45,12,11,9,21,25,33,34]).updateMask(mask_3)
     if(classe == 33){
       var mask_3 = imagem.select('classification_'+ (ano + 1)).eq(classe)
                .and(imagem.select('classification_'+ (ano)).neq(classe))
                .and(imagem.select('classification_'+ (ano - 1)).eq(classe))
       mask_3 = imagem.select('classification_'+ (ano - 1)).updateMask(mask_3)
      }
      else{
        var mask_3 = imagem.select('classification_'+ (ano + 1)).neq(classe)
                .and(imagem.select('classification_'+ (ano)).eq(classe))
                .and(imagem.select('classification_'+ (ano - 1)).neq(classe))
        mask_3 = imagem.select('classification_'+ (ano - 1)).remap([3,4,66,77,45,12,11,9,21,25,27],[3,4,66,77,45,12,11,9,21,25,27]).updateMask(mask_3) //if?
      }
      var class_corr = class_ano.blend(mask_3.rename('classification_'+ (ano)))
     class_final = class_final.addBands(class_corr)
   }
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
// lo que buscamos es limpiar primero las clases que estamos mas segurxs que son ruidos
var filtered = window3years(spatialFilter, 21)
filtered = window3years(filtered, 77)
filtered = window3years(filtered, 45)
filtered = window3years(filtered, 9)
filtered = window3years(filtered, 12)
filtered = window3years(filtered, 11)
filtered = window3years(filtered, 25)
filtered = window3years(filtered, 66)
filtered = window3years(filtered, 4)
filtered = window3years(filtered, 3)
filtered = window3years(filtered, 33)


//
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



anos.forEach(
    function (year) {

          Map.addLayer(ee.Image(spatialFilter).select('classification_' + year), visClass, year.toString() + ' '  + 'sin filtro 3 años', false);
          Map.addLayer(ee.Image(class_outTotal).select('classification_' + year), visClass, year.toString() + ' '  + 'con filtro 3 años', false);

    }
);

print(filtered)
print(class_outTotal)

Map.addLayer(regions.style({color:'black',fillColor:'FF000000'}), {}, 'Region', true);
// Map.centerObject(regions, 5).setOptions("SATELLITE")
Map.addLayer(spatialFilter, {}, 'Filtro espacial todos', false);
Map.addLayer(class_outTotal, {}, 'Filtro Temporal de 3 años todos', false);

//Map.addLayer(spatialFilter.select('classification_2015'), visClass, 'spatialFilter 2015', true);
//Map.addLayer(class_outTotal.select('classification_2015'), visClass, 'class_final2 2015', true);


Export.image.toAsset({
    "image": class_outTotal,
    "description": 'CUYO-INTEGRADO-2-1sp-T3y',
    "assetId": assetClass + '/CUYO-INTEGRADO-2-1sp-T3y',
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