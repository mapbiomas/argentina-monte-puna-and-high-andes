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

var class4GAP = ee.Image('projects/mapbiomas-argentina/assets/COLLECTION1/CLASSIFICATION/FINAL_CLASSIFICATION/CUYO/CUYO-FINAL-3')


 //Map.addLayer(class4GAP, visClass, 'class4GAP');


var years = [
    1985, 1986, 1987, 1988, 1989, 1990,
    1991, 1992, 1993, 1994, 1995,
    1996, 1997, 1998, 1999, 2000,
    2001, 2002, 2003, 2004, 2005,
    2006, 2007, 2008, 2009, 2010,
    2011, 2012, 2013, 2014, 2015,
    2016, 2017, 2018, 2019, 2020,
    2021, 2022
];


// get band names list 
var bandNames = ee.List(
    years.map(
        function (year) {
            return 'classification_' + String(year);
        }
    )
);

// generate a histogram dictionary of [bandNames, image.bandNames()]
var bandsOccurrence = ee.Dictionary(
    bandNames.cat(class4GAP.bandNames()).reduce(ee.Reducer.frequencyHistogram())
);

//print(bandsOccurrence);

// insert a masked band 
var bandsDictionary = bandsOccurrence.map(
    function (key, value) {
        return ee.Image(
            ee.Algorithms.If(
                ee.Number(value).eq(2),
                class4GAP.select([key]).byte(),
                ee.Image().rename([key]).byte().updateMask(class4GAP.select(0))
            )
        );
    }
);

// convert dictionary to image
var imageAllBands = ee.Image(
    bandNames.iterate(
        function (band, image) {
            return ee.Image(class4GAP).addBands(bandsDictionary.get(ee.String(band)));
        },
        ee.Image().select()
    )
);

// generate image pixel years
var imagePixelYear = ee.Image.constant(years)
    .updateMask(imageAllBands)
    .rename(bandNames);


// apply the gap fill
//var imageFilledtnt0 = applyGapFill(imageAllBands);



// add connected pixels bands
var class4GAP = class4GAP.addBands(
    class4GAP
        .connectedPixelCount(100, true)
        .rename(bandNames.map(
            function (band) {
                return ee.String(band).cat('_conn');
            }
        ))
);

print(class4GAP, "addbands-conn");

var min_connect_pixel = 11 //area minima 6pixels = 0,5ha  
                          //11pixels = 1ha


for (var i_ano=0;i_ano<years.length; i_ano++){  
  var ano = years[i_ano]; 
  
  var moda = class4GAP.select('classification_'+ano).focal_mode(2, 'square', 'pixels')
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


var assetClass = 'projects/mapbiomas-argentina/assets/COLLECTION1/CLASSIFICATION/FINAL_CLASSIFICATION/CUYO';

Export.image.toAsset({
    "image": class_final,
    "description": 'CUYO-FINAL-3-1Sp' ,
    "assetId": assetClass + 'CUYO-FINAL-3-1Sp' ,
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": regions
}); 


//////////////////////LEYENDA///////////////////////////////  
var colors = [
'1f8d49',//'3  Leñosas cerradas', ok
'7dc975',//'4  Leñosas abiertas', ok
'c8ffb4',//'45 Leñosas dispersas',
'd6bc74',//'12 Herbáceas', ok
'519799',//'11 Vegetación natural no leñosa inudable', ok
'7a6c00',//'9  Leñosas cultivadas',
'ffefc3',//'21 Mosaico de Usos', ok
//'d4271e',//'24 Áreas urbanas',
//'faf5de',//'61 Salares',
'db4d4f',//'25 Otras áreas sin vegetación',ok
'2532e4',//'33 Ríos, lagunas y lagos', ok
'93dfe6' //34 Hielo y nieve en superficie'
]
 
var names = [
'3  Leñosas cerradas',
'4  Leñosas abiertas',
'45 Leñosas dispersas',
'12 Herbáceas',
'11 Vegetación natural no leñosa inudable',
'9  Leñosas cultivadas',
'21 Mosaico de Usos',
//'24 Áreas urbanas',
//'61 Salares',
'25 Otras áreas sin vegetación',
'33 Ríos, lagunas y lagos',
'34 Hielo y nieve en superficie'
  ];



var legend = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px 15px'
  }
});

// Create and add the legend title.
var legendTitle = ui.Label({
  value: 'Leyenda',
  style: {
    fontWeight: 'bold',
    fontSize: '16px',
    margin: '0 0 4px 0',
    padding: '0'
  }
});

legend.add(legendTitle);

// var loading = ui.Label('Legend:', {margin: '2px 0 4px 0'});
// legend.add(loading);

var makeRow = function(color, name) {
  // Create the label that is actually the colored box.
  var colorBox = ui.Label({
    style: {
      backgroundColor: '#' + color,
      // Use padding to give the box height and width.
      padding: '8px',
      margin: '0 0 4px 0'
    }
  });

  // Create the label filled with the description text.
  var description = ui.Label({
    value: name,
    style: {margin: '0 0 4px 6px'}
  });

  return ui.Panel({
    widgets: [colorBox, description],
    layout: ui.Panel.Layout.Flow('horizontal')
  });
};

for (var i = 0; i < names.length; i++){
legend.add(makeRow(colors[i], names[i]));
}

Map.add(legend)