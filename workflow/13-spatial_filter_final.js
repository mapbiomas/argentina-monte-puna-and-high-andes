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

var regions = ee.FeatureCollection('projects/mapbiomas-argentina/assets/ANCILLARY_DATA/VECTOR/CUYO/Cuyo_regiones')
var class4GAP = ee.Image('projects/mapbiomas-argentina/assets/COLLECTION1/CLASSIFICATION/FINAL_CLASSIFICATION/CUYO/CUYO-FINAL-3-1Sp-Tf3y4y5y-1y2y3Ext-dom')


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


var min_connect_pixel = 11 //area minima 6pixels = 0,5ha  
                          //11pixels = 1ha

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
        .connectedPixelCount(100, true)
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
  
  var moda = class4GAP.select('classification_'+ano).focal_mode(2, 'square', 'pixels')
  moda = moda.mask(class4GAP.select('classification_'+ano+'_conn').lte(min_connect_pixel))
  var class_out = class4GAP.select('classification_'+ano).blend(moda)
  
  if (i_ano == 0){ var class_outTotal = class_out }  
  else {class_outTotal = class_outTotal.addBands(class_out); }
}

var class_final = class_outTotal

print(class_outTotal)
Map.addLayer(class4GAP.select('classification_2022'), visClass, 'Filtered', true);
Map.addLayer(class_final.select('classification_2022'), visClass, 'Spatial filter', true);
Map.addLayer(regions.style({color:'black',fillColor:'FF000000'}), {}, 'Region', true);
Map.centerObject(regions, 5).setOptions("SATELLITE")

 print(class_outTotal)

var assetClass = 'projects/mapbiomas-argentina/assets/COLLECTION1/CLASSIFICATION/FINAL_CLASSIFICATION/CUYO/';

Export.image.toAsset({
    "image": class_outTotal,
    "description": 'CUYO-FINAL-3-1Sp-Tf3y4y5y-1y2y3Ext-dom-2Sp' ,
    "assetId": assetClass + 'CUYO-FINAL-3-1Sp-Tf3y4y5y-1y2y3Ext-dom-2Sp' ,
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": regions
});