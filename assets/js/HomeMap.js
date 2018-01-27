var HomeMap = function () {
    this.init = function () {
        this.init_map();
    };

    this.init_map = function () {
        mapboxgl.accessToken = config.mapbox_token;

        this.map = new mapboxgl.Map({
            container: 'overview-map',
            style: 'mapbox://styles/politik-bei-uns/cj7u916u61yey2rmwwl1wh1ik',
            center: [7.66, 51.3],
            zoom: 7
        });
        this.map.addControl(new mapboxgl.NavigationControl(), 'top-left');

        var deref_map = new $.Deferred();
        var deref_data = new $.Deferred();

        $.when(deref_map, deref_data).done(function (mapready, data) {
            modules.home_map.init_map_data(mapready, data);
        });

        this.map.on('load', function (data) {
            deref_map.resolve(data);
        });
        geo_params = {
            z: parseInt($('#map-level').val()),
            bc: 1
        };
        $('#map-level').change(function() {
            modules.home_map.update_map();
        });
        $.post('/api/search/geo', geo_params, function (data) {
            deref_data.resolve(data);
        });
    };


    this.init_map_data = function (mapready, data) {
        this.map.addSource('data-source', {
            type: 'geojson',
            data: data.data
        });
        this.map.addLayer({
            id: 'data-layer-bodies-current',
            type: 'fill',
            source: 'data-source',
            filter: ['==', 'legacy', false],
            paint: {
                'fill-color': '#428238',
                'fill-opacity': 0.5,
                'fill-outline-color': '#428238'
            }
        }, 200);
        this.map.addLayer({
            id: 'data-layer-bodies-legacy',
            type: 'fill',
            source: 'data-source',
            filter: ['==', 'legacy', true],
            paint: {
                'fill-color': '#dcc400',
                'fill-opacity': 0.5,
                'fill-outline-color': '#dcc400'
            }
        }, 200);
        this.map.on('mouseenter', 'data-layer-bodies-current', function () {
            modules.home_map.map.getCanvasContainer().style.cursor = 'pointer';
        });
        this.map.on('mouseleave', 'data-layer-bodies-current', function () {
            modules.home_map.map.getCanvasContainer().style.cursor = '';
        });
        this.map.on('click', 'data-layer-bodies-current', function (e) {
            modules.home_map.show_map_popup(e);
        });
        this.map.on('mouseenter', 'data-layer-bodies-legacy', function () {
            modules.home_map.map.getCanvasContainer().style.cursor = 'pointer';
        });
        this.map.on('mouseleave', 'data-layer-bodies-legacy', function () {
            modules.home_map.map.getCanvasContainer().style.cursor = '';
        });
        this.map.on('click', 'data-layer-bodies-legacy', function (e) {
            modules.home_map.show_map_popup(e);
        });
    };
    this.update_map = function () {
        geo_params = {
            z: parseInt($('#map-level').val()),
            bc: 1,
            fq: JSON.stringify({legacy: 1})
        };
        $.post('/api/search/geo', geo_params, function (data) {
            modules.home_map.map.getSource('data-source').setData(data.data);
        });
    };

    this.show_map_popup = function(e) {
        html = '<h4>' + e.features[0].properties.name + '</h4>';
        fq = {
            region: e.features[0].properties.id
        };

        if (e.features[0].properties.legacy) {
            html += 'Wird nicht mehr aktualisiert.';
            fq.legacy = 1;
        }
        html += '<p class="ov-map-popup-button"><a class="form-control" href=\'/ratsdokumente/suche?fq=' + encodeURIComponent(JSON.stringify(fq)) + '\'>Dokumenten-Suche</a></p>';
        this.popup = new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(html)
            .addTo(this.map);
    };

};