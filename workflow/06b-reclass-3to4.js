var image = ee.Image("projects/mapbiomas-argentina/assets/COLLECTION1/CLASSIFICATION/FINAL_CLASSIFICATION/CUYO/CUYO-FINAL-1"),
    vis5clases = {"opacity":1,"bands":["cluster"],"min":0,"max":4,"palette":["ffffff","ffffff","ffffff","ff0000","ffffff"]},
    geometry = /* color: #d63000 */ee.Geometry.MultiPoint(
        [[-67.65464852590165, -29.275405523644626],
         [-67.6164156842475, -29.432468174441482],
         [-67.7921168573564, -29.441158927016705],
         [-67.9197389634049, -29.360112088842513],
         [-68.26987825135518, -29.10528236720223],
         [-67.52461446556535, -29.057663677815345],
         [-68.88302198505862, -30.173186854594864],
         [-68.88025394535525, -30.17359959956251],
         [-68.96226589478249, -32.063628056006664],
         [-68.8841137062629, -32.49371041291442],
         [-68.86922591582234, -32.44115139608497],
         [-69.15702049786269, -33.21328077696656],
         [-67.3976818233543, -33.56908039789469],
         [-66.5969088829303, -33.911659310501335],
         [-66.35413999611905, -33.859097867400564],
         [-67.72877142915735, -35.67864865320356],
         [-67.76193462108355, -35.63604303217457],
         [-66.722854527027, -36.97620274488596],
         [-65.38254717493733, -37.595628655688174],
         [-65.29772238644628, -38.744909964830455],
         [-66.76166890230004, -35.03384053674846],
         [-66.56904498888574, -35.673052718586696]])
;


// Hace una clasificación no supervisada de las areas de clase 3, muestreando subset de feature space dentro de la mascara de clase 3
// Tiene un conjunto de puntos de matorrales y se fija las clases correspondientes en la nosup
// Exporta clasificación con reemplazo de 3 a 4 salvo en areas de matorral (definidas a partir de la clas no sup)


var year = 2022

var zonif = ee.FeatureCollection('projects/mapbiomas-argentina/assets/ANCILLARY_DATA/VECTOR/CUYO/Cuyo_regiones')

var DEM = ee.Image("NASA/NASADEM_HGT/001").select("elevation")
var slope =  ee.Terrain.slope(DEM).clip(zonif).rename("slope")
//Map.addLayer(slope)

var palettes = require('users/mapbiomas/modules:Palettes.js');
var mapbiomasPalette = palettes.get('classification7');

//
var visClass = {
    'min': 0,
    'max': 62,
    'palette': mapbiomasPalette,
    'format': 'png'
};


Map.addLayer(zonif.style({fillColor:"ff000000"}),null, 'regiones')
Map.addLayer(image.select('classification_' + year).clip(zonif), visClass, "Final1", false)
Map.addLayer(image.clip(zonif), null, "image_serie", false)
Map.setOptions("SATELLITE")

///////////
var assetMosaics = 'projects/nexgenmap/MapBiomas2/LANDSAT/ARGENTINA/mosaics-1';
var mosaics = ee.ImageCollection(assetMosaics);

//
var featureSpace = [
//    'slope',
//    'green_median_texture',
//    'gcvi_median_wet',
//    'gcvi_median',
//    'gcvi_median_dry',
//    "blue_median",
    "evi2_median",
//    "green_median",
//    "red_median",
//    "nir_median",
//    "swir1_median",
//    "swir2_median",
//    "gv_median",
//    "gvs_median",
//    "npv_median",
//    "soil_median",
//    "shade_median",
//    "ndfi_median",
//    "ndfi_median_wet",
    "ndvi_median",
    "ndvi_median_dry",
    "ndvi_median_wet",
//    "ndwi_median",
//    "ndwi_median_wet",
//    "savi_median",
//    "sefi_median",
//    "ndfi_stdDev",
//    "sefi_stdDev",
//    "soil_stdDev",
//    "npv_stdDev",
//    "ndwi_amp"
];

// Landsat images that will be added to Layers
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

// diccionario de clases (no sup) correspondientes a matorrales
var matorral = {
    1985: [1,3,9],
    1986: [1,3,9],
    1987: [0,4,0],
    1988: [2,3,9],
    1989: [0,1,2],
    1990: [0,4,9],
    1991: [4,3,9],
    1992: [1,2,9],
    1993: [0,3,9],
    1994: [1,2,4],
    1995: [1,2,9],
    1996: [2,4,9],
    1997: [4,2,9],
    1998: [1,0,9],
    1999: [1,3,9],
    2000: [0,1,3],
    2001: [0,3,9],
    2002: [2,0,9],
    2003: [1,3,0],
    2004: [1,3,0],
    2005: [4,3,9],
    2006: [1,4,9],
    2007: [1,2,9],
    2008: [4,1,9],
    2009: [4,0,9],
    2010: [4,2,9],
    2011: [2,3,4],
    2012: [3,4,0],
    2013: [2,0,9],
    2014: [0,1,9],
    2015: [3,4,9],
    2016: [1,0,4],
    2017: [0,3,9],
    2018: [0,4,9],
    2019: [1,2,3],
    2020: [2,0,9],
    2021: [0,1,9],
    2022: [3,2,9]
};


//
var numeroClusters = 5; // Puedes ajustar este número según tus necesidades
// 


// Define un objeto para almacenar las imágenes clasificadas de cada año
var classifiedByYear = {};

// Itera sobre cada año
years.forEach(function(year) {
  var leniosas = image.clip(zonif).select('classification_' + year).eq(3);
  
  var mosaicYear = mosaics
    .filter(ee.Filter.eq('year', year))
    .filter(ee.Filter.bounds(zonif))
    .mosaic()
    .addBands(slope)
    .select(featureSpace);
  
  // Realizar la clasificación no supervisada (K-Means)
  var muestras = mosaicYear.updateMask(leniosas).sample({ //
    region: zonif,
    scale: 30,
    numPixels: 10000,
    seed: 123
  });
  
  var clasificador = ee.Clusterer.wekaKMeans(numeroClusters).train(muestras);
  
  // Aplicar la clasificación a la imagen
  var mosaicmask = mosaicYear.updateMask(leniosas)
  var clasificacion = mosaicmask.cluster(clasificador)//.rename('clasnosup_' + year.toString());
print(clasificacion, 'clasnosup_' + year)
Map.addLayer(clasificacion, vis5clases, year + ' '  + 'clasnosup', false);

//////////////// Para determinar la clase (nosup) mayoritaria de los puntos de control
// Obtener los valores de la imagen en las ubicaciones de los puntos
var valoresDeImagen = clasificacion.sampleRegions({
  collection: geometry,
  scale: 30, // Escala de muestreo en metros
});
// Extraer la propiedad 'cluster' de cada punto
var clusterPropiedades = valoresDeImagen.aggregate_array('cluster');
// Imprimir en la consola la propiedad 'cluster' de cada punto
clusterPropiedades.evaluate(function(clusterValores) {
  print("Propiedad 'cluster' de cada punto:"+year, clusterValores)});
  
////////////////
  
var correccion = image.clip(zonif).select('classification_' + year).where(
  leniosas
    .and(clasificacion.neq(matorral[year][0]))
    .and(clasificacion.neq(matorral[year][1]))
    .and(clasificacion.neq(matorral[year][2])),
  4
);
var corregida = image.clip(zonif).select('classification_' + year).blend(correccion)

  // Almacena la imagen clasificada corregida en el objeto classifiedByYear
  classifiedByYear[year] = corregida;
});

// Convierte el objeto en una imagen multibanda
var bandNames = Object.keys(classifiedByYear);
var bandList = [];
bandNames.forEach(function(year) {
  bandList.push(classifiedByYear[year].rename('classification_' + year.toString()));
});
var multibandImage = ee.Image.cat(bandList);

// Muestra la imagen multibanda en la consola
print('Clasif corregida:', multibandImage);

// Añade la imagen multibanda al mapa
//Map.addLayer(multibandImage, {"opacity":1,"bands":["classification_2020"],"min":0,"max":4,"palette":["ffffff","ffffff","ffffff","ff0000","ffffff"]}, 'Imagen multibanda');
Map.addLayer(multibandImage.select('classification_2022'), visClass, 'Clasif corregida');


var assetClass = 'projects/mapbiomas-argentina/assets/COLLECTION1/CLASSIFICATION/FINAL_CLASSIFICATION/CUYO/';
Export.image.toAsset({
    "image": multibandImage,
    "description": 'CUYO-FINAL-3',
    "assetId": assetClass + 'CUYO-FINAL-3',
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": zonif
}); 





