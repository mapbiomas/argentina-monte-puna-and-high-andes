// ============================================================
// Cuyo Collection 3 | Script 08 — Temporal Filter (3-year window)
// ============================================================
//
// DESCRIPTION:
//   Removes single-year temporal noise ("sandwich" patterns, where one
//   year's class differs from both its immediate neighbors) from the
//   spatially filtered classification (script 07 output), applying two
//   complementary 3/5-year-window rules per class, in a configurable
//   class-priority order.
//
// METHODOLOGY:
//   1. `window3years_b`: for each year (except the series' edges), looks
//      at a 5-year window centered on that year; if the year's class
//      differs from both neighbors AND the neighbors differ from each
//      other, replaces it with the mode class of the 5-year window
//      (restricted to `classes_remap`).
//   2. `window3years`: a stricter, narrower 3-year rule — replaces the
//      focal year with the *previous* year's class when the pattern is
//      exactly "class - other - class" (or the water-specific
//      "33 - other - 33" pattern). Water (33) uses a slightly different
//      rule (see the code) because it's deliberately absent from
//      `classes_remap`, so it's never introduced as new data by the
//      other rule.
//   3. `aplicarFiltro`: runs both rules, per class, in the order given
//      by a class-priority list (`jerarquia_*`) — later classes in the
//      list can override corrections made for earlier ones.
//   4. Only one priority order (`jerarquia_p2`) is actually run and
//      exported in this saved version; the others are kept as documented
//      alternatives that were tried (see SECTION 1).
//   5. Export the filtered result.
//
// INPUT:
//   - Spatially filtered classification (script 07 output).
//   - Zones FeatureCollection (Cuyo regions) — used only as the export
//     region.
//
// OUTPUT:
//   - Temporally filtered classification (3-year pass). Exported as
//     `CUYO-INTEGRADO-3-1sp-T3y-v2026-b`.
//
// NOTE (kept as in the original): class 33 (water) is deliberately
// absent from `classes_remap` (SECTION 1) so that the mode-based rule
// never introduces new water pixels — only the narrower `window3years`
// rule (with its own water-specific pattern) can correct water noise.
//
// PREVIOUS STEP: 07-spatial_filter.js (produces the spatially filtered
//                classification this script temporally filters)
// NEXT STEP:     09-temporal_4y.js
//
// AUTHORS: MapBiomas Argentina — Cuyo team
// ============================================================


// ============================================================
// SECTION 1 — CONFIGURATION PARAMETERS
// ============================================================
var year = 2010;

var years = [
          1986, 1987, 1988, 1989,
    1990, 1991, 1992, 1993, 1994,
    1995, 1996, 1997, 1998, 1999,
    2000, 2001, 2002, 2003, 2004,
    2005, 2006, 2007, 2008, 2009,
    2010, 2011, 2012, 2013, 2014,
    2015, 2016, 2017, 2018, 2019,
    2020, 2021, 2022, 2023, 2024
];

// Class-priority orders tried for this filter pass — only `jerarquia_p2`
// is actually applied below (SECTION 5); the others are kept as a record
// of the alternatives evaluated.
var jerarquia_orig = [21, 77, 45, 9, 12, 11, 25, 66, 4, 3, 33]; // original de 2025
var jerarquia_p1 = [21, 45, 9, 12, 11, 25, 77, 66, 4, 3, 33];   // propuesta 1
var jerarquia_p2 = [25, 33, 21, 9, 11, 12, 4, 3, 77, 45, 66];   // propuesta 2, primero las que no pueden ocurrir solo un año
var jerarquia_p3 = [77, 45, 33, 25, 12, 11, 9, 3, 21, 66, 4];   // prop 3, primero las que tienen mas ruidos

// en la configuracion original, 33 esta ausente (para que no se agregue
// un dato de agua)...
var classes_remap = [3, 4, 66, 77, 45, 12, 11, 9, 21, 25, 34];


// ============================================================
// SECTION 3 — INPUT DATA
// ============================================================
// 🔁 REPLACE: Spatially filtered classification (script 07 output).
var classif = ee.Image('projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-3/GENERAL/CLASSIFICATION/FILTERS/CUYO/CUYO-INTEGRADO-3-1Sp');
var img = ee.Image(classif);

// 🔁 REPLACE: Zones FeatureCollection (Cuyo regions).
var assetRegions = 'projects/YOUR-PROJECT/assets/ANCILLARY_DATA/VECTOR/CUYO/regional-assets_cuyo-argcol2_buffer2km_reg';
var regions = ee.FeatureCollection(assetRegions);


// ============================================================
// SECTION 4 — TEMPORAL FILTER FUNCTIONS
// ============================================================
// masks the non-"sandwich" pixels so they get unmasked again by the next
// function, which handles the non-sandwich (wider window) cases
var window3years = function (imagem, clase, anos, clases_relleno) {

    var class_final = imagem.select('classification_1985');

    for (var i = 0; i < anos.length; i++) {
        var ano = anos[i];

        var class_ant = imagem.select('classification_' + (ano - 1));
        var class_ano = imagem.select('classification_' + (ano));
        var class_sig = imagem.select('classification_' + (ano + 1));

        var mascara;

        if (clase === 33) {
            // AGUA: ruido cuando los extremos son agua y el centro no lo es
            // Patrón: 33 - X - 33  ->  33 - 33 - 33
            mascara = class_sig.eq(33)
                .and(class_ano.neq(33))
                .and(class_ant.eq(33));
            mascara = class_ant.updateMask(mascara);

        } else {
            // aca solo resolvemos los casos sanguche
            var mascara1 = class_sig.neq(clase)
                .and(class_ano.eq(clase))
                .and(class_ant.neq(clase));
                // .and(class_ant.eq(class_sig))

            mascara = class_ant.remap(clases_relleno, clases_relleno)
                .updateMask(mascara1);
        }

        // Aplicar corrección: reemplazar el año focal con el valor del año anterior
        var band_corr = class_ano.blend(mascara.rename('classification_' + (ano)));
        class_final = class_final.addBands(band_corr);
    }

    // Agregar el último año sin modificar
    class_final = class_final.addBands([
        imagem.select('classification_2025')
    ]);

    return class_final;
};

var window3years_b = function (imagem, clase, anos, clases_relleno) {

    var class_final = imagem.select('classification_1985')
        .addBands(imagem.select('classification_1986'));

    for (var i = 0; i < anos.length; i++) {
        var ano = anos[i];

        var class_ant = imagem.select('classification_' + (ano - 1));
        var class_ano = imagem.select('classification_' + (ano));
        var class_sig = imagem.select('classification_' + (ano + 1));

        var mascara2 = class_sig.neq(clase)
            .and(class_ano.eq(clase))
            .and(class_ant.neq(clase))
            .and(class_ant.neq(class_sig));

        var mascara = ee.ImageCollection([
            imagem.select('classification_' + (ano - 2)).rename('class'),
            imagem.select('classification_' + (ano - 1)).rename('class'),
            imagem.select('classification_' + (ano)).rename('class'),
            imagem.select('classification_' + (ano + 1)).rename('class'),
            imagem.select('classification_' + (ano + 2)).rename('class'),
        ])
            .mode()
            .remap(clases_relleno, clases_relleno)
            .updateMask(mascara2);

        // Aplicar corrección: reemplazar el año focal con el valor del año anterior
        var band_corr = class_ano.blend(mascara.rename('classification_' + (ano)));

        // aca queremos quedarnos solo con los valores corregidos, el blend se aplica por fuera
        class_final = class_final.addBands(band_corr);
    }

    // Agregar el último año sin modificar
    class_final = class_final.addBands([
        imagem.select('classification_2024'),
        imagem.select('classification_2025')
    ]);

    return class_final;
};

var aplicarFiltro = function (imagen_entrada, orden, anos, clases_relleno) {
    var resultado = imagen_entrada;

    for (var i = 0; i < orden.length; i++) {
        resultado = window3years_b(resultado, orden[i], anos.slice(1, anos.length - 1), clases_relleno);
        resultado = window3years(resultado, orden[i], anos, clases_relleno);
        // secuencial o que los dos corran sobre la imagen original y luego los blendeamos??
    }

    return resultado;
};


// ============================================================
// SECTION 5 — APPLY FILTER
// ============================================================
// Only the p2 priority order is applied in this saved run — see
// SECTION 1 for the other orders that were tried.
var img_filtrada_p2 = aplicarFiltro(img, jerarquia_p2, years, classes_remap);


// ============================================================
// SECTION 6 — EXPORT
// ============================================================
Export.image.toAsset({
    "image": img_filtrada_p2,
    "description": 'CUYO-INTEGRADO-3-1sp-T3y-v2026-b',
    // 🔁 REPLACE: Update to your own GEE asset folder (same folder as
    // script 07's `assetClass`).
    "assetId": 'projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-3/GENERAL/CLASSIFICATION/FILTERS/CUYO/CUYO-INTEGRADO-3-1sp-T3y-v2026-b',
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": regions,
    "overwrite": true
});
