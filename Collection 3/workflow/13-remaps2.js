// ============================================================
// Monte, Puna and High Andes | Collection 3 | Script 13 — Manual Class-Correction Remap (v2)
// ============================================================
//
// Takes the result of the temporal + edge + dominance filters.
// Applies a remap based on polygons, and corrects shadows caused by
// slope. Exports the input for the final spatial filter.
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
//   - Zones FeatureCollection (Monte, Puna and High Andes regions).
//   - NASADEM elevation (public, `NASA/NASADEM_HGT/001`).
//   - Annual Landsat mosaics for Argentina.
//   - Up to 29 manually digitized correction-polygon FeatureCollections
//     (one per possible class transition, drawn by the analyst in the
//     GEE Code Editor as geometry imports) — only 16 are enabled in this
//     saved run (SECTION 2); the rest are commented out as documented,
//     available-but-unused options (possible changes — add as needed,
//     turn off the ones that don't apply).
//
// OUTPUT:
//   - Corrected classification. Exported as
//     `MPHA-FINAL-3-1sp-T3y-4y-5y-v2026-b-Ext-dom-remaps`.
//
// NOTE (kept as in the original): as in script 06b, the region-based
// rules filter the zones FeatureCollection by the `Id` property, while
// the rest of the pipeline filters it by `Id2` — kept exactly as found.
//
// PREVIOUS STEP: 12-dominance.js (produces the classification this
//                script corrects)
// NEXT STEP:     14-spatial_filter_final.js
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
// 🔁 REPLACE: Digitize one FeatureCollection of polygons per enabled
// class transition below (draw them as GEE Code Editor geometry
// imports). Any transition left as an empty FeatureCollection simply
// corrects nothing.
var WetlandToMosaic = ee.FeatureCollection([]);                // 11 -> 21
var WetlandToCultivatedWoody = ee.FeatureCollection([]);       // 11 -> 9
var CultivatedWoodyToClosedForest = ee.FeatureCollection([]);  // 9  -> 3
var MosaicToOpenShrubland = ee.FeatureCollection([]);          // 21 -> 77
var CultivatedWoodyToClosedShrubland = ee.FeatureCollection([]); // 9  -> 66
var CultivatedWoodyToOpenShrubland = ee.FeatureCollection([]); // 9  -> 77
var ClosedForestToOpenShrubland = ee.FeatureCollection([]);    // 3  -> 77
var ClosedForestToClosedShrubland = ee.FeatureCollection([]);  // 3  -> 66
var OpenForestToOpenShrubland = ee.FeatureCollection([]);      // 4  -> 77
var OpenForestToCultivatedWoody = ee.FeatureCollection([]);    // 4  -> 9
var ClosedForestToWetland = ee.FeatureCollection([]);          // 3  -> 11
var MosaicToWetland = ee.FeatureCollection([]);                // 21 -> 11
var MosaicToCultivatedWoody = ee.FeatureCollection([]);        // 21 -> 9
var WetlandToOpenShrubland = ee.FeatureCollection([]);         // 11 -> 77
var CultivatedWoodyToWetland = ee.FeatureCollection([]);       // 9  -> 11
var ClosedForestToCultivatedWoody = ee.FeatureCollection([]);  // 3  -> 9

// Possible changes (add as needed, turn off the ones that don't apply)
// — disabled in this saved run, kept as documented, available options:
//var OpenShrublandToCultivatedWoody = ee.FeatureCollection([]); // 77 -> 9
//var ClosedForestToOpenForest = ee.FeatureCollection([]);       // 3  -> 4
//var OpenForestToMosaic = ee.FeatureCollection([]);             // 4  -> 21
//var WetlandToBare = ee.FeatureCollection([]);                  // 11 -> 25
//var WetlandToGrassland = ee.FeatureCollection([]);             // 11 -> 12
//var WetlandToClosedForest = ee.FeatureCollection([]);          // 11 -> 3
//var MosaicToGrassland = ee.FeatureCollection([]);              // 21 -> 12
//var CultivatedWoodyToMosaic = ee.FeatureCollection([]);        // 9  -> 21
//var CultivatedWoodyToOpenForest = ee.FeatureCollection([]);    // 9  -> 4
//var SnowToBare = ee.FeatureCollection([]);                     // 34 -> 25
//var WaterToBare = ee.FeatureCollection([]);                    // 33 -> 25
//var WaterToSnow = ee.FeatureCollection([]);                    // 33 -> 34
//var BareToWater = ee.FeatureCollection([]);                    // 25 -> 33


// ============================================================
// SECTION 3 — INPUT DATA
// ============================================================
// 🔁 REPLACE: Dominance-corrected classification (script 12 output).
var image = ee.Image('projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-3/GENERAL/CLASSIFICATION/FILTERS/MPHA/MPHA-FINAL-3-1sp-T3y-4y-5y-v2026-b-Ext-dom');

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
var assetClass = 'projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-3/GENERAL/CLASSIFICATION/FILTERS/MPHA/';


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
var correctedImage = image;

////MosaicToGrassland — disabled (see SECTION 2)
//var mask = image.eq(21).clip(MosaicToGrassland);
//var correction = image.where(mask, 12);
//var correctedImage = image.blend(correction);

////WetlandToMosaic
// Changes pixels with value 11 within the geometry to 21 across all bands
var mask = correctedImage.eq(11).clip(WetlandToMosaic);
var correction = correctedImage.where(mask, 21);
correctedImage = correctedImage.blend(correction);

////WetlandToCultivatedWoody
// Changes pixels with value 11 within the geometry to 9 across all bands
mask = correctedImage.eq(11).clip(WetlandToCultivatedWoody);
correction = correctedImage.where(mask, 9);
correctedImage = correctedImage.blend(correction);

////CultivatedWoodyToClosedForest
// Changes pixels with value 9 within the geometry to 3 across all bands
mask = correctedImage.eq(9).clip(CultivatedWoodyToClosedForest);
correction = correctedImage.where(mask, 3);
correctedImage = correctedImage.blend(correction);

////CultivatedWoodyToOpenForest — disabled (see SECTION 2)
//var mask = correctedImage.eq(9).clip(CultivatedWoodyToOpenForest);
//var correction = correctedImage.where(mask, 4);
//var correctedImage = correctedImage.blend(correction);

////MosaicToOpenShrubland
// Changes pixels with value 21 within the geometry to 77 across all bands
mask = correctedImage.eq(21).clip(MosaicToOpenShrubland);
correction = correctedImage.where(mask, 77);
correctedImage = correctedImage.blend(correction);

////CultivatedWoodyToClosedShrubland
// Changes pixels with value 9 within the geometry to 66 across all bands
mask = correctedImage.eq(9).clip(CultivatedWoodyToClosedShrubland);
correction = correctedImage.where(mask, 66);
correctedImage = correctedImage.blend(correction);

////CultivatedWoodyToOpenShrubland
// Changes pixels with value 9 within the geometry to 77 across all bands
mask = correctedImage.eq(9).clip(CultivatedWoodyToOpenShrubland);
correction = correctedImage.where(mask, 77);
correctedImage = correctedImage.blend(correction);

////ClosedForestToOpenShrubland
// Changes pixels with value 3 within the geometry to 77 across all bands
mask = correctedImage.eq(3).clip(ClosedForestToOpenShrubland);
correction = correctedImage.where(mask, 77);
correctedImage = correctedImage.blend(correction);

////ClosedForestToOpenForest — disabled (see SECTION 2)
//var mask = correctedImage.eq(3).clip(ClosedForestToOpenForest);
//var correction = correctedImage.where(mask, 4);
//var correctedImage = correctedImage.blend(correction);

////ClosedForestToClosedShrubland
// Changes pixels with value 3 within the geometry to 66 across all bands
mask = correctedImage.eq(3).clip(ClosedForestToClosedShrubland);
correction = correctedImage.where(mask, 66);
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

////SnowToBare — disabled (see SECTION 2)
//var mask = correctedImage.eq(34).clip(SnowToBare);
//var correction = correctedImage.where(mask, 25);
//var correctedImage = correctedImage.blend(correction);

////WaterToBare — disabled (see SECTION 2)
//var mask = correctedImage.eq(33).clip(WaterToBare);
//var correction = correctedImage.where(mask, 25);
//var correctedImage = correctedImage.blend(correction);

////BareToWater — disabled (see SECTION 2)
//var mask = correctedImage.eq(25).clip(BareToWater);
//var correction = correctedImage.where(mask, 33);
//var correctedImage = correctedImage.blend(correction);

////WaterToSnow — disabled (see SECTION 2)
//var mask = correctedImage.eq(33).clip(WaterToSnow);
//var correction = correctedImage.where(mask, 34);
//var correctedImage = correctedImage.blend(correction);

////WetlandToGrassland — disabled (see SECTION 2)
//var mask = correctedImage.eq(11).clip(WetlandToGrassland);
//var correction = correctedImage.where(mask, 12);
//var correctedImage = correctedImage.blend(correction);

////WetlandToClosedForest — disabled (see SECTION 2)
//var mask = correctedImage.eq(11).clip(WetlandToClosedForest);
//var correction = correctedImage.where(mask, 3);
//var correctedImage = correctedImage.blend(correction);

////OpenShrublandToCultivatedWoody — disabled (see SECTION 2)
//var mask = correctedImage.eq(77).clip(OpenShrublandToCultivatedWoody);
//var correction = correctedImage.where(mask, 9);
//var correctedImage = correctedImage.blend(correction);

////MosaicToWetland
// Changes pixels with value 21 within the geometry to 11 across all bands
mask = correctedImage.eq(21).clip(MosaicToWetland);
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
mask = correctedImage.eq(9).clip(CultivatedWoodyToWetland);
correction = correctedImage.where(mask, 11);
correctedImage = correctedImage.blend(correction);

////CultivatedWoodyToMosaic — disabled (see SECTION 2)
//var mask = correctedImage.eq(9).clip(CultivatedWoodyToMosaic);
//var correction = correctedImage.where(mask, 21);
//var correctedImage = correctedImage.blend(correction);

////ClosedForestToCultivatedWoody
// Changes pixels with value 3 within the geometry to 9 across all bands
mask = correctedImage.eq(3).clip(ClosedForestToCultivatedWoody);
correction = correctedImage.where(mask, 9);
correctedImage = correctedImage.blend(correction);

////OpenForestToMosaic — disabled (see SECTION 2)
//var mask = correctedImage.eq(4).clip(OpenForestToMosaic);
//var correction = correctedImage.where(mask, 21);
//var correctedImage = correctedImage.blend(correction);

////WetlandToBare — disabled (see SECTION 2)
//var mask = correctedImage.eq(11).clip(WetlandToBare);
//var correction = correctedImage.where(mask, 25);
//var correctedImage = correctedImage.blend(correction);


// ============================================================
// SECTION 6 — RULE-BASED CORRECTIONS (slope, EVI2 threshold)
// ============================================================
////WaterToNotObserved (where slope > 10)
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
// SECTION 7 — EXPORT
// ============================================================
Export.image.toAsset({
    "image": correctedImage,
    "description": 'remaps',
    // 🔁 REPLACE: Update to your own GEE asset folder (see `assetClass`
    // above).
    "assetId": assetClass + 'MPHA-FINAL-3-1sp-T3y-4y-5y-v2026-b-Ext-dom-remaps',
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": zonif
});
