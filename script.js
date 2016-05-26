fetch("https://raw.githubusercontent.com/frogcat/layers2geojson/master/data.geojson").then(function(res) {
  return res.json();
}).then(function(json) {

  var bbox2bounds = function(bbox) {
    return L.latLngBounds(L.latLng(bbox[1], bbox[0]), L.latLng(bbox[3], bbox[2]));
  };

  var tileOverlay = null;
  var map = L.map("map", {
    maxZoom: 20,
    minZoom: 2
  }).on("click", function() {
    if (tileOverlay != null)
      map.removeLayer(tileOverlay);
  }).fitBounds(bbox2bounds(json.bbox));

  map.attributionControl.addAttribution("<a href='http://maps.gsi.go.jp/development/ichiran.html'>地理院タイル</a>");

  var baseLayers = {
    "標準地図": L.tileLayer("http://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png").addTo(map),
    "写真": L.tileLayer("http://cyberjapandata.gsi.go.jp/xyz/ort/{z}/{x}/{y}.jpg")
  };

  var styles = {
    active: {
      fillColor: '#ff9900',
      weight: '3',
      color: '#663300'
    },
    normal: {
      fillColor: '#330099',
      weight: '2',
      color: '#330099'
    }
  };

  var overlays = {};

  L.geoJson(json, {
    onEachFeature: function(data, layer) {
      layer.setStyle(styles.normal);
      overlays[data.properties.title] = layer;
      layer.on("mousemove", function(event) {
        this.setStyle(styles.active);
        document.getElementById('footer').innerHTML = data.properties.title;
      }).on("mouseout", function(event) {
        this.setStyle(styles.normal);
      }).on("click", function(event) {
        map.fire("click");
        tileOverlay = L.tileLayer(data.properties.seeAlso.url, {
          bounds: bbox2bounds(data.bbox),
          pane: "markerPane",
          opacity: 0.9
        }).addTo(map);
        L.DomEvent.stopPropagation(event);
      });
    }
  }).addTo(map);

  L.control.layers(baseLayers, overlays).addTo(map);

});
