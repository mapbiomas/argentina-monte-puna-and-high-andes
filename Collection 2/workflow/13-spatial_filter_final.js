////////////////////////// 
//Revisar versiones de inputs y outputs!
//////////////////////////
//////PARAMETROS FILTRO ESPACIAL
var modeWindowSize = 2;  // Tamaño del radio de la ventana para calcular la moda
                         // 2 = ventana total de 5x5
                         // 1 = ventana total de 3x3

var min_connect_pixel = 11 //area minima 6pixels = 0,5ha  
                           //11pixels = 1ha

/////////////////////////
var assetClass = 'projects/mapbiomas-argentina/assets/LAND-COVER/COLLECTION-2/GENERAL/CLASSIFICATION/FINAL_CLASSIFICATION';

var assetRegions = 'projects/mapbiomas-argentina/assets/ANCILLARY_DATA/VECTOR/CUYO/regional-assets_cuyo-argcol2_buffer2km_reg';
var regions = ee.FeatureCollection(assetRegions);

//Ojo la versión. Debe incluir filtro espacial, temporales de ventanas 3-4-5 años y de extremos.
var class4GAP = ee.Image('projects/mapbiomas-argentina/assets/LAND-COVER/COLLECTION-2/GENERAL/CLASSIFICATION/FILTERS/CUYO/CUYO-FINAL-2-1sp-T3y-4y-5y-12y3Ext-remap')

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



var bandNames = ee.List(
    anos.map(
        function (year) {
            return 'classification_' + String(year);
        }
    )
);
// add connected pixels bands
var class4GAP = class4GAP.addBands(
    class4GAP
        .connectedPixelCount(20, true)
        .rename(bandNames.map(
            function (band) {
                return ee.String(band).cat('_conn');
            }
        ))
);
//print(class4GAP, 'class4GAP')
//Map.addLayer(class4GAP.select('classification_2022_conn'), visClass, 'conn', true);

for (var i_ano=0;i_ano<anos.length; i_ano++){  
  var ano = anos[i_ano]; 
  
  var moda = class4GAP.select('classification_'+ano).focal_mode(modeWindowSize, 'square', 'pixels')
  moda = moda.mask(class4GAP.select('classification_'+ano+'_conn').lte(min_connect_pixel))
  var class_out = class4GAP.select('classification_'+ano).blend(moda)
  
  if (i_ano == 0){ var class_outTotal = class_out }  
  else {class_outTotal = class_outTotal.addBands(class_out); }
}

var class_final = class_outTotal

print(class_outTotal)
Map.addLayer(class4GAP.select('classification_2024'), visClass, 'A filtrar', true);
Map.addLayer(class_final.select('classification_2024'), visClass, 'Filtrada al vuelo', true);
Map.addLayer(ee.Image('projects/mapbiomas-argentina/assets/LAND-COVER/COLLECTION-2/GENERAL/CLASSIFICATION/FINAL_CLASSIFICATION/CUYO/CUYO-FINAL-v1').select('classification_2024'), visClass, 'Filtrada en asset v1', true);
Map.addLayer(regions.style({color:'black',fillColor:'FF000000'}), {}, 'Region', true);
Map.setOptions("SATELLITE")

 print(class_outTotal)
 
 
 
//Revisar nombres
Export.image.toAsset({
    "image": class_outTotal,
    "description": 'CUYO-FINAL-v2' ,
    "assetId": assetClass + '/CUYO-FINAL-v2' ,
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
  {code: 34, name: 'Hielo y nieve en superficie'},
  {code: 27, name: 'No Observado'},
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