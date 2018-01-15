var HomeMap = function () {
    this.init = function () {
        this.init_map();
    };

    this.init_map = function () {
        $('#front-search-form').submit(function(evt) {
            evt.preventDefault();
            window.location.href = '/ratsdokumente?text=' + encodeURI($('#front-search-text').val());
        });

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
            z: 9
        };
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
            id: 'data-layer-bodies',
            type: 'fill',
            source: 'data-source',
            paint: {
                'fill-color': '#428238',
                'fill-opacity': 0.5,
                'fill-outline-color': '#428238'
            }
        }, 200);
        this.map.on('mouseenter', 'data-layer-bodies', function () {
            modules.home_map.map.getCanvasContainer().style.cursor = 'pointer';
        });
        this.map.on('mouseleave', 'data-layer-bodies', function () {
            modules.home_map.map.getCanvasContainer().style.cursor = '';
        });
        this.map.on('click', 'data-layer-bodies', function (e) {
            modules.home_map.show_map_popup(e);
        });
    };

    this.show_map_popup = function(e) {
        html = '<h4>' + e.features[0].properties.name + '</h4>';
        html += '<p class="ov-map-popup-button"><a class="form-control" href=\'/ratsdokumente?fq=' + encodeURI(JSON.stringify({ rgs: [e.features[0].properties.rgs]})) + '\'>Dokumenten-Suche</a></p>';
        this.popup = new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(html)
            .addTo(this.map);
    };

};