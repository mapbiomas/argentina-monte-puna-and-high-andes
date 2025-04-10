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

var visMos = {
    'bands': [
        'swir1_median',
        'nir_median',
        'red_median'
    ],
    'gain': [0.08, 0.06, 0.2],
    'gamma': 0.85
};

var assetMosaics = 'projects/nexgenmap/MapBiomas2/LANDSAT/ARGENTINA/mosaics-1';
//var regionId = 2;
//var year = 2022;
var assetRegions = 'projects/mapbiomas-argentina/assets/ANCILLARY_DATA/VECTOR/CUYO/Cuyo_regiones';

var regions = ee.FeatureCollection(assetRegions);

var mosaics = ee.ImageCollection(assetMosaics);


var image = ee.Image('projects/mapbiomas-argentina/assets/COLLECTION1/CLASSIFICATION/COMPLEMENT_CLASSIFICATION/CUYO/CUYO-REGION-1-11-3')
print(image, 'clas-integrada')



// Landsat images that will be added to Layers
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

/**
 * User defined functions
 */
var applyGapFill = function (image) {

    // apply the gap fill form t0 until tn
    var imageFilledt0tn = bandNames.slice(1)
        .iterate(
            function (bandName, previousImage) {

                var currentImage = image.select(ee.String(bandName));

                previousImage = ee.Image(previousImage);

                currentImage = currentImage.unmask(
                    previousImage.select([0]));

                return currentImage.addBands(previousImage);

            }, ee.Image(imageAllBands.select([bandNames.get(0)]))
        );

    imageFilledt0tn = ee.Image(imageFilledt0tn);

    // apply the gap fill form tn until t0
    var bandNamesReversed = bandNames.reverse();

    var imageFilledtnt0 = bandNamesReversed.slice(1)
        .iterate(
            function (bandName, previousImage) {

                var currentImage = imageFilledt0tn.select(ee.String(bandName));

                previousImage = ee.Image(previousImage);

                currentImage = currentImage.unmask(
                    previousImage.select(previousImage.bandNames().length().subtract(1)));

                return previousImage.addBands(currentImage);

            }, ee.Image(imageFilledt0tn.select([bandNamesReversed.get(0)]))
        );


    imageFilledtnt0 = ee.Image(imageFilledtnt0).select(bandNames);

    return imageFilledtnt0;
};


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
    bandNames.cat(image.bandNames()).reduce(ee.Reducer.frequencyHistogram())
);

print(bandsOccurrence);

// insert a masked band 
var bandsDictionary = bandsOccurrence.map(
    function (key, value) {
        return ee.Image(
            ee.Algorithms.If(
                ee.Number(value).eq(2),
                image.select([key]).byte(),
                ee.Image().rename([key]).byte().updateMask(image.select(0))
            )
        );
    }
);

// convert dictionary to image
var imageAllBands = ee.Image(
    bandNames.iterate(
        function (band, image) {
            return ee.Image(image).addBands(bandsDictionary.get(ee.String(band)));
        },
        ee.Image().select()
    )
);

// generate image pixel years
var imagePixelYear = ee.Image.constant(years)
    .updateMask(imageAllBands)
    .rename(bandNames);


// apply the gap fill
var imageFilledtnt0 = applyGapFill(imageAllBands);



// add connected pixels bands
var imageFilledConnected = imageFilledtnt0.addBands(
    imageFilledtnt0
        .connectedPixelCount(100, true)
        .rename(bandNames.map(
            function (band) {
                return ee.String(band).cat('_conn');
            }
        ))
);

print(imageFilledConnected);


years.forEach(
    function (year) {

          Map.addLayer(ee.Image(imageFilledConnected).select('classification_' + year), visClass, year.toString() + ' '  + 'Integrada', false);
          Map.addLayer(ee.Image(imageFilledConnected).select('classification_' + year + '_conn'), visClass, year.toString() + ' '  + 'Integrada_conn', false);
      
    }
);

Map.addLayer(regions.style({color:'black',fillColor:'FF000000'}), {}, 'Region', true);
Map.centerObject(regions, 5).setOptions("SATELLITE")


var assetClass = 'projects/mapbiomas-argentina/assets/COLLECTION1/CLASSIFICATION/COMPLEMENT_CLASSIFICATION/CUYO/';


Export.image.toAsset({
    "image": imageFilledConnected,
    "description": 'CUYO-INTEGRACION-' + version.output,
    "assetId": assetClass + 'CUYO-INTEGRACION-' + version.output,
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
