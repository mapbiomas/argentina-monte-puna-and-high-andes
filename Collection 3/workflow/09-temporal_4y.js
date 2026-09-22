// ============================================================
// Cuyo Collection 3 | Script 09 — Temporal Filter (4-year window)
// ============================================================
//
// DESCRIPTION:
//   Second temporal-filter pass on top of script 08's 3-year filter
//   output: removes 2-year "step" noise (a class change that reverts
//   two years later) using a wider window, per class, in a fixed
//   priority order. Runs in two separate passes — one anchored on
//   even years, one on odd years — because the window logic looks 2
//   years back and 1 year forward from each anchor year.
//
// METHODOLOGY:
//   1. `window4years` (even-year pass): for each even anchor year
//      (2024 down to 1988, in even steps), if `year+1` differs from the
//      target class, `year` and `year-1` both equal it, and `year-2`
//      differs from it, treat `year` and `year-1` as noise and replace
//      both with `year-2`'s class.
//   2. Apply that rule for each class in a fixed priority order (25, 21,
//      9, 11, 12, 4, 3, 77, 45, 66) — later classes can override earlier
//      corrections.
//   3. `window4years` is then redefined for the odd-year pass (2023 down
//      to 1987) with the same logic, applied to the even-pass output, in
//      the same class order.
//   4. Reassemble a single band per year (1985–2025) from the two
//      passes' outputs and export.
//
// INPUT:
//   - 3-year temporally filtered classification (script 08 output).
//   - Zones FeatureCollection (Cuyo regions) — used only as the export
//     region.
//
// OUTPUT:
//   - 3-year + 4-year filtered classification. Exported as
//     `CUYO-INTEGRADO-3-1sp-T3y-4y-v2026-b`.
//
// NOTE (kept as in the original): both `window4years` passes have a
// commented-out line about including one more edge-year band
// ("classification_1987" / "classification_1986") flagged
// "REVISAR ESTO!! Incluirlo resulta en el año duplicado" (i.e. including
// it produced a duplicated year band) — kept commented out as found.
//
// PREVIOUS STEP: 08-temporal_3y.js (produces the 3-year filtered
//                classification this script filters further)
// NEXT STEP:     10-temporal_5y.js
//
// AUTHORS: MapBiomas Argentina — Cuyo team
// ============================================================


// ============================================================
// SECTION 1 — CONFIGURATION PARAMETERS
// ============================================================
// Ojo la versión según parámetros del filtro espacial, y del temporal de
// 3 años. Alternative source versions that were tried, kept as a record:
// var Filter_3years = ee.Image(assetClass + '/CUYO-INTEGRADO-3-1sp-T3y-v2025');    // v. 2025
// var Filter_3years = ee.Image(assetClass + '/CUYO-INTEGRADO-3-1sp-T3y-v2026-a');  // prop 2026a
// var Filter_3years = ee.Image('projects/YOUR-PROJECT/CUYO-INTEGRADO-3-1sp-T3y-v2026-c'); // prop 2026c (different source project)

// even-year pass anchors (looks back 2 years, forward 1 year, from each)
var anosPares = [
    2024, 2022, 2020, 2018, 2016, 2014,
    2012, 2010, 2008, 2006, 2004, 2002,
    2000, 1998, 1996, 1994, 1992, 1990, 1988
];

// odd-year pass anchors
var anosImpares = [
    2023, 2021, 2019, 2017, 2015, 2013,
    2011, 2009, 2007, 2005, 2003, 2001, 1999, 1997, 1995, 1993, 1991, 1989, 1987
];

var allYears = [
    1985, 1986, 1987, 1988, 1989,
    1990, 1991, 1992, 1993, 1994,
    1995, 1996, 1997, 1998, 1999,
    2000, 2001, 2002, 2003, 2004,
    2005, 2006, 2007, 2008, 2009,
    2010, 2011, 2012, 2013, 2014,
    2015, 2016, 2017, 2018, 2019,
    2020, 2021, 2022, 2023, 2024, 2025
];

// Aquí se puede elegir a qué clases se aplica el filtro. El orden no es
// indiferente. Priority orders tried, kept as a record:
// orden 2025: [21,77,45,9,12,11,25,66,4,3,33]
// orden 2026a: [21,45,9,12,11,25,77,66,4,3,33]
// orden 2026b (used below): [25, 21, 9, 11, 12, 4, 3, 77, 45, 66]
// orden 2026c: [77,45,33,25,12,11,9,3,21,66,4]


// ============================================================
// SECTION 3 — INPUT DATA
// ============================================================
// 🔁 REPLACE: Update to your own GEE asset folder for the filtered
// classification output (same folder as script 08's asset).
var assetClass = 'projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-3/GENERAL/CLASSIFICATION/FILTERS/CUYO';

// 🔁 REPLACE: Zones FeatureCollection (Cuyo regions).
var assetRegions = 'projects/YOUR-PROJECT/assets/ANCILLARY_DATA/VECTOR/CUYO/regional-assets_cuyo-argcol2_buffer2km_reg';
var regions = ee.FeatureCollection(assetRegions);

// 🔁 REPLACE: 3-year temporally filtered classification (script 08
// output). prop 2026b — see SECTION 1 for the other versions tried.
var Filter_3years = ee.Image(assetClass + '/CUYO-INTEGRADO-3-1sp-T3y-v2026-b');


// ============================================================
// SECTION 4 — EVEN-YEAR PASS
// ============================================================
var window4yearsPares = function (imagem, classe) {
    var class_final = imagem.select('classification_2025');

    for (var i_ano = 0; i_ano < anosPares.length; i_ano++) {
        var ano = anosPares[i_ano];
        var class_ano = imagem.select('classification_' + (ano));
        var mask_3 = imagem.select('classification_' + (ano + 1)).neq(classe)
            .and(imagem.select('classification_' + (ano)).eq(classe))
            .and(imagem.select('classification_' + (ano - 1)).eq(classe))
            .and(imagem.select('classification_' + (ano - 2)).neq(classe));
        mask_3 = imagem.select('classification_' + (ano - 2))
            .remap([3, 4, 66, 77, 45, 12, 11, 9, 21, 25, 33, 34], [3, 4, 66, 77, 45, 12, 11, 9, 21, 25, 33, 34])
            .updateMask(mask_3);
        var class_corr = class_ano.blend(mask_3.rename('classification_' + (ano)));
        class_final = class_final.addBands(class_corr);
        var class_corr2 = imagem.select('classification_' + (ano - 1)).blend(mask_3.rename('classification_' + (ano - 1)));
        class_final = class_final.addBands(class_corr2);
    }
    // class_final = class_final.addBands(imagem.select('classification_1987')); // REVISAR ESTO!! Incluirlo resulta en el año duplicado
    class_final = class_final.addBands(imagem.select('classification_1986'));
    class_final = class_final.addBands(imagem.select('classification_1985'));
    return class_final;
};

var filtered = window4yearsPares(Filter_3years, 25);
filtered = window4yearsPares(filtered, 21);
filtered = window4yearsPares(filtered, 9);
filtered = window4yearsPares(filtered, 11);
filtered = window4yearsPares(filtered, 12);
filtered = window4yearsPares(filtered, 4);
filtered = window4yearsPares(filtered, 3);
filtered = window4yearsPares(filtered, 77);
filtered = window4yearsPares(filtered, 45);
filtered = window4yearsPares(filtered, 66);


// ============================================================
// SECTION 5 — ODD-YEAR PASS
// ============================================================
var window4yearsImpares = function (imagem, classe) {
    var class_final2 = imagem.select('classification_2025');
    class_final2 = class_final2.addBands(imagem.select('classification_2024'));

    for (var i_ano = 0; i_ano < anosImpares.length; i_ano++) {
        var ano = anosImpares[i_ano];
        var class_ano = imagem.select('classification_' + (ano));
        var mask_3 = imagem.select('classification_' + (ano + 1)).neq(classe)
            .and(imagem.select('classification_' + (ano)).eq(classe))
            .and(imagem.select('classification_' + (ano - 1)).eq(classe))
            .and(imagem.select('classification_' + (ano - 2)).neq(classe));
        mask_3 = imagem.select('classification_' + (ano - 2))
            .remap([3, 4, 66, 77, 45, 12, 11, 9, 21, 25, 33, 34], [3, 4, 66, 77, 45, 12, 11, 9, 21, 25, 33, 34])
            .updateMask(mask_3);
        var class_corr = class_ano.blend(mask_3.rename('classification_' + (ano)));
        class_final2 = class_final2.addBands(class_corr);
        var class_corr2 = imagem.select('classification_' + (ano - 1)).blend(mask_3.rename('classification_' + (ano - 1)));
        class_final2 = class_final2.addBands(class_corr2);
    }
    // class_final2 = class_final2.addBands(imagem.select('classification_1986')); // REVISAR ESTO!! Incluirlo resulta en el año duplicado
    class_final2 = class_final2.addBands(imagem.select('classification_1985'));
    return class_final2;
};

filtered = window4yearsImpares(filtered, 25);
filtered = window4yearsImpares(filtered, 21);
filtered = window4yearsImpares(filtered, 9);
filtered = window4yearsImpares(filtered, 11);
filtered = window4yearsImpares(filtered, 12);
filtered = window4yearsImpares(filtered, 4);
filtered = window4yearsImpares(filtered, 3);
filtered = window4yearsImpares(filtered, 77);
filtered = window4yearsImpares(filtered, 45);
filtered = window4yearsImpares(filtered, 66);


// ============================================================
// SECTION 6 — REASSEMBLE PER-YEAR STACK
// ============================================================
var class_outTotal;

for (var i_ano = 0; i_ano < allYears.length; i_ano++) {
    var ano = allYears[i_ano];

    var filtered_ano = filtered.select('classification_' + ano);
    if (i_ano === 0) { class_outTotal = filtered_ano; }
    else { class_outTotal = class_outTotal.addBands(filtered_ano); }
}


// ============================================================
// SECTION 7 — EXPORT
// ============================================================
Export.image.toAsset({
    "image": class_outTotal,
    "description": 'CUYO-INTEGRADO-3-1sp-T3y-4y-v2026-b',
    // 🔁 REPLACE: Update to your own GEE asset folder (see `assetClass`
    // above).
    "assetId": assetClass + '/CUYO-INTEGRADO-3-1sp-T3y-4y-v2026-b',
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "overwrite": true,
    "region": regions
});
