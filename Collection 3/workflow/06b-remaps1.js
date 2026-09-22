// ============================================================
// Monte, Puna and High Andes | Collection 3 | Script 06b — Manual Class-Correction Remap (v1)
// ============================================================
//
// This script is a revised version of the 2025 remap polygons.
// Takes the result of the metaregion integration (06a-integration.js).
// Applies a remap for a first correction of classes based on polygons,
// and corrects shadows caused by slope.
// Exports the v2 metaregional complementary classification.
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
//   - Zones FeatureCollection (Monte, Puna and High Andes regions).
//   - NASADEM elevation (public, `NASA/NASADEM_HGT/001`).
//   - Annual Landsat mosaics for Argentina.
//   - 32 manually digitized correction-polygon FeatureCollections (see
//     SECTION 2) — one per class transition, drawn by the analyst in the
//     GEE Code Editor as geometry imports.
//
// OUTPUT:
//   - Corrected classification. Exported as `MPHA-INTEGRATED-2`.
//
// NOTE (kept as in the original): the region-based rules in SECTION 5
// filter the zones FeatureCollection by the `Id` property, while the
// rest of the pipeline filters the same FeatureCollection by `Id2` —
// kept exactly as found.
//
// PREVIOUS STEP: 06a-integration.js (produces the integrated
//                classification this script corrects)
// NEXT STEP:     06c-gapfill.js
//
// AUTHORS: MapBiomas Argentina — Monte, Puna and High Andes team
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
var MosaicToGrassland = ee.FeatureCollection([]);              // 21 -> 12 (+ 2)
var WetlandToMosaic = ee.FeatureCollection([]);                // 11 -> 21
var WetlandToCultivatedWoody = ee.FeatureCollection([]);       // 11 -> 9  (+ 2)
var CultivatedWoodyToClosedForest = ee.FeatureCollection([]);  // 9  -> 3
var CultivatedWoodyToOpenForest = ee.FeatureCollection([]);    // 9  -> 4
var MosaicToOpenShrubland = ee.FeatureCollection([]);          // 21 -> 77 (+ 2)
var CultivatedWoodyToClosedShrubland = ee.FeatureCollection([]); // 9  -> 66
var ClosedForestToOpenShrubland = ee.FeatureCollection([]);    // 3  -> 77
var ClosedForestToOpenForest = ee.FeatureCollection([]);       // 3  -> 4
var OpenForestToOpenShrubland = ee.FeatureCollection([]);      // 4  -> 77
var OpenForestToCultivatedWoody = ee.FeatureCollection([]);    // 4  -> 9
var ClosedForestToWetland = ee.FeatureCollection([]);          // 3  -> 11
var SnowToBare = ee.FeatureCollection([]);                     // 34 -> 25
var WaterToBare = ee.FeatureCollection([]);                    // 33 -> 25
var BareToWater = ee.FeatureCollection([]);                    // 25 -> 33
var WaterToSnow = ee.FeatureCollection([]);                    // 33 -> 34
var WetlandToGrassland = ee.FeatureCollection([]);             // 11 -> 12 (+ 2)
var WetlandToClosedForest = ee.FeatureCollection([]);          // 11 -> 3
var OpenShrublandToCultivatedWoody = ee.FeatureCollection([]); // 77 -> 9
var MosaicToWetland = ee.FeatureCollection([]);                // 21 -> 11 (+ 2)
var MosaicToCultivatedWoody = ee.FeatureCollection([]);        // 21 -> 9
var WetlandToOpenShrubland = ee.FeatureCollection([]);         // 11 -> 77
var CultivatedWoodyToWetland = ee.FeatureCollection([]);       // 9  -> 11 (+ 2)
var CultivatedWoodyToMosaic = ee.FeatureCollection([]);        // 9  -> 21
var ClosedForestToCultivatedWoody = ee.FeatureCollection([]);  // 3  -> 9
var OpenForestToMosaic = ee.FeatureCollection([]);             // 4  -> 21
var WetlandToBare = ee.FeatureCollection([]);                  // 11 -> 25

// Supplementary polygon sets, merged into the transitions marked "(+ 2)"
// above.
var MosaicToGrassland2 = ee.FeatureCollection([]);
var WetlandToCultivatedWoody2 = ee.FeatureCollection([]);
var MosaicToOpenShrubland2 = ee.FeatureCollection([]);
var WetlandToGrassland2 = ee.FeatureCollection([]);
var MosaicToWetland2 = ee.FeatureCollection([]);
var CultivatedWoodyToWetland2 = ee.FeatureCollection([]);


// ============================================================
// SECTION 3 — INPUT DATA
// ============================================================
// 🔁 REPLACE: Integrated classification (script 06a output).
var image = ee.Image('projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-3/GENERAL/CLASSIFICATION/COMPLEMENT_CLASSIFICATION/MPHA/MPHA-INTEGRATED-1');

// 🔁 REPLACE: Zones FeatureCollection (Monte, Puna and High Andes
// regions).
var zonif = ee.FeatureCollection('projects/YOUR-PROJECT/assets/ANCILLARY_DATA/VECTOR/MPHA/regional-assets_mpha-argcol2_buffer2km_reg');

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
var assetClass = 'projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-3/GENERAL/CLASSIFICATION/COMPLEMENT_CLASSIFICATION/MPHA';


// ============================================================
// SECTION 4 — MERGE PAIRED CORRECTION-POLYGON SETS
// ============================================================
var WetlandToCultivatedWoodyMerged = ee.FeatureCollection(WetlandToCultivatedWoody)
    .merge(ee.FeatureCollection(WetlandToCultivatedWoody2));

var WetlandToGrasslandMerged = ee.FeatureCollection(WetlandToGrassland)
    .merge(ee.FeatureCollection(WetlandToGrassland2));

var MosaicToWetlandMerged = ee.FeatureCollection(MosaicToWetland)
    .merge(ee.FeatureCollection(MosaicToWetland2));

var MosaicToOpenShrublandMerged = ee.FeatureCollection(MosaicToOpenShrubland)
    .merge(ee.FeatureCollection(MosaicToOpenShrubland2));

var MosaicToGrasslandMerged = ee.FeatureCollection(MosaicToGrassland)
    .merge(ee.FeatureCollection(MosaicToGrassland2));

var CultivatedWoodyToWetlandMerged = ee.FeatureCollection(CultivatedWoodyToWetland)
    .merge(ee.FeatureCollection(CultivatedWoodyToWetland2));


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
////MosaicToGrassland
// Changes pixels with value 21 within the geometry to 12 across all bands
var mask = image.eq(21).clip(MosaicToGrasslandMerged);
var correction = image.where(mask, 12);
var correctedImage = image.blend(correction);

////WetlandToMosaic
// Changes pixels with value 11 within the geometry to 21 across all bands
mask = correctedImage.eq(11).clip(WetlandToMosaic);
correction = correctedImage.where(mask, 21);
correctedImage = correctedImage.blend(correction);

////WetlandToCultivatedWoody
// Changes pixels with value 11 within the geometry to 9 across all bands
mask = correctedImage.eq(11).clip(WetlandToCultivatedWoodyMerged);
correction = correctedImage.where(mask, 9);
correctedImage = correctedImage.blend(correction);

////CultivatedWoodyToClosedForest
// Changes pixels with value 9 within the geometry to 3 across all bands
mask = correctedImage.eq(9).clip(CultivatedWoodyToClosedForest);
correction = correctedImage.where(mask, 3);
correctedImage = correctedImage.blend(correction);

////CultivatedWoodyToOpenForest
// Changes pixels with value 9 within the geometry to 4 across all bands
mask = correctedImage.eq(9).clip(CultivatedWoodyToOpenForest);
correction = correctedImage.where(mask, 4);
correctedImage = correctedImage.blend(correction);

////MosaicToOpenShrubland
// Changes pixels with value 21 within the geometry to 77 across all bands
mask = correctedImage.eq(21).clip(MosaicToOpenShrublandMerged);
correction = correctedImage.where(mask, 77);
correctedImage = correctedImage.blend(correction);

////CultivatedWoodyToClosedShrubland
// Changes pixels with value 9 within the geometry to 66 across all bands
mask = correctedImage.eq(9).clip(CultivatedWoodyToClosedShrubland);
correction = correctedImage.where(mask, 66);
correctedImage = correctedImage.blend(correction);

////ClosedForestToOpenShrubland
// Changes pixels with value 3 within the geometry to 77 across all bands
mask = correctedImage.eq(3).clip(ClosedForestToOpenShrubland);
correction = correctedImage.where(mask, 77);
correctedImage = correctedImage.blend(correction);

////ClosedForestToOpenForest
// Changes pixels with value 3 within the geometry to 4 across all bands
mask = correctedImage.eq(3).clip(ClosedForestToOpenForest);
correction = correctedImage.where(mask, 4);
correctedImage = correctedImage.blend(correction);

////OpenForestToOpenShrubland
// Changes pixels with value 4 within the geometry to 77 across all bands
mask = correctedImage.eq(4).clip(OpenForestToOpenShrubland);
correction = correctedImage.where(mask, 77);
correctedImage = correctedImage.blend(correction);

////OpenForestToCultivatedWoody
// Changes pixels with value 4 within the geometry to 9 across all bands
mask = correctedImage.eq(4).clip(OpenForestToCultivatedWoody);
correction = correctedImage.where(mask, 9);
correctedImage = correctedImage.blend(correction);

////ClosedForestToWetland
// Changes pixels with value 3 within the geometry to 11 across all bands
mask = correctedImage.eq(3).clip(ClosedForestToWetland);
correction = correctedImage.where(mask, 11);
correctedImage = correctedImage.blend(correction);

////SnowToBare
// Changes pixels with value 34 within the geometry to 25 across all bands
mask = correctedImage.eq(34).clip(SnowToBare);
correction = correctedImage.where(mask, 25);
correctedImage = correctedImage.blend(correction);

////WaterToBare
// Changes pixels with value 33 within the geometry to 25 across all bands
mask = correctedImage.eq(33).clip(WaterToBare);
correction = correctedImage.where(mask, 25);
correctedImage = correctedImage.blend(correction);

////BareToWater
// Changes pixels with value 25 within the geometry to 33 across all bands
mask = correctedImage.eq(25).clip(BareToWater);
correction = correctedImage.where(mask, 33);
correctedImage = correctedImage.blend(correction);

////WaterToSnow
// Changes pixels with value 33 within the geometry to 34 across all bands
mask = correctedImage.eq(33).clip(WaterToSnow);
correction = correctedImage.where(mask, 34);
correctedImage = correctedImage.blend(correction);

////WetlandToGrassland
// Changes pixels with value 11 within the geometry to 12 across all bands
mask = correctedImage.eq(11).clip(WetlandToGrasslandMerged);
correction = correctedImage.where(mask, 12);
correctedImage = correctedImage.blend(correction);

////WetlandToClosedForest
// Changes pixels with value 11 within the geometry to 3 across all bands
mask = correctedImage.eq(11).clip(WetlandToClosedForest);
correction = correctedImage.where(mask, 3);
correctedImage = correctedImage.blend(correction);

////OpenShrublandToCultivatedWoody
// Changes pixels with value 77 within the geometry to 9 across all bands
mask = correctedImage.eq(77).clip(OpenShrublandToCultivatedWoody);
correction = correctedImage.where(mask, 9);
correctedImage = correctedImage.blend(correction);

////MosaicToWetland
// Changes pixels with value 21 within the geometry to 11 across all bands
mask = correctedImage.eq(21).clip(MosaicToWetlandMerged);
correction = correctedImage.where(mask, 11);
correctedImage = correctedImage.blend(correction);

////MosaicToCultivatedWoody
// Changes pixels with value 21 within the geometry to 9 across all bands
mask = correctedImage.eq(21).clip(MosaicToCultivatedWoody);
correction = correctedImage.where(mask, 9);
correctedImage = correctedImage.blend(correction);

////WetlandToOpenShrubland
// Changes pixels with value 11 within the geometry to 77 across all bands
mask = correctedImage.eq(11).clip(WetlandToOpenShrubland);
correction = correctedImage.where(mask, 77);
correctedImage = correctedImage.blend(correction);

////CultivatedWoodyToWetland
// Changes pixels with value 9 within the geometry to 11 across all bands
mask = correctedImage.eq(9).clip(CultivatedWoodyToWetlandMerged);
correction = correctedImage.where(mask, 11);
correctedImage = correctedImage.blend(correction);

////CultivatedWoodyToMosaic
// Changes pixels with value 9 within the geometry to 21 across all bands
mask = correctedImage.eq(9).clip(CultivatedWoodyToMosaic);
correction = correctedImage.where(mask, 21);
correctedImage = correctedImage.blend(correction);

////ClosedForestToCultivatedWoody
// Changes pixels with value 3 within the geometry to 9 across all bands
mask = correctedImage.eq(3).clip(ClosedForestToCultivatedWoody);
correction = correctedImage.where(mask, 9);
correctedImage = correctedImage.blend(correction);

////OpenForestToMosaic
// Changes pixels with value 4 within the geometry to 21 across all bands
mask = correctedImage.eq(4).clip(OpenForestToMosaic);
correction = correctedImage.where(mask, 21);
correctedImage = correctedImage.blend(correction);

////WetlandToBare
// Changes pixels with value 11 within the geometry to 25 across all bands
mask = correctedImage.eq(11).clip(WetlandToBare);
correction = correctedImage.where(mask, 25);
correctedImage = correctedImage.blend(correction);


// ============================================================
// SECTION 7 — RULE-BASED CORRECTIONS (slope, EVI2 threshold)
// ============================================================
//WaterToNotObserved (where slope > 10)
mask = correctedImage.eq(33).mask(slope.gt(10)).clip(zonif.filter(ee.Filter.lte('Id', 5)));
correction = correctedImage.where(mask, 27);
correctedImage = correctedImage.blend(correction);

////WetlandToGrassland (where region = 5 and EVI2_median < 12000)
mask = correctedImage.eq(11).clip(zonif.filter(ee.Filter.eq('Id', 5)));
correction = correctedImage
    .where(mask.and(evi2_median.lte(12000)), 12)
    .where(mask.and(evi2_median.gt(12000)), 11);
var noData = mask.and(evi2_median.mask().not());
correction = correction.where(noData, 27);
correctedImage = correctedImage.blend(correction);


// ============================================================
// SECTION 8 — EXPORT
// ============================================================
Export.image.toAsset({
    "image": correctedImage,
    "description": 'MPHA-INTEGRATED-2',
    // 🔁 REPLACE: Update to your own GEE asset folder (see `assetClass`
    // above).
    "assetId": assetClass + '/MPHA-INTEGRATED-2',
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": zonif
});
