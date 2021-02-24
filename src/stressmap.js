
// lines (layers)
const settings = [{ color: '#08519C', weight: 3, key: 'LTS1', zIndex: 1, title: 'Low Stress (LTS 1)', url: 'data/level_1.json', checked: true},
{ color: '#4292C6', weight: 3, key: 'LTS2', zIndex: 2, title: 'Minor Stress (LTS 2)', url: 'data/level_2.json', checked: true},
{ color: '#F16913', weight: 3, key: 'LTS3', zIndex: 3, title: 'Moderate Stress (LTS 3)', url: 'data/level_3.json', checked: true},
{ color: '#A63603', weight: 3, key: 'LTS4', zIndex: 4, title: 'High Stress (LTS 4)', url: 'data/level_4.json', checked: true}]

var lineWeight = 2
if (!L.Browser.mobile) {
  lineWeight = lineWeight + 1
}
var lineOpacity = 0.6
var lineHighOpacity = 0.9 //highligh opacity

var layerGroup = new L.LayerGroup();
var layers = {};  //dictionary of layers with keys from settings

// Create variable to hold map element, give initial settings to map
var centerCoord = [49.254667, -122.825015]
if (L.Browser.mobile) {
  // increase tolerance for tapping (it was hard to tap on line exactly), zoom out a bit, and remove zoom control
  var myRenderer = L.canvas({ padding: 0.1, tolerance: 5 });
  var map = L.map("map", { center: centerCoord, zoom: 11, renderer: myRenderer, zoomControl: false });
} else {
  var map = L.map("map", { center: centerCoord, zoom: 12 });
}
L.tileLayer(
  'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  subdomains: 'abcd',
  maxZoom: 19
}
).addTo(map);
// Add BikeOttawa attribution
map.attributionControl.addAttribution('<a href="https://github.com/BikeOttawa">BikeOttawa</a>');

addLegend()
// show hide legend
document.getElementById('legendbtn').onclick = function () { toggleDisplay(['legendbtn', 'legend']) };
document.getElementById('closebtn').onclick = function () { toggleDisplay(['legendbtn', 'legend']) };

addStressLayers()

///// Functions ////

// ------ Legend
function addLegend() {
  const legend = L.control({ position: 'topright' })
  legend.onAdd = function (map) {
    const div = L.DomUtil.create('div')
    let legendHtml = '<div id="legendbtn" class="fill-darken2 pad1 icon menu button fr" style="display: none"></div>' +
      '<div id="legend" class="fill-darken1 round" style="display: block">' +
      '<div id="closebtn" class="fill-darken2 pad1 icon close button fr"></div>' +
      '<div class="clearfix"></div>' +
      '<form><fieldset class="checkbox-pill clearfix">'

    legendHtml += '<div class="button quiet col12">Tri-Cities Cycling Traffic Stress</div>'
    for (let setting of settings) {
      legendHtml += addLegendLine(setting)
    }
    legendHtml += '<div class="button quiet col12">Click on map item for more info</div>'

    legendHtml += '</fieldset></form></div>'
    div.innerHTML = legendHtml

    // disable map zoom when double clicking anywhere on legend (checkboxes included)
    div.addEventListener('mouseover', function () { map.doubleClickZoom.disable(); });
    div.addEventListener('mouseout', function () { map.doubleClickZoom.enable(); });
    return div
  }
  legend.addTo(map)
}

function addLegendLine(setting) {
  var spanHtml = '<span style="display:inline-block; width:50px; height:8px; background-color:' + setting.color + '"></span>' +
    '&nbsp;' + setting.title

  checkedHtml = ""
  if (setting.checked) {
    checkedHtml = 'checked'
  }
  var lineHtml = '<input type="checkbox" id="' + setting.key + '" onclick="toggleLayer(this)" ' + checkedHtml + ' >' +
    '<label for="' + setting.key + '" id="' + setting.key + '-label" class="button icon check quiet col12">' +
    '&nbsp;' + spanHtml + ' </label>'

  return lineHtml
}

function toggleDisplay(elementIds) {
  elementIds.forEach(function (elementId) {
    var x = document.getElementById(elementId);
    if (x.style.display === "none") {
      x.style.display = "block";
    } else {
      x.style.display = "none";
    }
  });
}

function toggleLayer(checkbox) { 
  var targetLayer = layers[checkbox.id]
  if (targetLayer != null){
    if (checkbox.checked){
        layerGroup.addLayer(targetLayer);
    }else{
        layerGroup.removeLayer(targetLayer); 
    }
  }
}

// ------ Layers

function addStressLayers() {
  layerGroup.addTo(map);
  for (let setting of settings) {
    var ltsLayer = new L.GeoJSON.AJAX(setting.url, {
      style: getLineStyle(setting.color),
      onEachFeature: onEachFeature,
    });
    ltsLayer.layerID = setting.key;
    // add to global layers dictionary
    layers[setting.key] = ltsLayer
    // add to map if checked
    if (setting.checked){
      layerGroup.addLayer(ltsLayer);
    }
  }
}

// lines style
function getLineStyle(color) {
  var lineStyle = {
    "color": color,
    "weight": lineWeight,
    "opacity": lineOpacity
  };
  return lineStyle
}
function getHighlightStyle(color) {
  var highlighStyle = {
    "color": color,
    "weight": lineWeight + 1,
    "opacity": lineHighOpacity
  };
  return highlighStyle
}

function highlightFeature(e) {
  var layer = e.target;
  var highlightStyle = getHighlightStyle(layer.options.color)
  layer.setStyle(highlightStyle);

  if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
    layer.bringToFront();
  }
}

function resetHighlight(e) {
  var layer = e.target;
  var lineStyle = getLineStyle(layer.options.color)
  layer.setStyle(lineStyle);
}

// add popup and highlight
function onEachFeature(feature, layer) {
  var popupContent = ""
  if (feature.properties) {
    if (feature.properties.id) {
      popupContent +='<b><a href="https://www.openstreetmap.org/' + feature.properties.id + '" target="_blank">' + feature.properties.id + '</a></b><hr>'
      //popupContent += "<b>Id: </b>";
      //popupContent += feature.properties.id;
    }
    if (feature.properties.decisionMsg) {
      popupContent += "<br><b>Decision Msg: </b>";
      popupContent += feature.properties.decisionMsg;
    }
  }
  layer.bindPopup(popupContent);

  // for mobile, use popup functions
  if (L.Browser.mobile) {
    layer.on({
      popupopen: highlightFeature,
      popupclose: resetHighlight,
    });
  } else {
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
    });
  }
}

// function addStressLayerToMapLocal (setting) {

//   var data
//   if (setting.zIndex == 1){
//     data = level1
//   }else if (setting.zIndex == 2){
//     data = level2
//   }else if (setting.zIndex == 3){
//     data = level3
//   }else if (setting.zIndex == 4){
//     data = level4
//   }else{
//     return
//   }

//   const tileIndex = geojsonvt(data, { maxZoom: 18 })
//   tree.load(data)

//   const canvasTiles = L.tileLayer.canvas()
//   canvasTiles.drawTile = function (canvas, tilePoint, zoom) {
//     const tile = tileIndex.getTile(zoom, tilePoint.x, tilePoint.y)
//     if (!tile) { return }
//     //drawFeatures(canvas.getContext('2d'), tile.features, '#0099cc', 3)
//     drawFeatures(canvas.getContext('2d'), tile.features, setting.color, setting.weight)
//   }
//   canvasTiles.addTo(map)
//   //layers['LTS1'] = canvasTiles
//   layers[setting.key] = canvasTiles
// }


// function addStressLayerToMap (setting) {
//   const xhr = new XMLHttpRequest()
//   xhr.open('GET', setting.url)
//   xhr.setRequestHeader('Content-Type', 'application/json')
//   xhr.onload = function () {
//     if (xhr.status === 200) {
//       const data = JSON.parse(xhr.responseText)
//       const tileIndex = geojsonvt(data, { maxZoom: 18 })
//       tree.load(data)

//       const canvasTiles = L.tileLayer.canvas()
//       canvasTiles.drawTile = function (canvas, tilePoint, zoom) {
//         const tile = tileIndex.getTile(zoom, tilePoint.x, tilePoint.y)
//         if (!tile) { return }
//         drawFeatures(canvas.getContext('2d'), tile.features, setting.color, setting.weight)
//       }
//       canvasTiles.addTo(map)
//       layers[setting.key] = canvasTiles
//     } else {
//       alert('Request failed.  Returned status of ' + xhr.status)
//     }
//   }
//   xhr.send()
// }

// function drawFeatures (ctx, features, lineColor, weight) {
//   ctx.strokeStyle = lineColor
//   ctx.lineWidth = weight

//   for (let feature of features) {
//     const type = feature.type
//     ctx.fillStyle = feature.tags.color ? feature.tags.color : 'rgba(255,0,0,0.05)'
//     ctx.beginPath()
//     for (let geom of feature.geometry) {
//       const pad = 1
//       const ratio = .1
//       if (type === 1) {
//         ctx.arc(geom[0] * ratio + pad, geom[1] * ratio + pad, 2, 0, 2 * Math.PI, false)
//         continue
//       }
//       for (var k = 0; k < geom.length; k++) {
//         var p = geom[k]
//         var extent = 4096
//         var x = p[0] / extent * 256
//         var y = p[1] / extent * 256
//         if (k) {
//           ctx.lineTo(x + pad, y + pad)
//         } else {
//           ctx.moveTo(x + pad, y + pad)
//         }
//       }
//     }
//     if (type === 3 || type === 1) ctx.fill('evenodd')
//     ctx.stroke()
//   }
// }

// function toggleLayer (checkbox) {
//   if (checkbox.checked) {
//     map.addLayer(layers[checkbox.id])
//   } else {
//     map.removeLayer(layers[checkbox.id])
//   }
// }

// function addLegendLine (setting) {
//   return ('<tr><td><input type="checkbox" id="' +
//     setting.key +
//     '" onclick="toggleLayer(this)" checked /></td>' +
//     '<td><hr style="display:inline-block; width: 50px;" color="' +
//     setting.color +
//     '" size="5" /></td><td>' +
//     setting.title +
//     '</td></tr>'
//   )
// }

// function getFeaturesNearby(point, maxMeters, breakOnFirst)
// {
//   ret = [];
//   const pt = turf.helpers.point(point);
//   const nearby = tree.search(pt);
//   for(let feature of nearby.features){
//     if(breakOnFirst && ret.length){return ret;}
//     const line = turf.helpers.lineString(feature.geometry.coordinates);
//     if(turf.pointToLineDistance(pt, line, {units: 'meters'})<maxMeters){
//       ret.push(feature);
//     }
//   }

//   return ret;
// }

// function displayOsmElementInfo(element, latlng, decisionMsg) {

//   const xhr = new XMLHttpRequest()
//   xhr.open('GET','https://api.openstreetmap.org/api/0.6/'+element)
//   xhr.onload = function () {
//     let popup = '<b><a href="https://www.openstreetmap.org/' + element + '" target="_blank">' + element + '</a></b><hr>'
//     if (xhr.status === 200) {
//       const xmlDOM = new DOMParser().parseFromString(xhr.responseText, 'text/xml');
//       const tags = xmlDOM.getElementsByTagName("tag");
//       for(let i=0; i<tags.length; i++)
//       {
//         popup += tags[i].attributes["k"].value+": <b>"+tags[i].attributes["v"].value+'</b><br>';
//       }
//       popup += decisionMsg+'<br>';
//     } else {
//       popup += 'Failed to request details from osm.org';
//     }
//     map.openPopup(popup, latlng);
//   }
//   xhr.send()
// }


// let highlight;
// let timer;
// map.on('mousemove', function(e) {
//   const features = getFeaturesNearby([e.latlng.lng,e.latlng.lat], 5, true)
//   clearTimeout(timer);
//   if (features.length!=0) {
//     document.getElementById('mapid').style.cursor = 'pointer'
//   }
//   else {
//     timer = setTimeout(function()
//                 {
// 	                 document.getElementById('mapid').style.cursor = ''
//                  }, 100);
//   }
// })

// map.on('click', function(e) {
//   if (highlight){
//     map.removeLayer(highlight)
//   }
//   const features = getFeaturesNearby([e.latlng.lng,e.latlng.lat], 5, true);
//   if (features.length!=0) {
//     //displayOsmElementInfo(features[0].id, e.latlng);
//     // dragana rad
//     displayOsmElementInfo(features[0].properties.id, e.latlng, features[0].properties.decisionMsg);
//     highlight = new L.geoJson(features[0],{style: {color:'#df42f4',  weight: 5}}).addTo(map);
//     map.on('popupclose', function() {
//      map.removeLayer(highlight)
//    });
//   }
//  });
