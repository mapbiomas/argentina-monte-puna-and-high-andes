// ============================================================
// Cuyo Collection 3 | Script 13 — Manual Class-Correction Remap (v2)
// ============================================================
//
// Toma el resultado de los filtros temporales + extremos + dominancia.
// Aplica remap en base a polígonos, y la corrección de sombras por
// pendiente. Exporta insumo para último filtro espacial.
//
// DESCRIPTION:
//   Second round of manual polygon-based class corrections (see script
//   06b for the first round, applied much earlier in the pipeline) —
//   this time applied to the dominance-corrected classification (script
//   12 output), to fix residual errors found after the temporal filters
//   and dominance correction. Also re-applies the same two rule-based
//   corrections as 06b (steep-slope water -> "not observed", and the
//   region-5 EVI2-threshold wetland/grassland rule), since the
//   intervening steps (07–12) don't preserve those.
//
// METHODOLOGY:
//   1. For each active correction (16 of the ~29 transitions the
//      analyst keeps on file are enabled in this saved run — see
//      SECTION 2): mask the source class within the polygon, set it to
//      the target class, and blend the correction into the running
//      corrected image, in sequence.
//   2. Apply the same slope- and EVI2-threshold-based rule corrections
//      as script 06b.
//   3. Export the corrected image (this becomes the input to the final
//      spatial filter, script 14).
//
// INPUT:
//   - Dominance-corrected classification (script 12 output).
//   - Zones FeatureCollection (Cuyo regions).
//   - NASADEM elevation (public, `NASA/NASADEM_HGT/001`).
//   - Annual Landsat mosaics for Argentina.
//   - Up to 29 manually digitized correction-polygon FeatureCollections
//     (one per possible class transition, drawn by the analyst in the
//     GEE Code Editor as geometry imports) — only 16 are enabled in this
//     saved run (SECTION 2); the rest are commented out as documented,
//     available-but-unused options (cambios posibles, apagar las que no
//     correspondan).
//
// OUTPUT:
//   - Corrected classification. Exported as
//     `CUYO-FINAL-3-1sp-T3y-4y-5y-v2026-b-Ext-dom-remaps`.
//
// NOTE (kept as in the original): as in script 06b, the region-based
// rules filter the zones FeatureCollection by the `Id` property, while
// the rest of the Cuyo pipeline filters it by `Id2` — kept exactly as
// found.
//
// PREVIOUS STEP: 12-dominancia.js (produces the classification this
//                script corrects)
// NEXT STEP:     14-spatial_filter_final.js
//
// AUTHORS: MapBiomas Argentina — Cuyo team
// ============================================================


// ============================================================
// SECTION 1 — CONFIGURATION PARAMETERS
// ============================================================
var year = 2024;


// ============================================================
// SECTION 2 — MANUALLY DIGITIZED CORRECTION POLYGONS
// ============================================================
// 🔁 REPLACE: Digitize one FeatureCollection of polygons per enabled
// class transition below (draw them as GEE Code Editor geometry
// imports). Any transition left as an empty FeatureCollection simply
// corrects nothing.
var HumedalToMosaico = ee.FeatureCollection([]);            // 11 -> 21
var HumedalToLeniosaCult = ee.FeatureCollection([]);        // 11 -> 9
var LeniosaCultToBosqueCerrado = ee.FeatureCollection([]);  // 9  -> 3
var MosaicoToArbustalAbierto = ee.FeatureCollection([]);    // 21 -> 77
var LeniosaCultToArbustalCerrado = ee.FeatureCollection([]); // 9  -> 66
var LeniosaCultToArbustalAbierto = ee.FeatureCollection([]); // 9  -> 77
var BosqueCerradoToArbustalAbierto = ee.FeatureCollection([]); // 3  -> 77
var BosqueCerradoToArbustalCerrado = ee.FeatureCollection([]); // 3  -> 66
var BosqueAbiertoToArbustalAbierto = ee.FeatureCollection([]); // 4  -> 77
var BosqueAbiertoToLeniosaCult = ee.FeatureCollection([]);     // 4  -> 9
var BosqueCerradoToHumedal = ee.FeatureCollection([]);      // 3  -> 11
var MosaicoToHumedal = ee.FeatureCollection([]);            // 21 -> 11
var MosaicoToLeniosaCult = ee.FeatureCollection([]);        // 21 -> 9
var HumedalToArbustalAbierto = ee.FeatureCollection([]);    // 11 -> 77
var LeniosaCultToHumedal = ee.FeatureCollection([]);        // 9  -> 11
var BosqueCerradoToLeniosaCult = ee.FeatureCollection([]);  // 3  -> 9

// Cambios posibles (agregar si es necesario, apagar las que no
// correspondan) — disabled in this saved run, kept as documented,
// available options:
//var ArbustalAbiertoToLeniosaCult = ee.FeatureCollection([]); // 77 -> 9
//var BosqueCerradoToBosqueAbierto = ee.FeatureCollection([]); // 3  -> 4
//var BosqueAbiertoToMosaico = ee.FeatureCollection([]);       // 4  -> 21
//var HumedalToSD = ee.FeatureCollection([]);                  // 11 -> 25
//var HumedalToHerbacea = ee.FeatureCollection([]);            // 11 -> 12
//var HumedalToBosqueCerrado = ee.FeatureCollection([]);       // 11 -> 3
//var MosaicoToHerbaceas = ee.FeatureCollection([]);           // 21 -> 12
//var LeniosaCultToMosaico = ee.FeatureCollection([]);         // 9  -> 21
//var LeniosaCultToBosqueAbierto = ee.FeatureCollection([]);   // 9  -> 4
//var NieveToSD = ee.FeatureCollection([]);                    // 34 -> 25
//var AguaToSD = ee.FeatureCollection([]);                     // 33 -> 25
//var AguaToNieve = ee.FeatureCollection([]);                  // 33 -> 34
//var SDToAgua = ee.FeatureCollection([]);                     // 25 -> 33


// ============================================================
// SECTION 3 — INPUT DATA
// ============================================================
// 🔁 REPLACE: Dominance-corrected classification (script 12 output).
var image = ee.Image('projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-3/GENERAL/CLASSIFICATION/FILTERS/CUYO/CUYO-FINAL-3-1sp-T3y-4y-5y-v2026-b-Ext-dom');

// 🔁 REPLACE: Zones FeatureCollection (Cuyo regions).
var zonif = ee.FeatureCollection('projects/YOUR-PROJECT/assets/ANCILLARY_DATA/VECTOR/CUYO/regional-assets_cuyo-argcol2_buffer2km_reg');

var DEM = ee.Image("NASA/NASADEM_HGT/001").select("elevation");
var slope = ee.Terrain.slope(DEM).clip(zonif).rename("slope");

// 🔁 REPLACE: Annual Landsat mosaics for Argentina.
var mosaics = ee.ImageCollection('projects/YOUR-PROJECT/LANDSAT/ARGENTINA/mosaics-1');

var years = [
    1985, 1986, 1987, 1988, 1989,
    1990, 1991, 1992, 1993, 1994,
    1995, 1996, 1997, 1998, 1999,
    2000, 2001, 2002, 2003, 2004,
    2005, 2006, 2007, 2008, 2009,
    2010, 2011, 2012, 2013, 2014,
    2015, 2016, 2017, 2018, 2019,
    2020, 2021, 2022, 2023, 2024, 2025
];

// 🔁 REPLACE: Update to your own GEE asset folder for the corrected
// classification output.
var assetClass = 'projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-3/GENERAL/CLASSIFICATION/FILTERS/CUYO/';


// ============================================================
// SECTION 4 — REGION-5 EVI2 MEDIAN MOSAIC (for the EVI2-threshold rule)
// ============================================================
var bandList = years.map(function (year) {
    var yearImage = mosaics
        .filter(ee.Filter.eq('year', year))
        .filterBounds(zonif.filter(ee.Filter.eq('Id', 5)))
        .select('evi2_median')
        .mosaic()
        .rename(year.toString());

    return yearImage;
});

var evi2_median = ee.ImageCollection.fromImages(bandList).toBands();


// ============================================================
// SECTION 5 — APPLY POLYGON-BASED CORRECTIONS (in sequence)
// ============================================================
var imagen_corregida = image;

////MosaicoToHerbaceas — disabled (see SECTION 2)
//var mask = image.eq(21).clip(MosaicoToHerbaceas);
//var correccion = image.where(mask, 12);
//var imagen_corregida = image.blend(correccion);

////HumedalToMosaico
// Cambia los pixeles con valor 11 dentro de la geometría a 21 en todas las bandas
var mask = imagen_corregida.eq(11).clip(HumedalToMosaico);
var correccion = imagen_corregida.where(mask, 21);
imagen_corregida = imagen_corregida.blend(correccion);

////HumedalToLeniosaCultivada
// Cambia los pixeles con valor 11 dentro de la geometría a 9 en todas las bandas
mask = imagen_corregida.eq(11).clip(HumedalToLeniosaCult);
correccion = imagen_corregida.where(mask, 9);
imagen_corregida = imagen_corregida.blend(correccion);

////LeniosaCultToBosqueCerrado
// Cambia los pixeles con valor 9 dentro de la geometría a 3 en todas las bandas
mask = imagen_corregida.eq(9).clip(LeniosaCultToBosqueCerrado);
correccion = imagen_corregida.where(mask, 3);
imagen_corregida = imagen_corregida.blend(correccion);

////LeniosaCultToBosqueAbierto — disabled (see SECTION 2)
//var mask = imagen_corregida.eq(9).clip(LeniosaCultToBosqueAbierto);
//var correccion = imagen_corregida.where(mask, 4);
//var imagen_corregida = imagen_corregida.blend(correccion);

////MosaicoToArbustalAbierto
// Cambia los pixeles con valor 21 dentro de la geometría a 77 en todas las bandas
mask = imagen_corregida.eq(21).clip(MosaicoToArbustalAbierto);
correccion = imagen_corregida.where(mask, 77);
imagen_corregida = imagen_corregida.blend(correccion);

////LeniosaCultToArbustalCerrado
// Cambia los pixeles con valor 9 dentro de la geometría a 66 en todas las bandas
mask = imagen_corregida.eq(9).clip(LeniosaCultToArbustalCerrado);
correccion = imagen_corregida.where(mask, 66);
imagen_corregida = imagen_corregida.blend(correccion);

////LeniosaCultToArbustalAbierto
// Cambia los pixeles con valor 9 dentro de la geometría a 77 en todas las bandas
mask = imagen_corregida.eq(9).clip(LeniosaCultToArbustalAbierto);
correccion = imagen_corregida.where(mask, 77);
imagen_corregida = imagen_corregida.blend(correccion);

////BosqueCerradoToArbustalAbierto
// Cambia los pixeles con valor 3 dentro de la geometría a 77 en todas las bandas
mask = imagen_corregida.eq(3).clip(BosqueCerradoToArbustalAbierto);
correccion = imagen_corregida.where(mask, 77);
imagen_corregida = imagen_corregida.blend(correccion);

////BosqueCerradoToBosqueAbierto — disabled (see SECTION 2)
//var mask = imagen_corregida.eq(3).clip(BosqueCerradoToBosqueAbierto);
//var correccion = imagen_corregida.where(mask, 4);
//var imagen_corregida = imagen_corregida.blend(correccion);

////BosqueCerradoToArbustalCerrado
// Cambia los pixeles con valor 3 dentro de la geometría a 66 en todas las bandas
mask = imagen_corregida.eq(3).clip(BosqueCerradoToArbustalCerrado);
correccion = imagen_corregida.where(mask, 66);
imagen_corregida = imagen_corregida.blend(correccion);

////BosqueAbiertoToArbustalAbierto
// Cambia los pixeles con valor 4 dentro de la geometría a 77 en todas las bandas
mask = imagen_corregida.eq(4).clip(BosqueAbiertoToArbustalAbierto);
correccion = imagen_corregida.where(mask, 77);
imagen_corregida = imagen_corregida.blend(correccion);

////BosqueAbiertoToLeniosaCult
// Cambia los pixeles con valor 4 dentro de la geometría a 9 en todas las bandas
mask = imagen_corregida.eq(4).clip(BosqueAbiertoToLeniosaCult);
correccion = imagen_corregida.where(mask, 9);
imagen_corregida = imagen_corregida.blend(correccion);

////BosqueCerradoToHumedal
// Cambia los pixeles con valor 3 dentro de la geometría a 11 en todas las bandas
mask = imagen_corregida.eq(3).clip(BosqueCerradoToHumedal);
correccion = imagen_corregida.where(mask, 11);
imagen_corregida = imagen_corregida.blend(correccion);

////Nieve a SD — disabled (see SECTION 2)
//var mask = imagen_corregida.eq(34).clip(NieveToSD);
//var correccion = imagen_corregida.where(mask, 25);
//var imagen_corregida = imagen_corregida.blend(correccion);

////Agua a SD — disabled (see SECTION 2)
//var mask = imagen_corregida.eq(33).clip(AguaToSD);
//var correccion = imagen_corregida.where(mask, 25);
//var imagen_corregida = imagen_corregida.blend(correccion);

////SD a Agua — disabled (see SECTION 2)
//var mask = imagen_corregida.eq(25).clip(SDToAgua);
//var correccion = imagen_corregida.where(mask, 33);
//var imagen_corregida = imagen_corregida.blend(correccion);

////Agua a Nieve — disabled (see SECTION 2)
//var mask = imagen_corregida.eq(33).clip(AguaToNieve);
//var correccion = imagen_corregida.where(mask, 34);
//var imagen_corregida = imagen_corregida.blend(correccion);

////HumedalToHerbacea — disabled (see SECTION 2)
//var mask = imagen_corregida.eq(11).clip(HumedalToHerbacea);
//var correccion = imagen_corregida.where(mask, 12);
//var imagen_corregida = imagen_corregida.blend(correccion);

////HumedalToBosqueCerrado — disabled (see SECTION 2)
//var mask = imagen_corregida.eq(11).clip(HumedalToBosqueCerrado);
//var correccion = imagen_corregida.where(mask, 3);
//var imagen_corregida = imagen_corregida.blend(correccion);

////ArbustalAbiertoToLeniosoCult — disabled (see SECTION 2)
//var mask = imagen_corregida.eq(77).clip(ArbustalAbiertoToLeniosaCult);
//var correccion = imagen_corregida.where(mask, 9);
//var imagen_corregida = imagen_corregida.blend(correccion);

////MosaicoToHumedal
// Cambia los pixeles con valor 21 dentro de la geometría a 11 en todas las bandas
mask = imagen_corregida.eq(21).clip(MosaicoToHumedal);
correccion = imagen_corregida.where(mask, 11);
imagen_corregida = imagen_corregida.blend(correccion);

////MosaicoToLeniosaCult
// Cambia los pixeles con valor 21 dentro de la geometría a 9 en todas las bandas
mask = imagen_corregida.eq(21).clip(MosaicoToLeniosaCult);
correccion = imagen_corregida.where(mask, 9);
imagen_corregida = imagen_corregida.blend(correccion);

////HumedalToArbustalAbierto
// Cambia los pixeles con valor 11 dentro de la geometría a 77 en todas las bandas
mask = imagen_corregida.eq(11).clip(HumedalToArbustalAbierto);
correccion = imagen_corregida.where(mask, 77);
imagen_corregida = imagen_corregida.blend(correccion);

////LeniosaCultToHumedal
// Cambia los pixeles con valor 9 dentro de la geometría a 11 en todas las bandas
mask = imagen_corregida.eq(9).clip(LeniosaCultToHumedal);
correccion = imagen_corregida.where(mask, 11);
imagen_corregida = imagen_corregida.blend(correccion);

////LeniosaCultToMosaico — disabled (see SECTION 2)
//var mask = imagen_corregida.eq(9).clip(LeniosaCultToMosaico);
//var correccion = imagen_corregida.where(mask, 21);
//var imagen_corregida = imagen_corregida.blend(correccion);

////BosqueCerradoToLeniosaCult
// Cambia los pixeles con valor 3 dentro de la geometría a 9 en todas las bandas
mask = imagen_corregida.eq(3).clip(BosqueCerradoToLeniosaCult);
correccion = imagen_corregida.where(mask, 9);
imagen_corregida = imagen_corregida.blend(correccion);

////BosqueAbiertoToMosaico — disabled (see SECTION 2)
//var mask = imagen_corregida.eq(4).clip(BosqueAbiertoToMosaico);
//var correccion = imagen_corregida.where(mask, 21);
//var imagen_corregida = imagen_corregida.blend(correccion);

////HumedalToSD — disabled (see SECTION 2)
//var mask = imagen_corregida.eq(11).clip(HumedalToSD);
//var correccion = imagen_corregida.where(mask, 25);
//var imagen_corregida = imagen_corregida.blend(correccion);


// ============================================================
// SECTION 6 — RULE-BASED CORRECTIONS (slope, EVI2 threshold)
// ============================================================
////AguaToNoObservado (where slope > 10)
mask = imagen_corregida.eq(33).mask(slope.gt(10)).clip(zonif.filter(ee.Filter.lte('Id', 5)));
correccion = imagen_corregida.where(mask, 27);
imagen_corregida = imagen_corregida.blend(correccion);

////HumedalToHerbacea (where region = 5 y EVI2_median < 12000)
mask = imagen_corregida.eq(11).clip(zonif.filter(ee.Filter.eq('Id', 5)));
correccion = imagen_corregida
    .where(mask.and(evi2_median.lte(12000)), 12)
    .where(mask.and(evi2_median.gt(12000)), 11);
var sinDatos = mask.and(evi2_median.mask().not());
correccion = correccion.where(sinDatos, 27);
imagen_corregida = imagen_corregida.blend(correccion);


// ============================================================
// SECTION 7 — EXPORT
// ============================================================
Export.image.toAsset({
    "image": imagen_corregida,
    "description": 'remaps',
    // 🔁 REPLACE: Update to your own GEE asset folder (see `assetClass`
    // above).
    "assetId": assetClass + 'CUYO-FINAL-3-1sp-T3y-4y-5y-v2026-b-Ext-dom-remaps',
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": zonif
});
