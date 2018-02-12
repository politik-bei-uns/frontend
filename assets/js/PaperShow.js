var PaperShow = function () {

    this.init = function () {
        this.map = null;
        this.init_forms();
        this.geo_common = new GeoCommon();
        mapboxgl.accessToken = config.mapbox_token;
        if (config.geojson.features.length) {
            this.init_map();
        }
    };

    this.init_forms = function () {
        $('#location').focus(function() {
            if (!modules.paper_show.map) {
                $('#paper-map-box').slideDown(function () {
                    modules.paper_show.init_map();
                });
            }
        }).live_search({
            url: '/api/search/street',
            form: '#location-form',
            input: '#location',
            live_box: '#location-live',
            submit: '#location_submit',
            extend_params: function (params) {
                return params;
            },
            process_result_line: function (result) {
                return '<li data-q="' + result.id + '" data-q-descr="' + result.address + '">' + result.address + '</li>';
            },
            after_submit: function () {
                var params = {
                    street: $('#location').attr('data-q'),
                    csrf_token: $('#csrf_token').val()
                };
                $.post($('#location-form').attr('action') + '/add-location', params, function(data) {
                    modules.paper_show.new_location_added(data);
                });
            },
            select_data: function (data) {
                return data.data;
            },
            reset_data: function() {
                jQuery('#sd-location').attr('data-q', '').attr('data-q-descr', '');
                modules.paper_show.map.getSource('data-source').setData(config.geojson);
            }
        });
    };

    this.new_location_added = function (data) {
        $('#location').removeAttr('data-q').val('');
        $('#paper-map-box .location-list-empty').hide();
        if (data.location) {
            var html = '';
            if (data.location.streetAddress)
                html += data.location.streetAddress;
            if (data.location.streetAddress && (data.location.postalCode || data.location.locality))
                html += ', ';
            if (data.location.postalCode)
                html += data.location.postalCode;
            if (data.location.postalCode && data.location.locality)
                html += ' ';
            if (data.location.locality)
                html += data.location.locality;
            $('#paper-map-box ul').append('<li>' + html + '</li>');
            config.geojson.features.push(data.location.geojson);
            modules.paper_show.map.getSource('data-source').setData(config.geojson);
            this.geo_min_max = this.geo_common.get_multi_minmax(config.geojson);

            this.map.fitBounds([[
                this.geo_common.geo_min_max.lon.min,
                this.geo_common.geo_min_max.lat.min
            ], [
                this.geo_common.geo_min_max.lon.max,
                this.geo_common.geo_min_max.lat.max
            ]], {
                padding: {top: 40, bottom: 80, left: 80, right: 80}
            });
        }
    };


    this.init_map = function() {
        var center = [10.447683333333, 51.163375];
        if (config.geojson.features.length) {
            this.geo_min_max = this.geo_common.get_multi_minmax(config.geojson);
            center = this.geo_common.get_minmax_center();
        }

        this.map = new mapboxgl.Map({
            container: 'paper-map',
            style: 'mapbox://styles/politik-bei-uns/cj7u916u61yey2rmwwl1wh1ik',
            center: center,
            zoom: 5
        });
        this.map.addControl(new mapboxgl.NavigationControl(), 'top-left');
        if (config.geojson.features.length) {
            this.map.fitBounds([[
                this.geo_common.geo_min_max.lon.min,
                this.geo_common.geo_min_max.lat.min
            ], [
                this.geo_common.geo_min_max.lon.max,
                this.geo_common.geo_min_max.lat.max
            ]], {
                padding: {top: 40, bottom: 80, left: 80, right: 80},
                duration: 0,
                maxZoom: 14
            });
        }

        this.map.on('load', function () {
            modules.paper_show.init_map_data();
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
    }
};