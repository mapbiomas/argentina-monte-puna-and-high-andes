// ============================================================
// Monte, Puna and High Andes | Collection 3 | Script 06c — Temporal Gap Fill
// ============================================================
//
// DESCRIPTION:
//   Fills gaps (masked/no-data pixels) in the multi-year corrected
//   classification (script 06b output) by carrying forward the nearest
//   valid year's class, in both time directions, then adds a per-year
//   "connected pixel count" band (useful downstream to flag small,
//   possibly spurious patches) and exports the filled result.
//
// METHODOLOGY:
//   1. Build a full-years band stack from the input image, inserting an
//      empty (fully masked) band for any year missing from the input.
//   2. Gap-fill forward in time (t0 → tn): for each year band, unmask
//      with the previous (already-filled) year's value.
//   3. Gap-fill backward in time (tn → t0) on the forward-filled result,
//      the same way but walking the years in reverse — this fills any
//      remaining gaps at the start of the series using later years.
//   4. Compute `connectedPixelCount` (8-connectivity, 20-pixel cap) per
//      year band and add it as a `<band>_conn` band.
//   5. Export the filled + connectivity-annotated stack.
//
// INPUT:
//   - Corrected classification (script 06b output).
//   - Zones FeatureCollection (Monte, Puna and High Andes regions) —
//     used only as the export region.
//
// OUTPUT:
//   - Gap-filled classification with added `_conn` bands. Exported as
//     `MPHA-INTEGRATED-3`.
//
// PREVIOUS STEP: 06b-remaps1.js (produces the corrected classification
//                this script gap-fills)
// NEXT STEP:     07-spatial_filter.js
//
// AUTHORS: MapBiomas Argentina — Monte, Puna and High Andes team
// ============================================================


// ============================================================
// SECTION 1 — CONFIGURATION PARAMETERS
// ============================================================
// Landsat images that will be added to Layers
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


// ============================================================
// SECTION 3 — INPUT DATA
// ============================================================
// 🔁 REPLACE: Update to your own GEE asset folder for the classification
// output.
var assetClass = 'projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-3/GENERAL/CLASSIFICATION/COMPLEMENT_CLASSIFICATION/MPHA';

// 🔁 REPLACE: Zones FeatureCollection (Monte, Puna and High Andes
// regions).
var assetRegions = 'projects/YOUR-PROJECT/assets/ANCILLARY_DATA/VECTOR/MPHA/regional-assets_mpha-argcol2_buffer2km_reg';

var regions = ee.FeatureCollection(assetRegions);

// 🔁 REPLACE: Corrected classification (script 06b output).
var image = ee.Image('projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-3/GENERAL/CLASSIFICATION/COMPLEMENT_CLASSIFICATION/MPHA/MPHA-INTEGRATED-2');


// ============================================================
// SECTION 4 — GAP-FILL FUNCTION
// ============================================================
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


// ============================================================
// SECTION 5 — BUILD FULL-YEARS BAND STACK
// ============================================================
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

// insert a masked band for any year missing from the input
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


// ============================================================
// SECTION 6 — GAP FILL + CONNECTIVITY BANDS
// ============================================================
// apply the gap fill
var imageFilledtnt0 = applyGapFill(imageAllBands);

// add connected pixels bands
var imageFilledConnected = imageFilledtnt0.addBands(
    imageFilledtnt0
        .connectedPixelCount(20, true)
        .rename(bandNames.map(
            function (band) {
                return ee.String(band).cat('_conn');
            }
        ))
);


// ============================================================
// SECTION 7 — EXPORT
// ============================================================
Export.image.toAsset({
    "image": imageFilledConnected,
    "description": 'MPHA-INTEGRATED-3',
    // 🔁 REPLACE: Update to your own GEE asset folder (see `assetClass`
    // above).
    "assetId": assetClass + '/MPHA-INTEGRATED-3',
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": regions
});
