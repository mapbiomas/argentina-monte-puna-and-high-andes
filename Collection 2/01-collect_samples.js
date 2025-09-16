var assetMosaics = 'projects/nexgenmap/MapBiomas2/LANDSAT/ARGENTINA/mosaics-1';

//
var assetRegions = 'users/hdieguez/MBCuyo/projects/mapbiomas-argentina/assets/ANCILLARY_DATA/VECTOR/CUYO/regional-assets_cuyo-argcol2_buffer2km_reg';

// Classes that will be exported
var assetSamples = 'projects/mapbiomas-argentina/assets/COLLECTION1/SAMPLES/CUYO';

// Define a region id (1... 11)
var regionId = 1;

var nTrainingPoints = 2000   // Number of points to training
var nValidationPoints = 500   // Number of points to validate

// Obtener los valores únicos de la propiedad "class"
var uniqueClasses = muestrasC1.aggregate_array('class').distinct();

var palettes = require('users/mapbiomas/modules:Palettes.js');
var mapbiomasPalette = palettes.get('classification6');
var mbp = mapbiomasPalette.map(function(color, index){
  return [index.toString(), color]
})
var visParams = {
  rules: [
    {
      filter: ee.Filter.and(
        ee.Filter.neq('region', regionId),
        ee.Filter.neq('class', "27")),
      isVisible: false
    }
    ],
  color: {
      property: 'class',
      categories:mbp
    },
  fillColor: {
    property: 'class',
    categories: mbp
  }
};


var muestras_pol = ui.Map.FeatureViewLayer({
  assetId: 'projects/ee-torrezaffaroni/assets/MB-cuyo_muestras-C1-pol_FV',
  visParams: visParams, 
  name: 'Poligonos - muestras C1',
  shown: true
});
var muestras_cent = ui.Map.FeatureViewLayer({
  assetId: 'projects/ee-torrezaffaroni/assets/MB-cuyo_muestras-C1_FV',
  visParams: visParams, 
  name: 'Centroides - muestras C1',
  shown: true
});
Map.add(muestras_cent)
Map.add(muestras_pol)


// Función para contar observaciones por clase
function contarObservaciones(regionId) {
  var conteos = {};
  uniqueClasses.evaluate(function(classes) {
    classes.forEach(function(classValue) {
      var subset = muestrasC1.filter(ee.Filter.eq('region', regionId))
                             .filter(ee.Filter.eq('class', classValue));
      var count = subset.size();
      conteos[classValue] = count;
    });
    print('Conteo de muestras revisadas de la C1 por clase:', conteos);
  });
}
contarObservaciones(regionId);



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

// Version that will be saved
var versionOutput = 1;

//
var featureSpace = [
    'slope',
    'green_median_texture',
    'gcvi_median_wet',
    'gcvi_median',
    'gcvi_median_dry',
    "blue_median",
    "evi2_median",
    "green_median",
    "red_median",
    "nir_median",
    "swir1_median",
    "swir2_median",
    "gv_median",
    "gvs_median",
    "npv_median",
    "soil_median",
    "shade_median",
    "ndfi_median",
    "ndfi_median_wet",
    "ndvi_median",
    "ndvi_median_dry",
    "ndvi_median_wet",
    "ndwi_median",
    "ndwi_median_wet",
    "savi_median",
    "sefi_median",
    "ndfi_stdDev",
    "sefi_stdDev",
    "soil_stdDev",
    "npv_stdDev",
    "ndwi_amp"
];

var visClass = {
    'min': 0,
    'max': 49,
    'palette': mapbiomasPalette
};

var visMos = {
    'bands': [
        'nir_median',
        'swir1_median',
        //'nir_median',
        'red_median'
    ],
    'gain': [0.06, 0.08, 0.1],
    'gamma': 1.15
};

var palettes = require('users/mapbiomas/modules:Palettes.js');

var mosaics = ee.ImageCollection(assetMosaics);
var regions = ee.FeatureCollection(assetRegions);
//print("mosaics",mosaics)
//print("regions",regions)

var selectedRegion = regions.filter(ee.Filter.eq('Id', regionId));

var mapbiomasPalette = palettes.get('classification6');

/**
 * List of feature collection you must should for sample collection
 */
var region = typeof (userRegion) !== 'undefined' ? userRegion : selectedRegion;


//var samplesList = [
//    typeof (ArbustalesCerrados) !== 'undefined' ? ArbustalesCerrados : ee.FeatureCollection([]), //1.1 Leñosas cerradas
//    typeof (ArbustalesAbiertos) !== 'undefined' ? ArbustalesAbiertos : ee.FeatureCollection([]), //1.2 Leñosas abiertas
//    typeof (ArbustalesDispersos) !== 'undefined' ? ArbustalesDispersos : ee.FeatureCollection([]), //1.3 Leñosas dispersas
//    typeof (Herbaceas) !== 'undefined' ? Herbaceas : ee.FeatureCollection([]), //2.1 Herbáceas
//    typeof (HerbaceasInundables) !== 'undefined' ? HerbaceasInundables : ee.FeatureCollection([]), //2.2 Vegetación natural no leñosa inudable
//    typeof (LeniosasCultivadas) !== 'undefined' ? LeniosasCultivadas : ee.FeatureCollection([]), //3.3 Leñosas cultivadas
//    typeof (MosaicoUsos) !== 'undefined' ? MosaicoUsos : ee.FeatureCollection([]), //3.4. Mosaico de Usos
//    typeof (Urbano) !== 'undefined' ? Urbano : ee.FeatureCollection([]), //4.1 Áreas urbanas
//    typeof (Salares) !== 'undefined' ? Salares : ee.FeatureCollection([]), //4.2 Salares
//    typeof (OtrasSinVegetacion) !== 'undefined' ? OtrasSinVegetacion : ee.FeatureCollection([]), //4.3 Otras áreas sin vegetación
//    typeof (CuerposAgua) !== 'undefined' ? CuerposAgua : ee.FeatureCollection([]), //5.1 Ríos, lagunas y lagos
//    typeof (HieloNieve) !== 'undefined' ? HieloNieve : ee.FeatureCollection([]), //5.2 Hielo y nieve en superficie
//    typeof (NoObservado) !== 'undefined' ? NoObservado : ee.FeatureCollection([]), //6. No Observado
//];

//print(samplesList);
//------------------------------------------------------------------
// User defined functions
//------------------------------------------------------------------

/**
 * Create a function to collect random point inside the polygons
 * @param {*} polygons 
 * @param {*} nPoints 
 * @returns 
 */
var generatePoints = function (polygons, nPoints) {

    // convert polygons to raster
    var polygonsRaster = ee.Image().paint({
        featureCollection: polygons,
        color: 'class'
    }).rename('class');

    // Generate N random points inside the polygons
    var points = polygonsRaster.stratifiedSample({
        'numPoints': nPoints,
        'classBand': 'class',
        'region': polygons,
        'scale': 30,
        'seed': 1,
        'dropNulls': true,
        'geometries': true
    });

    return points;
};
//------------------------------------------------------------------
// User defined functions
//------------------------------------------------------------------
// merges all polygons
var samplesPolygons = ee.List(samplesList).iterate(
    function (sample, samplesPolygon) {
        return ee.FeatureCollection(samplesPolygon).merge(sample);
    },
    ee.FeatureCollection([])
);

// filter by user defined region "userRegion" if exists
samplesPolygons = ee.FeatureCollection(samplesPolygons)
    .filter(ee.Filter.bounds(region));

samplesPolygons = samplesPolygons.map(
    function (polygon) {
        return polygon.set({
          "geom_type": polygon.geometry().type(),
          "region": regionId.toString(),
          "polygon_id": ee.String(regionId.toString()).cat('_').cat(ee.String(polygon.get("class"))).cat('_').cat(polygon.id().slice(-2)).replace("__", "_")
          })
        // .buffer(1, 10);
    }
).filter(ee.Filter.eq("geom_type", "Polygon"));
print(samplesPolygons, "poligonos a exportar")
// // generate training points
// var trainingPoints = generatePoints(samplesPolygons, nTrainingPoints);

// // generate validation points
// var validationPoints = generatePoints(samplesPolygons, nValidationPoints);

// //print('trainingPoints', trainingPoints.aggregate_histogram('class'));
// //print('validationPoints', validationPoints.aggregate_histogram('class'));

// // set sample type
// trainingPoints = trainingPoints.map(
//     function (sample) {
//         return sample.set('sample_type', 'training');
//     }
// );

// validationPoints = validationPoints.map(
//     function (sample) {
//         return sample.set('sample_type', 'validation');
//     }
// );

// // merge training and validation points
// var samplesPoints = trainingPoints.merge(validationPoints);

// // visualize points using mapbiomas color palette
// var samplesPointsVis = samplesPoints.map(
//     function (feature) {
//         return feature.set('style', {
//             'color': ee.List(mapbiomasPalette).get(feature.get('class')),
//             'width': 1,
//         });
//     }
// );

// var terrain = ee.Image("JAXA/ALOS/AW3D30_V1_1").select("AVE");
// var slope = ee.Terrain.slope(terrain);

// // Add mosaic for each year
// years.forEach(
//     function (year) {
//         var mosaicYear = mosaics
//             .filter(ee.Filter.eq('year', year))
//             .filter(ee.Filter.bounds(region))
//             .mosaic()
//             .addBands(slope);

//         mosaicYear = mosaicYear.select(featureSpace);

//         Map.addLayer(mosaicYear, visMos, year.toString() + ' region ' + regionId.toString(), false);

//         // Collect the spectral information to get the trained samples
//         var trainedSamples = mosaicYear.reduceRegions({
//             'collection': samplesPoints,
//             'reducer': ee.Reducer.first(),
//             'scale': 30,
//         });

//         trainedSamples = trainedSamples.filter(ee.Filter.notNull(['green_median_texture']));

//         // Export points to asset
//         var pointsName = 'samples-points-regionID-' + regionId.toString() + '-' + year.toString() + '-v' + versionOutput;

//       /* Export.table.toAsset({
//             "collection": trainedSamples,
//             "description": pointsName,
//             "assetId": assetSamples + '/' + pointsName
//         });*/

//     }
// );


// Map.addLayer(selectedRegion.geometry().bounds().symmetricDifference(selectedRegion.geometry(), ee.ErrorMargin(1)), {}, 'region ' + regionId.toString(), true);
// //Map.centerObject(selectedRegion, 7).setOptions("SATELLITE")


// Map.addLayer(samplesPointsVis.style({ 'styleProperty': 'style' }), {}, 'samples - points');

// Export polygons to asset
var polygonsName = 'samples-polygons-regionID-' + regionId.toString() + '-v' + versionOutput;

//Export.table.toAsset({
//    "collection": samplesPolygons,
//    "description": polygonsName,
//    "assetId": 'projects/ee-torrezaffaroni/assets/0_MapBiomas/muestras_C2_poligonos' + '/' + polygonsName
//});





/////////////////////Panel NDVI
var ts_tools = require("users/hdieguez/MBCuyo:time_series.js");

var panel = ui.Panel({
    style: { 
        //width: '400px',  // Ancho del panel (puedes ajustar según sea necesario)
        //height: '200px', // Alto del panel (ajustado para que sea la mitad del ancho)
        position: 'bottom-right', // Posición en la esquina inferior derecha
        stretch: 'horizontal' // Estira el panel en la dirección horizontal
    }
});

var chk_refresh_plot_flag = ui.Checkbox("Mostrar Firma Fenologica NDVI");

panel.add(chk_refresh_plot_flag);  // Agrega el checkbox al panel


// Función para manejar el clic en el mapa
var get_panel_chart_ts = function() {
    Map.onClick(function(point) {
        var punto = ee.Geometry.Point([point.lon, point.lat]);
        
        // Limpiar el panel antes de agregar un nuevo gráfico
        panel.clear(); 
        panel.add(chk_refresh_plot_flag);  // Reagregar el checkbox

        // Solo agregar la firma fenológica si el checkbox está marcado
        if (chk_refresh_plot_flag.getValue()) {
            panel.add(ts_tools.get_time_serie_plot(punto));
        }
    });
};

// Agregar el panel al mapa
Map.add(panel);

// Llamar a la función para configurar el clic en el mapa
get_panel_chart_ts();
//
//////