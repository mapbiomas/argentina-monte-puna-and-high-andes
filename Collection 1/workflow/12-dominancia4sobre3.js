
var palettes = require('users/mapbiomas/modules:Palettes.js');
var mapbiomasPalette = palettes.get('classification7');

//
var visClass = {
    'min': 0,
    'max': 62,
    'palette': mapbiomasPalette,
    'format': 'png'
};

var class4 = ee.Image('projects/mapbiomas-argentina/assets/COLLECTION1/CLASSIFICATION/FINAL_CLASSIFICATION/CUYO/CUYO-FINAL-3-1Sp-Tf3y4y5y-1y2y3Ext')
print(class4)

var regions = ee.FeatureCollection('projects/mapbiomas-argentina/assets/ANCILLARY_DATA/VECTOR/CUYO/Cuyo_regiones')

var reg_union = regions.union()
var blank = ee.Image(0).mask(0);
var outline = blank.paint(reg_union, 'AA0000', 2); 
var visPar = {'palette':'000000','opacity': 0.6};
Map.addLayer(outline, visPar, "Atlantic Forest", true);

var filtrofreq2 = function(mapbiomas){
  ////////Calculando frequencias
  //////////////////////

  // General rule
  var exp = '100*((b(0)+b(1)+b(2)+b(3)+b(4)+b(5)+b(6)+b(7)+b(8)+b(9)+b(10)+b(11)+b(12)+b(13)+b(14)+b(15)' +
      '+b(16)+b(17)+b(18)+b(19)+b(20)+b(21)+b(22)+b(23)+b(24)+b(25)+b(26)+b(27)+b(28)+b(29)+b(30)+b(31)+b(32)+b(33)' +
      '+b(34)+b(35)+b(36)+b(37))/38)';
  
  // get frequency
var cerrFreq = mapbiomas.eq(3).expression(exp);
var abFreq = mapbiomas.eq(4).expression(exp);

var saida = cerrFreq.addBands(abFreq)
saida  = saida.select(['constant','constant_1'],['cerrFreq','abFreq'])
return saida;

}

var saida = filtrofreq2(class4)

print(class4)
print(saida)

Map.addLayer(saida.select('cerrFreq').selfMask(), {}, 'cerrFreq');
Map.addLayer(saida.select('abFreq').selfMask(), {}, 'abFreq');

   
var mask1 = saida.select('cerrFreq').gt(0)
            .or(saida.select('abFreq').gt(0))
            
Map.addLayer(mask1.selfMask(),{}, 'Mascara1');

var constant = ee.Image.constant(0).clip(reg_union)
var dom = constant.where(saida.select('cerrFreq').gt(saida.select('abFreq')),3)
                  .where(saida.select('abFreq').gte(saida.select('cerrFreq')),4)

var filtrodominancia = function(image) {
  var x = image.where(image.eq(4).or(image.eq(3)),dom)
  return x
}

var years = [1985, 1986, 1987, 
    1988, 1989, 1990, 1991, 
    1992, 1993, 1994, 1995, 
    1996, 1997, 1998, 1999,
    2000, 2001, 2002, 2003, 
    2004, 2005, 2006, 2007, 
    2008, 2009, 2010, 2011, 
    2012, 2013, 2014, 2015, 
    2016, 2017, 2018, 2019,
    2020,2021,2022]


var aplicarFuncionBandas = function(imagem){
   var img_out = constant
   for (var i_ano=0;i_ano<years.length; i_ano++){  
     var ano = years[i_ano];   
     img_out = img_out.addBands(filtrodominancia(imagem.select("classification_"+ano)))}
   return img_out
}


var coleccionReclass = aplicarFuncionBandas(class4)
var imgfilterdom = coleccionReclass.select(1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,
                                24,25,26,27,28,29,30,31,32,33,34,35,36,37,38)

print(class4, "original")
Map.addLayer(class4.select(37), visClass, 'original_2022');

print(imgfilterdom, "imgfilterdom")
Map.addLayer(imgfilterdom.select(37), visClass, 'filtered_2022');



var assetClass = 'projects/mapbiomas-argentina/assets/COLLECTION1/CLASSIFICATION/FINAL_CLASSIFICATION/CUYO/';

Export.image.toAsset({
    "image": imgfilterdom,
    "description": 'CUYO-FINAL-3-1Sp-Tf3y4y5y-1y2y3Ext-dom' ,
    "assetId": assetClass + 'CUYO-FINAL-3-1Sp-Tf3y4y5y-1y2y3Ext-dom' ,
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": regions
});