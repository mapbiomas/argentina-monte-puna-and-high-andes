// ============================================================
// Cuyo Collection 3 | Script 11b — Edge-Year Noise Correction (wide window)
// ============================================================
//
// DESCRIPTION:
//   A second, wider-window pass of script 11's edge-year correction, run
//   on script 11's own output. Instead of comparing the edge year to a
//   single neighbor with a connected-patch-size cutoff, this version
//   requires the two years FOLLOWING the edge year (for 1985) or
//   PRECEDING it (for 2025) to agree with each other before treating the
//   edge year as deforestation noise — no patch-size filter is applied
//   here. Only the deforestation check is active; the regeneration check
//   is disabled (see NOTE).
//
// METHODOLOGY:
//   1. Reclass every year to the same "level 0" forest/anthropic map
//      used in script 11 (SECTION 4).
//   2. Last-year check: 2025 is anthropic (10) while both 2024 AND 2023
//      are forest (1) -> flag as noise (no patch-size filter).
//   3. First-year check: 1985 is anthropic (10) while both 1986 AND 1987
//      are forest (1) -> flag as noise.
//   4. Blend the flagged edge years with the correction image and
//      export.
//
// INPUT:
//   - Edge-corrected classification (script 11 output).
//   - Zones FeatureCollection (Cuyo regions) — used only as the export
//     region.
//
// OUTPUT:
//   - Further edge-corrected classification. Exported as
//     `CUYO-FINAL-3-1sp-T3y-4y-5y-v2026-b-1y2Ext`.
//
// NOTE (kept as in the original): in SECTION 6, the 1985 branch blends
// with `ruido_desmat_fin` (the LAST-year correction) instead of
// `ruido_desmat_ini` (the first-year correction computed right above
// it) — appears to be a copy-paste bug, but kept exactly as found. Also,
// the regeneration-noise blocks in SECTIONS 4–5 are commented out in the
// original and reference a `Filter_5years` variable that does not exist
// in this script (it would throw if uncommented as-is) — kept commented
// out, not fixed.
//
// PREVIOUS STEP: 11-primer_ultimo_anios.js (produces the classification
//                this script corrects further)
// NEXT STEP:     12-dominancia.js (see also 11c for the "keep the first
//                stable class regardless of later noise" variant of this
//                same edge-correction step)
//
// AUTHORS: MapBiomas Argentina — Cuyo team
// ============================================================


// ============================================================
// SECTION 1 — CONFIGURATION PARAMETERS
// ============================================================
var anos = [
    1985,
    1986, 1987, 1988, 1989, 1990,
    1991, 1992, 1993, 1994, 1995,
    1996, 1997, 1998, 1999, 2000,
    2001, 2002, 2003, 2004, 2005,
    2006, 2007, 2008, 2009, 2010,
    2011, 2012, 2013, 2014, 2015,
    2016, 2017, 2018, 2019, 2020,
    2021, 2022, 2023, 2024, 2025
];

// LEYENDA C3
// 3     Bosques cerrados
// 4     Bosques abiertos
// 66    Arbustales cerrados
// 77    Arbustales abiertos
// 45    Arbustales dispersas
// 12    Herbaceas
// 11    Vegetación natural no leñosa inudable
// 9     Leñosas cultivadas
// 21    Mosaico de Usos
// 25    Otras áreas sin vegetación
// 33    Ríos, lagunas y lagos
// 34    Hielo y nieve en superficie


// ============================================================
// SECTION 3 — INPUT DATA
// ============================================================
// 🔁 REPLACE: Update to your own GEE asset folder (same folder as script
// 11's `assetClass`).
var assetClass = 'projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-3/GENERAL/CLASSIFICATION/FILTERS/CUYO/';

// 🔁 REPLACE: Zones FeatureCollection (Cuyo regions).
var regions = ee.FeatureCollection('projects/YOUR-PROJECT/assets/ANCILLARY_DATA/VECTOR/CUYO/regional-assets_cuyo-argcol2_buffer2km_reg');

// Carga la clasificación con filtros. prop 2026b — alternative versions
// tried, kept as a record:
// assetClass + 'CUYO-FINAL-3-1sp-T3y-4y-5y-v2025-1Ext'
// assetClass + 'CUYO-FINAL-3-1sp-T3y-4y-5y-v2026-a-1Ext'
// assetClass + 'CUYO-FINAL-3-1sp-T3y-4y-5y-v2026-c-1Ext'
var Filter_1Ext = ee.Image(assetClass + 'CUYO-FINAL-3-1sp-T3y-4y-5y-v2026-b-1Ext');


// ============================================================
// SECTION 4 — BUILD LEVEL-0 (FOREST / ANTHROPIC) MAP PER YEAR
// ============================================================
var class_nivel0;

for (var i_ano = 0; i_ano < anos.length; i_ano++) {
    var ano = anos[i_ano];

    var class_ano = Filter_1Ext.select('classification_' + ano);
    // 27 no deberia estar representado aca pero... lo dejo para no romper nada
    var class_nivel0_ano = class_ano.remap(
        [3, 4, 45, 66, 77, 12, 11, 9, 21, 25, 33, 34, 27],
        [1, 1, 1, 1, 1, 1, 1, 10, 10, 1, 1, 1, 1]
    ).rename('classification_' + ano);

    if (i_ano === 0) { class_nivel0 = class_nivel0_ano; }
    else { class_nivel0 = class_nivel0.addBands(class_nivel0_ano); }
}


// ============================================================
// SECTION 5 — LAST-YEAR (2025) NOISE CORRECTION
// ============================================================
var nivel0_2025 = class_nivel0.select('classification_2025');
var nivel0_2024 = class_nivel0.select('classification_2024');
var nivel0_2023 = class_nivel0.select('classification_2023');

// corrige desmatamentos pequenos no último ano
var desmatFin = nivel0_2025.eq(10).and(nivel0_2024.eq(1)).and(nivel0_2023.eq(1));
var ruido_desmat_fin = Filter_1Ext.select('classification_2024').updateMask(desmatFin);

// corrige REGEN pequenos no último ano — disabled: references a
// `Filter_5years` variable that does not exist in this script.
//var regen = nivel0_2025.eq(1).and(nivel0_2024.eq(10))
//var conectedRegen = regen.selfMask().connectedPixelCount(25,true).reproject('epsg:4326', null, 30);
//var regen1ha = conectedRegen.lte(11)
//var ruido_regen22 = Filter_5years.select('classification_2021').updateMask(regen1ha)


// ============================================================
// SECTION 6 — FIRST-YEAR (1985) NOISE CORRECTION
// ============================================================
var nivel0_1985 = class_nivel0.select('classification_1985');
var nivel0_1986 = class_nivel0.select('classification_1986');
var nivel0_1987 = class_nivel0.select('classification_1987');

// corrige desmatamentos pequenos no primeiro ano
var desmatIni = nivel0_1985.eq(10).and(nivel0_1986.eq(1)).and(nivel0_1987.eq(1));
var ruido_desmat_ini = Filter_1Ext.select('classification_1986').updateMask(desmatIni);

// corrige REGEN pequenos no primeiro ano — disabled: references a
// `Filter_5years` variable that does not exist in this script.
//var regen = nivel0_1985.eq(10).and(nivel0_1986.eq(1))
//var conectedregen = regen.selfMask().connectedPixelCount(30,true).reproject('epsg:4326', null, 30);
//var regen1ha = conectedregen.lte(11)
//var ruido_regen85 = Filter_5years.select('classification_1986').updateMask(regen1ha)


// ============================================================
// SECTION 7 — BLEND EDGE-YEAR CORRECTIONS
// ============================================================
var class_final;

for (var i_ano2 = 0; i_ano2 < anos.length; i_ano2++) {
    var ano2 = anos[i_ano2];

    var class_ano2 = Filter_1Ext.select('classification_' + ano2);
    var class_corr;

    // NOTE (kept as in the original): both branches blend with
    // `ruido_desmat_fin` — the 1985 branch does not use
    // `ruido_desmat_ini`, which is otherwise unused.
    if (ano2 === 1985) { class_corr = class_ano2.blend(ruido_desmat_fin); }
    else if (ano2 === 2025) { class_corr = class_ano2.blend(ruido_desmat_fin); }
    else { class_corr = class_ano2; }

    if (i_ano2 === 0) { class_final = class_corr; }
    else { class_final = class_final.addBands(class_corr); }
}


// ============================================================
// SECTION 8 — EXPORT
// ============================================================
Export.image.toAsset({
    "image": class_final,
    "description": 'CUYO-FINAL-3-1sp-T3y-4y-5y-v2026-b-1y2Ext',
    // 🔁 REPLACE: Update to your own GEE asset folder (see `assetClass`
    // above).
    "assetId": assetClass + 'CUYO-FINAL-3-1sp-T3y-4y-5y-v2026-b-1y2Ext',
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": regions
});
