var DocumentShow = function () {

    this.init = function () {
        this.geo_common = new GeoCommon();
        mapboxgl.accessToken = config.mapbox_token;
        this.geo_min_max = this.geo_common.get_multi_minmax(config.geojson);
        this.map = new mapboxgl.Map({
            container: 'paper-map',
            style: 'mapbox://styles/politik-bei-uns/cj7u916u61yey2rmwwl1wh1ik',
            center: this.geo_common.get_minmax_center(),
            zoom: 6
        });
        this.map.addControl(new mapboxgl.NavigationControl(), 'top-left');

        this.map.on('load', function () {
            modules.document_show.init_map_data();
        });
    };

    this.init_map_data = function () {
        this.map.addSource('data-source', {
            type: 'geojson',
            data: config.geojson
        });
        this.map.addLayer({
            id: 'data-layer-line-string',
            type: 'line',
            source: 'data-source',
            filter: ["==", "$type", "LineString"],
            paint: {
                "line-color": "#428238",
                "line-width": 5,
                "line-opacity": 0.5
            }
        }, 200);
        this.map.addLayer({
            id: 'data-layer-polygon',
            type: 'fill',
            source: 'data-source',
            filter: ["==", "$type", "Polygon"],
            paint: {
                'fill-color': '#428238',
                'fill-opacity': 0.5,
                'fill-outline-color': '#428238'
            }
        }, 200);
        this.map.addLayer({
            id: 'data-layer-point',
            type: 'circle',
            source: 'data-source',
            filter: ["==", "$type", "Point"],
            paint: {
                'circle-radius': 7,
                'circle-color': '#428238'
            }
        }, 200);
        this.map.addLayer({
            id: 'data-layer-texts',
            type: 'symbol',
            source: 'data-source',
            layout: {
                'text-field': '{name} {number}',
                'text-offset': [0, 1.3],
                'text-size': 16
            },
            paint: {
                'text-color': '#8DAA0B'
            }
        }, 200);
        this.map.fitBounds([[
            this.geo_common.geo_min_max.lon.min,
            this.geo_common.geo_min_max.lat.min
        ], [
            this.geo_common.geo_min_max.lon.max,
            this.geo_common.geo_min_max.lat.max
        ]], {
            padding: {top: 10, bottom: 30, left: 30, right: 30}
        });
    }
};