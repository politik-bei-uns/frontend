var DocumentSearch = function () {

    this.first_request = true;
    this.page = 1;
    this.page_change = true;
    this.browser_nav_action = false;
    this.random_seed = false;


    this.init = function () {
        window.addEventListener('popstate', function () {
            modules.document_search.browser_nav_action = true;
            get_url();
        });

        this.location_search = {
            type: null,
            id: null,
            lat_lon: null
        };

        this.random_seed = '';
        var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < 16; i++) {
            this.random_seed += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        this.init_forms();

        $('#sd-location-summary').click(function (e) {
            e.preventDefault();
            if (parseInt($(this).data('expanded')) === 0) {
                $('#sd-geo-parts').slideDown();
                if (!modules.document_search.map) {
                    modules.document_search.init_map();
                }
                $(this).data('expanded', '1');
            }
            else {
                $('#sd-geo-parts').slideUp();
                $(this).data('expanded', '0');
            }
        });

        $('#sd-search-subscribe').submit(function (evt) {
            evt.preventDefault();
            params = modules.document_search.generate_params();
            params.csrf_token = $('#csrf_token').val();
            $.post('/account/search-subscribe', params, function (data) {
                window.location.href = data.redirect;
            });
        });

        this.get_url();
        $('#sd-form').trigger('submit');
    };


    this.init_forms = function () {
        // init date
        $('#sd-date').datepicker({
            format: 'dd.mm.yyyy',
            maxViewMode: 2,
            language: 'de',
            orientation: 'bottom auto'
        });


        // init bodies
        $('#sd-type').multiselect({
            includeSelectAllOption: true,
            allSelectedText: 'alles ausgewählt',
            nonSelectedText: 'bitte wählen',
            selectAllText: 'alles auswählen',
            buttonClass: 'form-control',
            buttonContainer: '<div class="btn-group bootstrap-multiselect" />'
        });

        $('#sd-type').change(function () {
            $('#sd-form').submit();
        });
        $('#order-by').change(function() {
            $('#sd-form').submit();
        });
        $('#sd-date input').change(function () {
            modules.document_search.send_date_request = true;
            setTimeout(function () {
                if (modules.document_search.send_date_request) {
                    $('#sd-form').submit();
                }
                modules.document_search.send_date_request = false;
            }, 50);
        });

        $('#sd-form').submit(function (e) {
            e.preventDefault();
            if ($('#sd-fulltext').val()) {
                $('#order-by').val('_score');
            }
            modules.document_search.paper_request();
        });

        $('#sd-location-summary-close').click(function (e) {
            e.preventDefault();
            $('#sd-location-summary-text').text('nichts ausgewählt.');
            modules.document_search.location_search.type = 'region';
            $('#sd-location-summary-close').css({display: 'none'});
            $('#sd-form').submit();
        });
        $('.pagination-page').click(function (e) {
            if ($(this).hasClass('active') && !modules.document_search.first_request) {
                modules.document_search.page_change = true;
                modules.document_search.page = parseInt($(this).attr('data-page'));
                $('#sd-form').trigger('submit');
            }
        });
        $('#sd-location').val('');
        $('#sd-location').live_search({
            url: '/api/search/street',
            form: '#sd-form-geo',
            input: '#sd-location',
            live_box: '#sd-location-live',
            submit: '#sd-submit',
            modify_params: function (instance, params) {
                return params;
            },
            process_result_line: function (result) {
                return '<li data-q="' + result.id + '" data-q-descr="' + result.address + '">' + result.address + '</li>';
            },
            after_submit: function () {
                id = $('#sd-location').attr('data-q');
                for (var i = 0; i < modules.document_search.location_data.length; i++) {
                    if (modules.document_search.location_data[i].id === id) {
                        modules.document_search.show_geojson(modules.document_search.location_data[i].geojson);
                        break;
                    }
                }
            },
            select_data: function (data) {
                modules.document_search.location_data = data.data;
                return data.data;
            },
            reset_data: function() {
                jQuery('#sd-location').attr('data-q', '');
                jQuery('#sd-location').attr('data-q-descr', '');
                modules.document_search.map.getSource('search-source').setData({
                    type: 'FeatureCollection',
                    features: []
                });
            },
            extend_params: function(params) {
                var new_params = modules.document_search.generate_params();
                params.fq = JSON.stringify({ body: new_params.fq.body });
                return params;
            }
        });
    };


    this.generate_params = function () {
        var fq = {};

        // location
        if (this.location_search.type === 'location') {
            fq['location'] = [this.location_search.id]
        }

        // paperType
        if ($('#sd-type').val().length === $('#sd-type option').length) {
            fq.paperType = '_all';
        }
        else if ($('#sd-type').val().length) {
            fq['paperType'] = $('#sd-type').val();
        }

        var region_id = $('#region-current').data('id');
        var region = modules.region.get_region_data(config.regions, region_id, 0);

        fq.body = [];
        if (region.children) {
             fq.body = fq.body.concat(modules.region.get_children_bodies(region.children));
        }
        if (region.id !== 'root' && region.body) {
            fq.body = fq.body.concat(region.body);
        }

        var params = {
            q: $('#sd-fulltext').val(),
            fq: fq,
            f: (this.page * 10) - 10,
            o: $('#order-by').val(),
            rs: this.random_seed
        };

        if (region_id !== 'root') {
            params.region = region_id;
        }
        if ($('#sd-date-min').val() || $('#sd-date-max').val()) {
            try {
                min = $('#sd-date-min').val();
                min = min.substr(6, 4) + '-' + min.substr(3, 2) + '-' + min.substr(0, 2)
            }
            catch (e) {
                min = false;
            }
            try {
                max = $('#sd-date-max').val();
                max = max.substr(6, 4) + '-' + max.substr(3, 2) + '-' + max.substr(0, 2)
            }
            catch (e) {
                max = false;
            }
            params.date = JSON.stringify({
                min: min,
                max: max
            });
        }
        return params;
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
            modules.document_search.init_map_data(mapready, data);
        });

        this.map.on('load', function (data) {
            deref_map.resolve(data);
        });
        geo_params = {
            z: 5
        };
        $.post('/api/search/geo', geo_params, function (data) {
            deref_data.resolve(data);
        });
    };

    this.paper_request = function () {
        if ($('#sd-fulltext').val()) {
            $('#order-by option[value="_score"]').removeAttr('disabled');
        } else {
            if ($('#order-by').val() === '_score' || !$('#order-by').val()) {
                $('#order-by').val('random');
            }
            $('#order-by option[value="_score"]').attr('disabled','disabled');
        }

        if (!this.page_change)
            this.page = 1;
        this.page_change = false;
        var params = this.generate_params();

        if (this.browser_nav_action)
            this.browser_nav_action = false;
        else
            this.set_url(params);

        if (params.region) {
            delete(params.region);
        }
        params.fq = JSON.stringify(params.fq);

        $.post('/api/search', params, function (data) {
            modules.document_search.process_results(data);
        });
    };

    this.process_results = function (data) {
        num_results = data.count;
        $('#sd-results-summary-count').text(num_results);
        html = '';
        aggs = data.aggs;
        data = data.data;
        for (var i = 0; i < data.length; i++) {
            html += '<div class="row' + ((i % 2 === 0) ? ' row-alt': '') + '">';
            html += '<div class="col-md-8"><h4><a href="/document/' + data[i].id + '">' + data[i].name + '</a></h4></div>';
            html_fragments = [];
            if (data[i].body_name)
                html_fragments.push('Körperschaft: ' + data[i].body_name);
            if (data[i].paperType)
                html_fragments.push('Typ: ' + data[i].paperType);
            if (data[i].reference)
                html_fragments.push('Referenz: ' + data[i].reference);
            if (data[i].created)
                html_fragments.push('Erstellt: ' + modules.common.format_datetime(data[i].created));
            html += '<div class="col-md-4">' + html_fragments.join('<br>') + '</div>';
            html += '</div>'
        }
        $('#sd-results').html(html);

        modules.region.update_region_list_count(aggs.body);

        for (var i = 0; i < aggs.paperType.length; i++) {
            if ($('#sd-type option[value="' + aggs.paperType[i].key + '"]').length) {
                $('#sd-type option[value="' + aggs.paperType[i].key + '"]').text = aggs.paperType[i].key + ' (' + aggs.paperType[i].doc_count + ')';
            }
            else {
                $('#sd-type').append('<option value="' + aggs.paperType[i].key + '" selected>' + aggs.paperType[i].key + ' (' + aggs.paperType[i].doc_count + ')</option>');
            }
        }
        $('#sd-type').multiselect('rebuild');
        this.first_request = false;

        total_pages = Math.ceil(num_results / 10);
        $('#pagination-c').text(this.page + ' / ' + total_pages);
        if (this.page > 1) {
            $('#pagination-ll, #pagination-sl').removeClass('inactive').addClass('active');
            $('#pagination-sl').attr({'data-page': this.page - 1});
        }
        else {
            $('#pagination-ll, #pagination-sl').removeClass('active').addClass('inactive');
            $('#pagination-sl').attr({'data-page': 1});
        }
        if (this.page < total_pages) {
            $('#pagination-rr, #pagination-sr').removeClass('inactive').addClass('active');
            $('#pagination-sr').attr({'data-page': this.page + 1});
            $('#pagination-rr').attr({'data-page': total_pages});
        }
        else {
            $('#pagination-rr, #pagination-sr').removeClass('active').addClass('inactive');
            $('#pagination-sr').attr({'data-page': total_pages});
            $('#pagination-rr').attr({'data-page': total_pages});
        }
    }

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
        $.post('/api/search/geo', geo_params, function (data) {
            modules.document_search.map.getSource('data-source').setData(data.data);
        });
    };

    this.get_url = function () {
        cut = window.location.href.indexOf('?');
        var query_string = {};
        if (cut !== -1) {
            var vars = window.location.href.substr(cut + 1).split("&");

            for (var i = 0; i < vars.length; i++) {
                var pair = vars[i].split('=');
                query_string[pair[0]] = pair[1];
            }
        }
        if (query_string.region) {
            modules.region.select_region(query_string.region);
        }
        if (query_string.text)
            $('#sd-fulltext').val(decodeURI(query_string.text));
        else
            $('#sd-fulltext').val('');

        if (query_string.f)
            this.page = (query_string.f / 10) + 1;
        else
            this.page = 1;

        if (query_string.date) {
            startend = JSON.parse(decodeURI(query_string.date));
            $('#sd-date-min').val(startend.min.substr(8, 2) + '-' + startend.min.substr(5, 2) + '-' + startend.min.substr(0, 4));
            $('#sd-date-max').val(startend.max.substr(8, 2) + '-' + startend.max.substr(5, 2) + '-' + startend.max.substr(0, 4));
        }
        if (query_string.fq) {
            fq = JSON.parse(decodeURI(query_string.fq));
            if (fq.paperType) {
                if (fq.paperType === '_all') {
                    $('#sd-type').multiselect('selectAll');
                }
                else {
                    $('#sd-type').multiselect('deselectAll');
                    $('#sd-type').multiselect('select', fq.paperType);
                }
            }
        }
        if (query_string.order)
            $('#order-by').val(query_string.order);
        else {
            if ($('#sd-fulltext').val())
                $('#order-by').val('_score');
            else
                $('#order-by').val('random');
        }
        this.form_active = true;
    };

    this.set_url = function (params) {
        url = [];
        if (params.q) {
            url.push('text=' + encodeURI(params.q));
        }
        if (params.f) {
            url.push('f=' + params.f)
        }
        if (params.fq) {
            fq = JSON.parse(JSON.stringify(params.fq));
            if (fq.body) {
                delete(fq.body);
            }
            url.push('fq=' + encodeURI(JSON.stringify(fq)));
        }
        if (params.date) {
            url.push('date=' + encodeURI(params.date));
        }
        if ((params.q && params.o !== '_score') || (!params.q && params.o !== 'random')) {
            url.push('order=' + params.o);
        }
        if (params.region) {
            url.push('region=' + params.region)
        }

        url = url.join('&');
        if (url) {
            url = '?' + url;
        }
        history.pushState(null, 'Ratsdokumente | Politik bei Uns', '/ratsdokumente' + url)
    };



    this.init_map_data = function (mapready, data) {
        this.map.addSource('data-source', {
            type: 'geojson',
            data: data.data
        });
        this.map.addLayer({
            id: 'data-layer-street',
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
            id: 'data-layer-address',
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
            id: 'data-layer-address',
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
            id: 'search-layer-linestring',
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

        this.map.on('mouseenter', 'data-layer-street', function () {
            modules.document_search.map.getCanvasContainer().style.cursor = 'pointer';
        });
        this.map.on('mouseenter', 'data-layer-address', function () {
            modules.document_search.map.getCanvasContainer().style.cursor = 'pointer';
        });
        this.map.on('mouseleave', 'data-layer-street', function () {
            modules.document_search.map.getCanvasContainer().style.cursor = '';
        });
        this.map.on('mouseleave', 'data-layer-address', function () {
            modules.document_search.map.getCanvasContainer().style.cursor = '';
        });
        this.map.on('click', 'data-layer-street', function (e) {
            modules.document_search.show_map_popup(e);
        });
        this.map.on('click', 'data-layer-address', function (e) {
            modules.document_search.show_map_popup(e);
        });
        this.map.on('moveend', function () {
            modules.document_search.update_map();
        });
        if (this.fly_to) {
            this.map.flyTo({
                center: this.fly_to,
                zoom: 11
            });
            this.fly_to = null;
        }
    };


    this.show_map_popup = function(e) {
        var title = e.features[0].properties.name;
        if (e.features[0].properties.number)
            title += ' ' + e.features[0].properties.number;
        if (e.features[0].properties.locality)
            title += ', ' + e.features[0].properties.locality.replace('["', '').replace('"]', '');
        html = '<h4>' + title + '</h4>';
        html += '<p class="sd-map-popup-descr">' + ((e.features[0].properties.rgs) ? '<i class="fa fa-spinner fa-pulse fa-fw"></i>' : e.features[0].properties['paper-count']) + ' Dokumente gefunden</p>';
        html += '<p class="sd-map-popup-button"><button class="form-control" data-type="' + ((e.features[0].properties.rgs) ? 'region' : 'location') + '" data-id="' + ((e.features[0].properties.rgs) ? e.features[0].properties.rgs : e.features[0].properties.id) + '" data-title="' + title + '">Für Suche übernehmen</button></p>';
        modules.document_search.popup = new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(html)
            .addTo(modules.document_search.map);
        $('.sd-map-popup-button button').click(function (e) {
            e.preventDefault();
            modules.document_search.location_search.type = $(this).data('type');
            modules.document_search.location_search.id = $(this).data('id');
            $('#sd-location-summary span').text($(this).data('title'));
            $('#sd-location-summary-close').css({display: 'block'});
            modules.document_search.popup.remove();
            $('#sd-form').trigger('submit');
        })
    };


    this.show_geojson = function(geojson) {
        this.map.getSource('search-source').setData(geojson);
        minmax = (new GeoCommon()).get_minmax(geojson);
        this.map.fitBounds([
            [minmax.lon.min, minmax.lat.min],
            [minmax.lon.max, minmax.lat.max]
        ]);
    }
};