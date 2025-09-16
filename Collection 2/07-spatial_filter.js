 //////PARAMETROS FILTRO ESPACIAL
var modeWindowSize = 2;  // Tamaño del radio de la ventana para calcular la moda
                         // 2 = ventana total de 5x5
                         // 1 = ventana total de 3x3

var min_connect_pixel = 11 //area minima 6pixels = 0,5ha  
                           //11pixels = 1ha
//////////////////////////
//Posibilidad de generar distintas versiones modificando parámetros del filtro espacial 
//////////////////////////
// Inputs and outputs deben ser modificados manualmente
//////////////////////////
var assetClass = 'projects/mapbiomas-argentina/assets/LAND-COVER/COLLECTION-2/GENERAL/CLASSIFICATION/COMPLEMENT_CLASSIFICATION/CUYO';

var assetRegions = 'projects/mapbiomas-argentina/assets/ANCILLARY_DATA/VECTOR/CUYO/regional-assets_cuyo-argcol2_buffer2km_reg';
var regions = ee.FeatureCollection(assetRegions);

var class4GAP = ee.Image('projects/mapbiomas-argentina/assets/LAND-COVER/COLLECTION-2/GENERAL/CLASSIFICATION/COMPLEMENT_CLASSIFICATION/CUYO/CUYO-INTEGRADO-2')

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


//Map.addLayer(class4GAP, visClass, 'class4GAP');

// Landsat images that will be added to Layers
var years = [
    1985, 1986, 1987, 1988, 1989, 
    1990, 1991, 1992, 1993, 1994, 
    1995, 1996, 1997, 1998, 1999, 
    2000, 2001, 2002, 2003, 2004, 
    2005, 2006, 2007, 2008, 2009, 
    2010, 2011, 2012, 2013, 2014, 
    2015, 2016, 2017, 2018, 2019, 
    2020, 2021, 2022, 2023, 2024
];


//// get band names list 
//var bandNames = ee.List(
//    years.map(
//        function (year) {
//            return 'classification_' + String(year);
//        }
//    )
//);
//
//// generate a histogram dictionary of [bandNames, image.bandNames()]
//var bandsOccurrence = ee.Dictionary(
//    bandNames.cat(class4GAP.bandNames()).reduce(ee.Reducer.frequencyHistogram())
//);
//
////print(bandsOccurrence);
//
//// insert a masked band 
//var bandsDictionary = bandsOccurrence.map(
//    function (key, value) {
//        return ee.Image(
//            ee.Algorithms.If(
//                ee.Number(value).eq(2),
//                class4GAP.select([key]).byte(),
//                ee.Image().rename([key]).byte().updateMask(class4GAP.select(0))
//            )
//        );
//    }
//);
//
//// convert dictionary to image
//var imageAllBands = ee.Image(
//    bandNames.iterate(
//        function (band, image) {
//            return ee.Image(class4GAP).addBands(bandsDictionary.get(ee.String(band)));
//        },
//        ee.Image().select()
//    )
//);
//
//// generate image pixel years
//var imagePixelYear = ee.Image.constant(years)
//    .updateMask(imageAllBands)
//    .rename(bandNames);
//
//
//// apply the gap fill
////var imageFilledtnt0 = applyGapFill(imageAllBands);
//
//
//
//// add connected pixels bands
//var class4GAP = class4GAP.addBands(
//    class4GAP
//        .connectedPixelCount(100, true)
//        .rename(bandNames.map(
//            function (band) {
//                return ee.String(band).cat('_conn');
//            }
//        ))
//);
//
//print(class4GAP, "addbands-conn");

var min_connect_pixel = 11 //area minima 6pixels = 0,5ha  
                          //11pixels = 1ha


for (var i_ano=0;i_ano<years.length; i_ano++){  
  var ano = years[i_ano]; 
  
  var moda = class4GAP.select('classification_'+ano).focal_mode(modeWindowSize, 'square', 'pixels')
  moda = moda.mask(class4GAP.select('classification_'+ano+'_conn').lte(min_connect_pixel))
  var class_out = class4GAP.select('classification_'+ano).blend(moda)
  
  if (i_ano == 0){ var class_outTotal = class_out }  
  else {class_outTotal = class_outTotal.addBands(class_out); }
}

var class_final = class_outTotal

print(class_final, 'filtrada')

Map.addLayer(regions.style({color:'black',fillColor:'FF000000'}), {}, 'Region', true);

years.forEach(
    function (year) {

          Map.addLayer(ee.Image(class_final).select('classification_' + year), visClass, year.toString() + ' '  + 'con filtro', false);
          Map.addLayer(ee.Image(class4GAP).select('classification_' + year), visClass, year.toString() + ' '  + 'sin filtro', false);
          Map.addLayer(ee.Image(class4GAP).select('classification_' + year + '_conn'), null, year.toString() + ' '  + 'conn', false);
      
    }
);


Map.centerObject(regions, 5).setOptions("SATELLITE")

//Map.addLayer(class_final, visClass, 'class_final');
// Map.addLayer(class_out2, vis, 'class_out2');


Export.image.toAsset({
    "image": class_final,
    "description": 'CUYO-INTEGRADO-2-1Sp' ,
    "assetId": assetClass + '/CUYO-INTEGRADO-2-1Sp' ,
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