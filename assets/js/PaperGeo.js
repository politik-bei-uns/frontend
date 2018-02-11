var PaperGeo = function () {
    this.init = function () {
        this.init_mobile();
        this.init_forms();
        this.init_subscribe_form();
        this.init_map();
        modules.paper_search.set_random();
        this.search();
    };
    this.init_mobile = function () {
        if ($.browser.mobile) {
            $('body').addClass('mobile');
            var map_offset = $('#sd-map').offset();
            var window_height = $( window ).height();
            $('#sd-map').css({ height: String(window_height - map_offset.top) + 'px' });
            $('#content-wrapper').prepend('<p id="mobile-show-results" class="mobile-results-hidden"><i class="fa fa-angle-double-up" aria-hidden="true"></i> Ergebnisse sehen <i class="fa fa-angle-double-up" aria-hidden="true"></i></p>');
            $('#mobile-show-results').click(function () {
                var window_height = $( window ).height();
                var map_offset = $('#sd-map').offset();
                if ($('#mobile-show-results').hasClass('mobile-results-hidden')) {
                    $('#content-wrapper').css({'overflow-y': 'scroll' }).animate({height: String(window_height - map_offset.top - 30) + 'px'});
                    $('#mobile-show-results').removeClass('mobile-results-hidden').addClass('mobile-results-show');
                    $('#mobile-show-results i').removeClass('fa-angle-double-up').addClass('fa-angle-double-down');
                }
                else {
                    $('#content-wrapper').css({'overflow-y': 'hidden' }).animate({height: '40px'});
                    $('#mobile-show-results').removeClass('mobile-results-show').addClass('mobile-results-hidden');
                    $('#mobile-show-results i').removeClass('fa-angle-double-down').addClass('fa-angle-double-up');
                }
            });
        }
    };

    this.init_forms = function () {
        $('#sd-location').val('').live_search({
            url: '/api/search/street',
            form: '#paper-geo-form',
            input: '#sd-location',
            live_box: '#sd-location-live',
            submit: '#sd-submit',
            extend_params: function (params) {
                var legacy = $('#legacy').is(':checked');
                if (legacy) {
                    params.fq = JSON.stringify({legacy: 1});
                }
                return params;
            },
            process_result_line: function (result) {
                return '<li data-q="' + result.id + '" data-q-descr="' + result.address + '">' + result.address + '</li>';
            },
            after_submit: function () {
                id = $('#sd-location').attr('data-q');
                if (modules.paper_geo.location_data) {
                    for (var i = 0; i < modules.paper_geo.location_data.length; i++) {
                        if (modules.paper_geo.location_data[i].id === id) {
                            modules.paper_geo.show_geojson(modules.paper_geo.location_data[i].geojson);
                            break;
                        }
                    }
                }
            },
            select_data: function (data) {
                modules.paper_geo.location_data = data.data;
                return data.data;
            },
            reset_data: function() {
                jQuery('#sd-location').attr('data-q', '').attr('data-q-descr', '');
                modules.paper_geo.map.getSource('search-source').setData({
                    type: 'FeatureCollection',
                    features: []
                });
            }
        });
        $('.pagination-page').click(function (e) {
            if ($(this).hasClass('active') && !modules.paper_search.first_request) {
                modules.paper_search.page_change = true;
                modules.paper_search.page = parseInt($(this).attr('data-page'));
                modules.paper_geo.search();
            }
        });
        $('#order-by, #legacy').change(function() {
            modules.paper_geo.search();
        });
        $('#legacy').change(function() {
            modules.paper_geo.update_map();
        });
    };

    this.init_subscribe_form = function () {
        $('#sd-search-subscribe').submit(function (evt) {
            evt.preventDefault();
            params = modules.paper_geo.generate_params();
            params.fq = JSON.stringify(params.fq);
            params.csrf_token = $('#csrf_token').val();
            $.post('/account/search-subscribe', params, function (data) {
                window.location.href = data.redirect;
            });
        });
    };

    this.init_map = function() {

        mapboxgl.accessToken = config.mapbox_token;

        this.map = new mapboxgl.Map({
            container: 'sd-map',
            style: 'mapbox://styles/politik-bei-uns/cj7u916u61yey2rmwwl1wh1ik',
            center: [10.447683, 51.163375],
            zoom: 5
        });
        this.map.addControl(new mapboxgl.NavigationControl(), 'top-left');

        var deref_map = new $.Deferred();
        var deref_data = new $.Deferred();

        $.when(deref_map, deref_data).done(function (mapready, data) {
            modules.paper_geo.init_map_data(mapready, data);
        });

        this.map.on('load', function (data) {
            deref_map.resolve(data);
        });
        geo_params = {
            z: 5
        };
        if ($('#legacy').is(':checked')) {
            geo_params.fq = JSON.stringify({legacy: 1});
        }
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
            filter: ['all', ["==", "$type", "Polygon"], ['!=', 'legacy', true]],
            paint: {
                'fill-color': '#428238',
                'fill-opacity': 0.5,
                'fill-outline-color': '#428238'
            }
        }, 200);
        this.map.addLayer({
            id: 'data-layer-polygon-legacy',
            type: 'fill',
            source: 'data-source',
            filter: ['all', ["==", "$type", "Polygon"], ['==', 'legacy', true]],
            paint: {
                'fill-color': '#dcc400',
                'fill-opacity': 0.5,
                'fill-outline-color': '#dcc400'
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

        this.map.addSource('search-source', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: []
            }
        });

        this.map.addLayer({
            id: 'search-layer-line-string',
            type: 'line',
            source: 'search-source',
            filter: ["==", "$type", "LineString"],
            paint: {
                "line-color": "#A94739",
                "line-width": 5,
                "line-opacity": 0.5
            }
        }, 200);
        this.map.addLayer({
            id: 'search-layer-polygon',
            type: 'fill',
            source: 'search-source',
            filter: ["==", "$type", "Polygon"],
            paint: {
                'fill-color': '#A94739',
                'fill-opacity': 0.5,
                'fill-outline-color': '#A94739'
            }
        }, 200);
        this.map.addLayer({
            id: 'search-layer-point',
            type: 'circle',
            source: 'search-source',
            filter: ["==", "$type", "Point"],
            paint: {
                'circle-radius': 7,
                'circle-color': '#A94739'
            }
        }, 200);

        this.map.on('mouseenter', 'data-layer-line-string', function () {
            modules.paper_geo.map.getCanvasContainer().style.cursor = 'pointer';
        });
        this.map.on('mouseenter', 'data-layer-polygon', function () {
            modules.paper_geo.map.getCanvasContainer().style.cursor = 'pointer';
        });
        this.map.on('mouseenter', 'data-layer-polygon-legacy', function () {
            modules.paper_geo.map.getCanvasContainer().style.cursor = 'pointer';
        });
        this.map.on('mouseenter', 'data-layer-point', function () {
            modules.paper_geo.map.getCanvasContainer().style.cursor = 'pointer';
        });
        this.map.on('mouseleave', 'data-layer-line-string', function () {
            modules.paper_geo.map.getCanvasContainer().style.cursor = '';
        });
        this.map.on('mouseleave', 'data-layer-polygon', function () {
            modules.paper_geo.map.getCanvasContainer().style.cursor = '';
        });
        this.map.on('mouseleave', 'data-layer-polygon-legacy', function () {
            modules.paper_geo.map.getCanvasContainer().style.cursor = '';
        });
        this.map.on('mouseleave', 'data-layer-point', function () {
            modules.paper_geo.map.getCanvasContainer().style.cursor = '';
        });
        this.map.on('click', 'data-layer-line-string', function (e) {
            modules.paper_geo.show_map_popup(e);
        });
        this.map.on('click', 'data-layer-polygon', function (e) {
            modules.paper_geo.show_map_popup(e);
        });
        this.map.on('click', 'data-layer-polygon-legacy', function (e) {
            modules.paper_geo.show_map_popup(e);
        });
        this.map.on('click', 'data-layer-point', function (e) {
            modules.paper_geo.show_map_popup(e);
        });
        this.map.on('moveend', function () {
            modules.paper_geo.update_map();
        });
        if (this.fly_to) {
            this.map.flyTo({
                center: this.fly_to,
                zoom: 11
            });
            this.fly_to = null;
        }
    };

    this.update_map = function () {
        bounds = this.map.getBounds();
        geo_params = {
            z: this.map.getZoom(),
            geo: [
                bounds.getWest(),// - (bounds.getEast() - bounds.getWest()),
                bounds.getNorth(),// + (bounds.getNorth() - bounds.getSouth()),
                bounds.getEast(),// + (bounds.getEast() - bounds.getWest()),
                bounds.getSouth()// - (bounds.getNorth() - bounds.getSouth())
            ].join(';')
        };
        if ($('#legacy').is(':checked')) {
            geo_params.fq = JSON.stringify({legacy: 1});
        }
        $.post('/api/search/geo', geo_params, function (data) {
            modules.paper_geo.map.getSource('data-source').setData(data.data);
        });
    };


    this.show_map_popup = function(e) {
        var title = e.features[0].properties.name;
        if (e.features[0].properties.number)
            title += ' ' + e.features[0].properties.number;
        if (e.features[0].properties.locality)
            title += ', ' + e.features[0].properties.locality.replace('["', '').replace('"]', '');
        html = '<h4>' + title + '</h4>';
        html += '<p class="sd-map-popup-descr">' + ((e.features[0].properties.rgs) ? '<span><i class="fa fa-spinner fa-pulse fa-fw"></i></span>' : e.features[0].properties['paper-count']) + ' Dokumente gefunden</p>';
        html += '<p class="sd-map-popup-button"><button class="form-control" data-type="' + ((e.features[0].properties.rgs) ? 'region' : 'location') + '" data-id="' + e.features[0].properties.id + '" data-title="' + title + '">Für Suche übernehmen</button></p>';
        this.popup = new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(html)
            .addTo(modules.paper_geo.map);
        $('.sd-map-popup-button button').click(function (e) {
            e.preventDefault();
            modules.paper_geo.search_type = $(this).data('type');
            modules.paper_geo.search_id = $(this).data('id');
            modules.paper_geo.popup.remove();
            modules.paper_geo.search();
        });
        if (e.features[0].properties.rgs) {
            var params = this.generate_params();
            params.fq.region = e.features[0].properties.id;
            params.fq = JSON.stringify(params.fq);
            $.post('/api/search', params, function (data) {
                $('.sd-map-popup-descr span').html(data.count);
            });
        }
    };

    this.show_geojson = function(geojson) {
        this.map.getSource('search-source').setData(geojson);
        minmax = (new GeoCommon()).get_minmax(geojson);
        this.map.fitBounds([
            [minmax.lon.min, minmax.lat.min],
            [minmax.lon.max, minmax.lat.max]
        ]);
    };

    this.generate_params = function () {
        var fq = {};

        // location
        if (this.search_type === 'location') {
            fq.location = this.search_id
        }
        else if (this.search_type === 'region') {
            fq.region = this.search_id;
        }

        var legacy = $('#legacy').is(':checked');
        if (legacy) {
            fq.legacy = 1;
        }

        return {
            q: '',
            fq: fq,
            f: (modules.paper_search.page * 10) - 10,
            o: $('#order-by').val(),
            rs: modules.paper_search.random_seed
        };
    };

    this.search = function () {
        params = this.generate_params();
        params.fq = JSON.stringify(params.fq);
        $.post('/api/search', params, function (data) {
            modules.paper_search.process_results(data);
        });
    };
};