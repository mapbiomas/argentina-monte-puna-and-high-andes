// ============================================================
// Cuyo Collection 3 | Script 11 — Edge-Year Noise Correction
// ============================================================
//
// DESCRIPTION:
//   The temporal filters (scripts 08–10) rely on neighboring years on
//   both sides of the focal year, so they can't fully correct noise at
//   the series' first (1985) and last (2025) year, which only have
//   neighbors on one side. This script targets exactly those two edge
//   years: it detects small (<=11 connected pixels, ~1 ha) apparent
//   deforestation/regeneration patches between 2025↔2024 and 1985↔1986,
//   and replaces the edge year's pixel with the neighboring year's value
//   wherever the patch is small enough to be considered noise.
//
// METHODOLOGY:
//   1. Reclass every year to a binary "level 0" map: forest/woody
//      classes -> 1, class 9 (leñosas cultivadas) and 21 (mosaico de
//      usos) -> 10, everything else -> 1 (see the remap table — this is
//      a forest-vs-anthropic-signal split, not a full class scheme).
//   2. Last-year noise: pixels that are anthropic (10) in 2025 but
//      forest (1) in 2024 are candidate deforestation noise; pixels
//      whose connected patch is <=11 pixels get 2024's original class
//      value carried into 2025. Same check in reverse for candidate
//      "regeneration" noise (1 in 2025, 10 in 2024).
//   3. First-year noise: the same two checks, applied between 1986 and
//      1985.
//   4. Blend the edge-year corrections into the input classification;
//      all interior years pass through unmodified.
//   5. Export the corrected classification.
//
// INPUT:
//   - 3-year + 4-year + 5-year filtered classification (script 10
//     output).
//   - Zones FeatureCollection (Cuyo regions) — used only as the export
//     region.
//
// OUTPUT:
//   - Edge-corrected classification. Exported as
//     `CUYO-FINAL-3-1sp-T3y-4y-5y-v2026-b-1Ext`.
//
// NOTE (kept as in the original): the remap table in SECTION 4 includes
// class 27 ("not observed", introduced by script 06b's slope/EVI2
// rules) mapped to 1, with a comment noting it "no debería estar
// representado acá pero... lo dejo para no romper nada" (shouldn't be
// present here, but left in so as not to break anything) — kept as
// found.
//
// PREVIOUS STEP: 10-temporal_5y.js (produces the filtered classification
//                this script corrects at its edges)
// NEXT STEP:     12-dominancia.js (see also 11b/11c for alternative,
//                wider-window edge-correction variants of this same
//                step)
//
// AUTHORS: MapBiomas Argentina — Cuyo team
// ============================================================


// ============================================================
// SECTION 1 — CONFIGURATION PARAMETERS
// ============================================================
var version = {
    'output': '2',
};

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
// 10's `assetClass`).
var assetClass = 'projects/YOUR-PROJECT/assets/LAND-COVER/COLLECTION-3/GENERAL/CLASSIFICATION/FILTERS/CUYO/';

// 🔁 REPLACE: Zones FeatureCollection (Cuyo regions).
var regions = ee.FeatureCollection('projects/YOUR-PROJECT/assets/ANCILLARY_DATA/VECTOR/CUYO/regional-assets_cuyo-argcol2_buffer2km_reg');

// Carga la clasificación con filtros espaciales y temporales intermedios.
// prop 2026b — alternative versions tried, kept as a record:
// assetClass + 'CUYO-INTEGRADO-3-1sp-T3y-4y-5y-v2025'
// assetClass + 'CUYO-INTEGRADO-3-1sp-T3y-4y-5y-v2026-a'
// assetClass + 'CUYO-INTEGRADO-3-1sp-T3y-4y-5y-v2026-c'
var Filter_5years = ee.Image(assetClass + 'CUYO-INTEGRADO-3-1sp-T3y-4y-5y-v2026-b');


// ============================================================
// SECTION 4 — BUILD LEVEL-0 (FOREST / ANTHROPIC) MAP PER YEAR
// ============================================================
var class_nivel0;

for (var i_ano = 0; i_ano < anos.length; i_ano++) {
    var ano = anos[i_ano];

    var class_ano = Filter_5years.select('classification_' + ano);
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

// corrige desmatamentos pequenos no último ano - corrige com o anteultimo
var desmatFin = nivel0_2025.eq(10).and(nivel0_2024.eq(1));
var conectedDesmatFin = desmatFin.selfMask().connectedPixelCount(20, true).reproject('epsg:4326', null, 30);
var desmat1haFin = conectedDesmatFin.lte(11);
var ruido_desmat_fin = Filter_5years.select('classification_2024').updateMask(desmat1haFin);

// corrige REGEN pequenos no último ano
var regenFin = nivel0_2025.eq(1).and(nivel0_2024.eq(10));
var conectedRegenFin = regenFin.selfMask().connectedPixelCount(25, true).reproject('epsg:4326', null, 30);
var regen1haFin = conectedRegenFin.lte(11);
var ruido_regen_fin = Filter_5years.select('classification_2024').updateMask(regen1haFin);


// ============================================================
// SECTION 6 — FIRST-YEAR (1985) NOISE CORRECTION
// ============================================================
var nivel0_1985 = class_nivel0.select('classification_1985');
var nivel0_1986 = class_nivel0.select('classification_1986');

// corrige desmatamentos pequenos no primeiro ano
var desmatIni = nivel0_1985.eq(1).and(nivel0_1986.eq(10));
var conectedDesmatIni = desmatIni.selfMask().connectedPixelCount(30, true).reproject('epsg:4326', null, 30);
var desmat1haIni = conectedDesmatIni.lte(11);
var ruido_desmat_ini = Filter_5years.select('classification_1986').updateMask(desmat1haIni);

// corrige REGEN pequenos no primeiro ano
var regenIni = nivel0_1985.eq(10).and(nivel0_1986.eq(1));
var conectedRegenIni = regenIni.selfMask().connectedPixelCount(30, true).reproject('epsg:4326', null, 30);
var regen1haIni = conectedRegenIni.lte(11);
var ruido_regen_ini = Filter_5years.select('classification_1986').updateMask(regen1haIni);


// ============================================================
// SECTION 7 — BLEND EDGE-YEAR CORRECTIONS
// ============================================================
var class_final;

for (var i_ano2 = 0; i_ano2 < anos.length; i_ano2++) {
    var ano2 = anos[i_ano2];

    var class_ano2 = Filter_5years.select('classification_' + ano2);
    var class_corr;

    if (ano2 === 1985) { class_corr = class_ano2.blend(ruido_desmat_ini).blend(ruido_regen_ini); }
    else if (ano2 === 2025) { class_corr = class_ano2.blend(ruido_desmat_fin).blend(ruido_regen_fin); }
    else { class_corr = class_ano2; }

    if (i_ano2 === 0) { class_final = class_corr; }
    else { class_final = class_final.addBands(class_corr); }
}


// ============================================================
// SECTION 8 — EXPORT
// ============================================================
Export.image.toAsset({
    "image": class_final,
    "description": 'CUYO-FINAL-3-1sp-T3y-4y-5y-v2026-b-1Ext',
    // 🔁 REPLACE: Update to your own GEE asset folder (see `assetClass`
    // above).
    "assetId": assetClass + 'CUYO-FINAL-3-1sp-T3y-4y-5y-v2026-b-1Ext',
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "overwrite": true,
    "region": regions
});
