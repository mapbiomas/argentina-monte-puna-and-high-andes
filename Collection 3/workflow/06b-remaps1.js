// ============================================================
// Cuyo Collection 3 | Script 06b — Manual Class-Correction Remap (v1)
// ============================================================
//
// Este script es una versión revisada de los polígonos de remapeo de 2025.
// Toma el resultado de la integración de metarregiones (06a-integration.js)
// Aplica remap para una primera corrección de clases en base a polígonos,
// y la corrección de sombras por pendiente.
// Exporta complementaria metarregional v2.
//
// DESCRIPTION:
//   Applies a sequence of manually digitized correction polygons to the
//   integrated classification (script 06a output), each one reclassing a
//   specific source class to a specific target class within its polygon,
//   for every year band at once. Also applies two rule-based corrections
//   (not polygon-based): steep-slope water pixels reclassed to
//   "not observed", and a region-5 wetland/grassland rule driven by an
//   EVI2 threshold.
//
// METHODOLOGY:
//   1. Merge the paired correction-polygon sets (each transition has a
//      primary and a supplementary "2" polygon set; merged into one).
//   2. Load the integrated classification (06a output) and a slope layer
//      (NASADEM).
//   3. Build a multi-year EVI2 median mosaic for region 5, used by the
//      EVI2-threshold rule below.
//   4. For each correction (26 transitions total, some from a merged
//      polygon set): mask the source class within the polygon, set it to
//      the target class, and blend the correction into the running
//      corrected image. Corrections apply in sequence, each one seeing
//      the previous corrections' results.
//   5. Apply two additional rule-based corrections: water pixels on
//      slopes >10° (in regions with `Id` <= 5) reclassed to "not
//      observed" (27); and, in region 5 only, wetland pixels reclassed
//      to grassland or kept as wetland depending on whether the EVI2
//      median for that year is below or above 12000 (no-data pixels
//      reclassed to "not observed").
//   6. Export the corrected image.
//
// INPUT:
//   - Integrated classification (script 06a output).
//   - Zones FeatureCollection (Cuyo regions).
//   - NASADEM elevation (public, `NASA/NASADEM_HGT/001`).
//   - Annual Landsat mosaics for Argentina.
//   - 32 manually digitized correction-polygon FeatureCollections (see
//     SECTION 2) — one per class transition, drawn by the analyst in the
//     GEE Code Editor as geometry imports.
//
// OUTPUT:
//   - Corrected classification. Exported as `CUYO-INTEGRADO-2`.
//
// NOTE (kept as in the original): the region-based rules in SECTION 5
// filter the zones FeatureCollection by the `Id` property, while the
// rest of the Cuyo pipeline filters the same FeatureCollection by
// `Id2` — kept exactly as found.
//
// PREVIOUS STEP: 06a-integration.js (produces the integrated
//                classification this script corrects)
// NEXT STEP:     06c-gapfill.js
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
// 🔁 REPLACE: Digitize one FeatureCollection of polygons per class
// transition below (draw them as GEE Code Editor geometry imports). Any
// transition left as an empty FeatureCollection simply corrects nothing.
// Pairs marked "(+ 2)" are merged with a supplementary polygon set of
// the same transition (SECTION 4).
var MosaicoToHerbaceas = ee.FeatureCollection([]);         // 21 -> 12 (+ 2)
var HumedalToMosaico = ee.FeatureCollection([]);           // 11 -> 21
var HumedalToLeniosaCult = ee.FeatureCollection([]);       // 11 -> 9  (+ 2)
var LeniosaCultToBosqueCerrado = ee.FeatureCollection([]); // 9  -> 3
var LeniosaCultToBosqueAbierto = ee.FeatureCollection([]); // 9  -> 4
var MosaicoToArbustalAbierto = ee.FeatureCollection([]);   // 21 -> 77 (+ 2)
var LeniosaCultToArbustalCerrado = ee.FeatureCollection([]); // 9  -> 66
var BosqueCerradoToArbustalAbierto = ee.FeatureCollection([]); // 3  -> 77
var BosqueCerradoToBosqueAbierto = ee.FeatureCollection([]);   // 3  -> 4
var BosqueAbiertoToArbustalAbierto = ee.FeatureCollection([]); // 4  -> 77
var BosqueAbiertoToLeniosaCult = ee.FeatureCollection([]);     // 4  -> 9
var BosqueCerradoToHumedal = ee.FeatureCollection([]);      // 3  -> 11
var NieveToSD = ee.FeatureCollection([]);                   // 34 -> 25
var AguaToSD = ee.FeatureCollection([]);                    // 33 -> 25
var SDToAgua = ee.FeatureCollection([]);                    // 25 -> 33
var AguaToNieve = ee.FeatureCollection([]);                 // 33 -> 34
var HumedalToHerbacea = ee.FeatureCollection([]);           // 11 -> 12 (+ 2)
var HumedalToBosqueCerrado = ee.FeatureCollection([]);      // 11 -> 3
var ArbustalAbiertoToLeniosaCult = ee.FeatureCollection([]); // 77 -> 9
var MosaicoToHumedal = ee.FeatureCollection([]);            // 21 -> 11 (+ 2)
var MosaicoToLeniosaCult = ee.FeatureCollection([]);        // 21 -> 9
var HumedalToArbustalAbierto = ee.FeatureCollection([]);    // 11 -> 77
var LeniosaCultToHumedal = ee.FeatureCollection([]);        // 9  -> 11 (+ 2)
var LeniosaCultToMosaico = ee.FeatureCollection([]);        // 9  -> 21
var BosqueCerradoToLeniosaCult = ee.FeatureCollection([]);  // 3  -> 9
var BosqueAbiertoToMosaico = ee.FeatureCollection([]);      // 4  -> 21
var HumedalToSD = ee.FeatureCollection([]);                 // 11 -> 25

// Supplementary polygon sets, merged into the transitions marked "(+ 2)"
// above.
var MosaicoToHerbaceas2 = ee.FeatureCollection([]);
var HumedalToLeniosaCult2 = ee.FeatureCollection([]);
var MosaicoToArbustalAbierto2 = ee.FeatureCollection([]);
var HumedalToHerbacea2 = ee.FeatureCollection([]);
var MosaicoToHumedal2 = ee.FeatureCollection([]);
var LeniosaCultToHumedal2 = ee.FeatureCollection([]);


// ============================================================
// SECTION 3 — INPUT DATA
// ============================================================
// 🔁 REPLACE: Integrated classification (script 06a output).
var image = ee.Image('projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-3/GENERAL/CLASSIFICATION/COMPLEMENT_CLASSIFICATION/CUYO/CUYO-INTEGRADO-1');

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
var assetClass = 'projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-3/GENERAL/CLASSIFICATION/COMPLEMENT_CLASSIFICATION/CUYO';


// ============================================================
// SECTION 4 — MERGE PAIRED CORRECTION-POLYGON SETS
// ============================================================
var HumedalToLeniosaCultMerged = ee.FeatureCollection(HumedalToLeniosaCult)
    .merge(ee.FeatureCollection(HumedalToLeniosaCult2));

var HumedalToHerbaceaMerged = ee.FeatureCollection(HumedalToHerbacea)
    .merge(ee.FeatureCollection(HumedalToHerbacea2));

var MosaicoToHumedalMerged = ee.FeatureCollection(MosaicoToHumedal)
    .merge(ee.FeatureCollection(MosaicoToHumedal2));

var MosaicoToArbustalAbiertoMerged = ee.FeatureCollection(MosaicoToArbustalAbierto)
    .merge(ee.FeatureCollection(MosaicoToArbustalAbierto2));

var MosaicoToHerbaceasMerged = ee.FeatureCollection(MosaicoToHerbaceas)
    .merge(ee.FeatureCollection(MosaicoToHerbaceas2));

var LeniosaCultToHumedalMerged = ee.FeatureCollection(LeniosaCultToHumedal)
    .merge(ee.FeatureCollection(LeniosaCultToHumedal2));


// ============================================================
// SECTION 5 — REGION-5 EVI2 MEDIAN MOSAIC (for the EVI2-threshold rule)
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
// SECTION 6 — APPLY POLYGON-BASED CORRECTIONS (in sequence)
// ============================================================
////MosaicoToHerbaceas
// Cambia los pixeles con valor 21 dentro de la geometría a 12 en todas las bandas
var mask = image.eq(21).clip(MosaicoToHerbaceasMerged);
var correccion = image.where(mask, 12);
var imagen_corregida = image.blend(correccion);

////HumedalToMosaico
// Cambia los pixeles con valor 11 dentro de la geometría a 21 en todas las bandas
mask = imagen_corregida.eq(11).clip(HumedalToMosaico);
correccion = imagen_corregida.where(mask, 21);
imagen_corregida = imagen_corregida.blend(correccion);

//HumedalToLeniosaCultivada
// Cambia los pixeles con valor 11 dentro de la geometría a 9 en todas las bandas
mask = imagen_corregida.eq(11).clip(HumedalToLeniosaCultMerged);
correccion = imagen_corregida.where(mask, 9);
imagen_corregida = imagen_corregida.blend(correccion);

////LeniosaCultToBosqueCerrado
// Cambia los pixeles con valor 9 dentro de la geometría a 3 en todas las bandas
mask = imagen_corregida.eq(9).clip(LeniosaCultToBosqueCerrado);
correccion = imagen_corregida.where(mask, 3);
imagen_corregida = imagen_corregida.blend(correccion);

////LeniosaCultToBosqueAbierto
// Cambia los pixeles con valor 9 dentro de la geometría a 4 en todas las bandas
mask = imagen_corregida.eq(9).clip(LeniosaCultToBosqueAbierto);
correccion = imagen_corregida.where(mask, 4);
imagen_corregida = imagen_corregida.blend(correccion);

////MosaicoToArbustalAbierto
// Cambia los pixeles con valor 21 dentro de la geometría a 77 en todas las bandas
mask = imagen_corregida.eq(21).clip(MosaicoToArbustalAbiertoMerged);
correccion = imagen_corregida.where(mask, 77);
imagen_corregida = imagen_corregida.blend(correccion);

////LeniosaCultToArbustalCerrado
// Cambia los pixeles con valor 9 dentro de la geometría a 66 en todas las bandas
mask = imagen_corregida.eq(9).clip(LeniosaCultToArbustalCerrado);
correccion = imagen_corregida.where(mask, 66);
imagen_corregida = imagen_corregida.blend(correccion);

////BosqueCerradoToArbustalAbierto
// Cambia los pixeles con valor 3 dentro de la geometría a 77 en todas las bandas
mask = imagen_corregida.eq(3).clip(BosqueCerradoToArbustalAbierto);
correccion = imagen_corregida.where(mask, 77);
imagen_corregida = imagen_corregida.blend(correccion);

////BosqueCerradoToBosqueAbierto
// Cambia los pixeles con valor 3 dentro de la geometría a 4 en todas las bandas
mask = imagen_corregida.eq(3).clip(BosqueCerradoToBosqueAbierto);
correccion = imagen_corregida.where(mask, 4);
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

////Nieve a SD
// Cambia los pixeles con valor 34 dentro de la geometría a 25 en todas las bandas
mask = imagen_corregida.eq(34).clip(NieveToSD);
correccion = imagen_corregida.where(mask, 25);
imagen_corregida = imagen_corregida.blend(correccion);

////Agua a SD
// Cambia los pixeles con valor 33 dentro de la geometría a 25 en todas las bandas
mask = imagen_corregida.eq(33).clip(AguaToSD);
correccion = imagen_corregida.where(mask, 25);
imagen_corregida = imagen_corregida.blend(correccion);

////SD a Agua
// Cambia los pixeles con valor 25 dentro de la geometría a 33 en todas las bandas
mask = imagen_corregida.eq(25).clip(SDToAgua);
correccion = imagen_corregida.where(mask, 33);
imagen_corregida = imagen_corregida.blend(correccion);

////Agua a Nieve
// Cambia los pixeles con valor 33 dentro de la geometría a 34 en todas las bandas
mask = imagen_corregida.eq(33).clip(AguaToNieve);
correccion = imagen_corregida.where(mask, 34);
imagen_corregida = imagen_corregida.blend(correccion);

////HumedalToHerbacea
// Cambia los pixeles con valor 11 dentro de la geometría a 12 en todas las bandas
mask = imagen_corregida.eq(11).clip(HumedalToHerbaceaMerged);
correccion = imagen_corregida.where(mask, 12);
imagen_corregida = imagen_corregida.blend(correccion);

////HumedalToBosqueCerrado
// Cambia los pixeles con valor 11 dentro de la geometría a 3 en todas las bandas
mask = imagen_corregida.eq(11).clip(HumedalToBosqueCerrado);
correccion = imagen_corregida.where(mask, 3);
imagen_corregida = imagen_corregida.blend(correccion);

////ArbustalAbiertoToLeniosaCult
// Cambia los pixeles con valor 77 dentro de la geometría a 9 en todas las bandas
mask = imagen_corregida.eq(77).clip(ArbustalAbiertoToLeniosaCult);
correccion = imagen_corregida.where(mask, 9);
imagen_corregida = imagen_corregida.blend(correccion);

////MosaicoToHumedal
// Cambia los pixeles con valor 21 dentro de la geometría a 11 en todas las bandas
mask = imagen_corregida.eq(21).clip(MosaicoToHumedalMerged);
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
mask = imagen_corregida.eq(9).clip(LeniosaCultToHumedalMerged);
correccion = imagen_corregida.where(mask, 11);
imagen_corregida = imagen_corregida.blend(correccion);

////LeniosaCultToMosaico
// Cambia los pixeles con valor 9 dentro de la geometría a 21 en todas las bandas
mask = imagen_corregida.eq(9).clip(LeniosaCultToMosaico);
correccion = imagen_corregida.where(mask, 21);
imagen_corregida = imagen_corregida.blend(correccion);

////BosqueCerradoToLeniosaCult
// Cambia los pixeles con valor 3 dentro de la geometría a 9 en todas las bandas
mask = imagen_corregida.eq(3).clip(BosqueCerradoToLeniosaCult);
correccion = imagen_corregida.where(mask, 9);
imagen_corregida = imagen_corregida.blend(correccion);

////BosqueAbiertoToMosaico
// Cambia los pixeles con valor 4 dentro de la geometría a 21 en todas las bandas
mask = imagen_corregida.eq(4).clip(BosqueAbiertoToMosaico);
correccion = imagen_corregida.where(mask, 21);
imagen_corregida = imagen_corregida.blend(correccion);

////HumedalToSD
// Cambia los pixeles con valor 11 dentro de la geometría a 25 en todas las bandas
mask = imagen_corregida.eq(11).clip(HumedalToSD);
correccion = imagen_corregida.where(mask, 25);
imagen_corregida = imagen_corregida.blend(correccion);


// ============================================================
// SECTION 7 — RULE-BASED CORRECTIONS (slope, EVI2 threshold)
// ============================================================
//AguaToNoObservado (where slope > 10)
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
// SECTION 8 — EXPORT
// ============================================================
Export.image.toAsset({
    "image": imagen_corregida,
    "description": 'CUYO-INTEGRADO-2',
    // 🔁 REPLACE: Update to your own GEE asset folder (see `assetClass`
    // above).
    "assetId": assetClass + '/CUYO-INTEGRADO-2',
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": zonif
});
