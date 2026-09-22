// ============================================================
// Cuyo Collection 3 | Script 10 — Temporal Filter (5-year window)
// ============================================================
//
// DESCRIPTION:
//   Third temporal-filter pass on top of script 09's 4-year filter
//   output: removes 3-year "step" noise (a class change that reverts
//   three years later) using an even wider window, per class, in a
//   fixed priority order. Runs in three separate passes (anchor years
//   spaced 3 years apart, offset by 0/1/2) because the window logic
//   looks 3 years back and 1 year forward from each anchor year, and
//   three interleaved passes are needed to cover every year without the
//   windows of consecutive corrections overlapping within a pass.
//
// METHODOLOGY:
//   1. `window5years` (pass 1, anchors ending in ...2023, 2020, 2017...):
//      for each anchor year, if `year+1` differs from the target class,
//      `year`, `year-1` and `year-2` all equal it, and `year-3` differs
//      from it, treat `year`, `year-1` and `year-2` as noise and replace
//      all three with `year-3`'s class.
//   2. Apply that rule for each class in a fixed priority order (25, 21,
//      9, 11, 12, 4, 3, 77, 45, 66).
//   3. `window5years` is redefined twice more for pass 2 (anchors
//      ...2022, 2019, 2016...) and pass 3 (anchors ...2024, 2021,
//      2018...), each run on the previous pass's output, same class
//      order.
//   4. Reassemble a single band per year (1985–2025) and export.
//
// INPUT:
//   - 4-year temporally filtered classification (script 09 output).
//   - Zones FeatureCollection (Cuyo regions) — used only as the export
//     region.
//
// OUTPUT:
//   - 3-year + 4-year + 5-year filtered classification (the final
//     filtered product of the Cuyo pipeline). Exported as
//     `CUYO-INTEGRADO-3-1sp-T3y-4y-5y-v2026-b`.
//
// PREVIOUS STEP: 09-temporal_4y.js (produces the 4-year filtered
//                classification this script filters further)
// NEXT STEP:     11-primer_ultimo_anios.js / 11b / 11c (first/last-year
//                and dominance-based products derived from this final
//                filtered classification), 12-dominancia.js,
//                13-remaps2.js, 14-spatial_filter_final.js
//
// AUTHORS: MapBiomas Argentina — Cuyo team
// ============================================================


// ============================================================
// SECTION 1 — CONFIGURATION PARAMETERS
// ============================================================
// Ojo la versión según parámetros del filtro espacial, y de los
// temporales de 3 y 4 años. Alternative source versions tried, kept as a
// record:
// var Filter_4years = ee.Image(assetClass + '/CUYO-INTEGRADO-3-1sp-T3y-4y-v2025');   // v. 2025
// var Filter_4years = ee.Image(assetClass + '/CUYO-INTEGRADO-3-1sp-T3y-4y-v2026-a'); // prop 2026a
// var Filter_4years = ee.Image(assetClass + '/CUYO-INTEGRADO-3-1sp-T3y-4y-v2026-c'); // prop 2026c

var anosPass1 = [2023, 2020, 2017, 2014, 2011, 2008, 2005, 2002, 1999, 1996, 1993, 1990];
var anosPass2 = [2022, 2019, 2016, 2013, 2010, 2007, 2004, 2001, 1998, 1995, 1992, 1989];
var anosPass3 = [2024, 2021, 2018, 2015, 2012, 2009, 2006, 2003, 2000, 1997, 1994, 1991, 1988];

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
// orden 2026b (used below): [25, 33, 21, 9, 11, 12, 4, 3, 77, 45, 66]
// orden 2026c: [77,45,33,25,12,11,9,3,21,66,4]


// ============================================================
// SECTION 3 — INPUT DATA
// ============================================================
// 🔁 REPLACE: Update to your own GEE asset folder for the filtered
// classification output (same folder as script 09's asset).
var assetClass = 'projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-3/GENERAL/CLASSIFICATION/FILTERS/CUYO';

// 🔁 REPLACE: Zones FeatureCollection (Cuyo regions).
var assetRegions = 'projects/YOUR-PROJECT/assets/ANCILLARY_DATA/VECTOR/CUYO/regional-assets_cuyo-argcol2_buffer2km_reg';
var regions = ee.FeatureCollection(assetRegions);

// 🔁 REPLACE: 4-year temporally filtered classification (script 09
// output). prop 2026b — see SECTION 1 for the other versions tried.
var Filter_4years = ee.Image(assetClass + '/CUYO-INTEGRADO-3-1sp-T3y-4y-v2026-b');


// ============================================================
// SECTION 4 — PASS 1
// ============================================================
var window5yearsPass1 = function (imagem, classe) {
    var class_final = imagem.select('classification_2025');
    class_final = class_final.addBands(imagem.select('classification_2024'));

    for (var i_ano = 0; i_ano < anosPass1.length; i_ano++) {
        var ano = anosPass1[i_ano];
        var class_ano = imagem.select('classification_' + ano);
        var mask_3 = imagem.select('classification_' + (ano + 1)).neq(classe)
            .and(imagem.select('classification_' + (ano)).eq(classe))
            .and(imagem.select('classification_' + (ano - 1)).eq(classe))
            .and(imagem.select('classification_' + (ano - 2)).eq(classe))
            .and(imagem.select('classification_' + (ano - 3)).neq(classe));
        mask_3 = imagem.select('classification_' + (ano - 3))
            .remap([3, 4, 66, 77, 45, 12, 11, 9, 21, 25], [3, 4, 66, 77, 45, 12, 11, 9, 21, 25])
            .updateMask(mask_3);
        var class_corr = class_ano.blend(mask_3.rename('classification_' + ano));
        class_final = class_final.addBands(class_corr);
        var class_corr2 = imagem.select('classification_' + (ano - 1)).blend(mask_3.rename('classification_' + (ano - 1)));
        class_final = class_final.addBands(class_corr2);
        var class_corr3 = imagem.select('classification_' + (ano - 2)).blend(mask_3.rename('classification_' + (ano - 2)));
        class_final = class_final.addBands(class_corr3);
    }
    class_final = class_final.addBands(imagem.select('classification_1987'));
    class_final = class_final.addBands(imagem.select('classification_1986'));
    class_final = class_final.addBands(imagem.select('classification_1985'));
    return class_final;
};

var filtered = window5yearsPass1(Filter_4years, 25);
filtered = window5yearsPass1(filtered, 21);
filtered = window5yearsPass1(filtered, 9);
filtered = window5yearsPass1(filtered, 11);
filtered = window5yearsPass1(filtered, 12);
filtered = window5yearsPass1(filtered, 4);
filtered = window5yearsPass1(filtered, 3);
filtered = window5yearsPass1(filtered, 77);
filtered = window5yearsPass1(filtered, 45);
filtered = window5yearsPass1(filtered, 66);


// ============================================================
// SECTION 5 — PASS 2
// ============================================================
var window5yearsPass2 = function (imagem, classe) {
    var class_final2 = imagem.select('classification_2025');
    class_final2 = class_final2.addBands(imagem.select('classification_2024'));
    class_final2 = class_final2.addBands(imagem.select('classification_2023'));

    for (var i_ano = 0; i_ano < anosPass2.length; i_ano++) {
        var ano = anosPass2[i_ano];
        var class_ano = imagem.select('classification_' + ano);
        var mask_3 = imagem.select('classification_' + (ano + 1)).neq(classe)
            .and(imagem.select('classification_' + (ano)).eq(classe))
            .and(imagem.select('classification_' + (ano - 1)).eq(classe))
            .and(imagem.select('classification_' + (ano - 2)).eq(classe))
            .and(imagem.select('classification_' + (ano - 3)).neq(classe));
        // aplico solo a mis clases de interés
        mask_3 = imagem.select('classification_' + (ano - 3))
            .remap([3, 4, 66, 77, 45, 12, 11, 9, 21, 25], [3, 4, 66, 77, 45, 12, 11, 9, 21, 25])
            .updateMask(mask_3);
        var class_corr = class_ano.blend(mask_3.rename('classification_' + ano));
        class_final2 = class_final2.addBands(class_corr);
        var class_corr2 = imagem.select('classification_' + (ano - 1)).blend(mask_3.rename('classification_' + (ano - 1)));
        class_final2 = class_final2.addBands(class_corr2);
        var class_corr3 = imagem.select('classification_' + (ano - 2)).blend(mask_3.rename('classification_' + (ano - 2)));
        class_final2 = class_final2.addBands(class_corr3);
    }
    class_final2 = class_final2.addBands(imagem.select('classification_1986'));
    class_final2 = class_final2.addBands(imagem.select('classification_1985'));
    return class_final2;
};

filtered = window5yearsPass2(filtered, 25);
filtered = window5yearsPass2(filtered, 21);
filtered = window5yearsPass2(filtered, 9);
filtered = window5yearsPass2(filtered, 11);
filtered = window5yearsPass2(filtered, 12);
filtered = window5yearsPass2(filtered, 4);
filtered = window5yearsPass2(filtered, 3);
filtered = window5yearsPass2(filtered, 77);
filtered = window5yearsPass2(filtered, 45);
filtered = window5yearsPass2(filtered, 66);


// ============================================================
// SECTION 6 — PASS 3
// ============================================================
var window5yearsPass3 = function (imagem, classe) {
    var class_final3 = imagem.select('classification_2025');

    for (var i_ano = 0; i_ano < anosPass3.length; i_ano++) {
        var ano = anosPass3[i_ano];
        var class_ano = imagem.select('classification_' + ano);
        var mask_3 = imagem.select('classification_' + (ano + 1)).neq(classe)
            .and(imagem.select('classification_' + (ano)).eq(classe))
            .and(imagem.select('classification_' + (ano - 1)).eq(classe))
            .and(imagem.select('classification_' + (ano - 2)).eq(classe))
            .and(imagem.select('classification_' + (ano - 3)).neq(classe));
        mask_3 = imagem.select('classification_' + (ano - 3))
            .remap([3, 4, 66, 77, 45, 12, 11, 9, 21, 25, 33, 34], [3, 4, 66, 77, 45, 12, 11, 9, 21, 25, 33, 34])
            .updateMask(mask_3);
        var class_corr = class_ano.blend(mask_3.rename('classification_' + ano));
        class_final3 = class_final3.addBands(class_corr);
        var class_corr2 = imagem.select('classification_' + (ano - 1)).blend(mask_3.rename('classification_' + (ano - 1)));
        class_final3 = class_final3.addBands(class_corr2);
        var class_corr3 = imagem.select('classification_' + (ano - 2)).blend(mask_3.rename('classification_' + (ano - 2)));
        class_final3 = class_final3.addBands(class_corr3);
    }
    class_final3 = class_final3.addBands(imagem.select('classification_1985'));
    return class_final3;
};

filtered = window5yearsPass3(filtered, 25);
filtered = window5yearsPass3(filtered, 21);
filtered = window5yearsPass3(filtered, 9);
filtered = window5yearsPass3(filtered, 11);
filtered = window5yearsPass3(filtered, 12);
filtered = window5yearsPass3(filtered, 4);
filtered = window5yearsPass3(filtered, 3);
filtered = window5yearsPass3(filtered, 77);
filtered = window5yearsPass3(filtered, 45);
filtered = window5yearsPass3(filtered, 66);


// ============================================================
// SECTION 7 — REASSEMBLE PER-YEAR STACK
// ============================================================
var class_outTotal;

for (var i_ano = 0; i_ano < allYears.length; i_ano++) {
    var ano = allYears[i_ano];

    var filtered_ano = filtered.select('classification_' + ano);
    if (i_ano === 0) { class_outTotal = filtered_ano; }
    else { class_outTotal = class_outTotal.addBands(filtered_ano); }
}


// ============================================================
// SECTION 8 — EXPORT
// ============================================================
Export.image.toAsset({
    "image": class_outTotal,
    "description": 'CUYO-INTEGRADO-3-1sp-T3y-4y-5y-v2026-b',
    // 🔁 REPLACE: Update to your own GEE asset folder (see `assetClass`
    // above).
    "assetId": assetClass + '/CUYO-INTEGRADO-3-1sp-T3y-4y-5y-v2026-b',
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "overwrite": true,
    "region": regions
});
