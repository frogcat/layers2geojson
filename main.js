"use strict";
var fetch = require("node-fetch");
var turf = require("turf");
var fs = require("fs");
var flat = a => Array.prototype.concat.apply([a], (a.layers || a.entries || []).map(flat));

var map = {};
fs.readFileSync("linkset.txt", "UTF-8").split("\n").forEach(a => {
  if (a.match(/(.*),(.*)/))
    map[RegExp.$1] = RegExp.$2;
});

fetch("http://maps.gsi.go.jp/layers_txt/layers4.txt").then(res => res.json())
  .then(layers => {
    var promises = flat(layers)
      .filter(layer => layer.id && map[layer.id])
      .map(layer => fetch(layer.url.replace("{z}/{x}/{y}", "2/3/1"))
        .then(res => res.json())
        .then(json => {
          var geojson = turf.concave(json, 50, 'kilometers');
          geojson.properties.title = layer.title;
          geojson.properties.url = layer.url;
          flat(layers).forEach(a => {
            if (map[layer.id] == a.id)
              geojson.properties.seeAlso = a;
          });
          geojson.bbox = turf.extent(geojson);
          return geojson;
        })
        .catch(e => {
          console.error(e);
        }));
    Promise.all(promises)
      .then(a => {
        a.sort((b, c) => turf.area(c) - turf.area(b));
        var fc = turf.featurecollection(a);
        fc.bbox = turf.extent(fc);
        console.log(JSON.stringify(fc, null, "  "));
      })
      .catch(e => {
        console.error(e);
      });

  });
