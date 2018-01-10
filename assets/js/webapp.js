storage = {
    first_request: true,
    page: 1,
    page_change: true,
    browser_nav_action: false,
    random_seed: false
};


$(document).on('click', '[data-toggle="lightbox"]', function (e) {
    e.preventDefault();
    $(this).ekkoLightbox();
});

window.addEventListener('popstate', function () {
    storage.browser_nav_action = true;
    get_url();
});

$(document).ready(function () {
    if ($('#sd-form').length) {
        sd_form_init();
    }

    if ($('#paper-map').length) {
        paper_map_init();
    }

    if ($('#overview-map').length) {
        overview_map_init();
    }
    if ($('#home-latest-documents').length) {
        home_show_latest_documents();
    }
});

function sd_form_init() {
    storage.location_search = {
        type: null,
        id: null,
        lat_lon: null
    };

    storage.random_seed = '';
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 16; i++) {
        storage.random_seed += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    sd_init_forms();
    $('#sd-location-summary').click(function (e) {
        e.preventDefault();
        if ($(this).data('expanded') == '0') {
            $('#sd-geo-parts').slideDown();
            if (!storage.map) {
                sd_init_map();
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
        params = generate_params();
        params.csrf_token = $('#csrf_token').val();
        $.post('/account/search-subscribe', params, function (data) {
            window.location.href = data.redirect;
        });
    });

    get_url();
    $('#sd-form').trigger('submit');
}

function paper_map_init() {
    mapboxgl.accessToken = config.mapbox_token;

    storage.geo_min_max = {
        lat: {
            min: null,
            max: null
        },
        lon: {
            min: null,
            max: null
        }
    };
    storage.geo_first = true;


    for (var i = 0; i < config.geojson.features.length; i++) {
        if (config.geojson.features[i].geometry.type == 'Polygon' || config.geojson.features[i].geometry.type == 'MultiLineString') {
            iterate_geo(config.geojson.features[i].geometry.coordinates, 2);
        }
        else if (config.geojson.features[i].geometry.type == 'MultiPolygon') {
            iterate_geo(config.geojson.features[i].geometry.coordinates, 3);
        }
    }

    storage.map = new mapboxgl.Map({
        container: 'paper-map',
        style: 'mapbox://styles/politik-bei-uns/cj7u916u61yey2rmwwl1wh1ik',
        center: [
            storage.geo_min_max.lon.min + (storage.geo_min_max.lon.max - storage.geo_min_max.lon.min) / 2,
            storage.geo_min_max.lat.min + (storage.geo_min_max.lat.max - storage.geo_min_max.lat.min) / 2
        ],
        zoom: 6
    });
    storage.map.addControl(new mapboxgl.NavigationControl(), 'top-left');

    storage.map.on('load', function () {
        storage.map.addSource('data-source', {
            type: 'geojson',
            data: config.geojson
        });
        storage.map.addLayer({
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
        storage.map.addLayer({
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
        storage.map.addLayer({
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
        storage.map.fitBounds([[
            storage.geo_min_max.lon.min,
            storage.geo_min_max.lat.min
        ], [
            storage.geo_min_max.lon.max,
            storage.geo_min_max.lat.max
        ]], {
            padding: {top: 10, bottom: 30, left: 30, right: 30}
        })
    });
}

function overview_map_init() {
    $('#front-search-form').submit(function(evt) {
        evt.preventDefault();
        window.location.href = '/ratsdokumente?text=' + encodeURI($('#front-search-text').val());
    });

    mapboxgl.accessToken = config.mapbox_token;

    storage.map = new mapboxgl.Map({
        container: 'overview-map',
        style: 'mapbox://styles/politik-bei-uns/cj7u916u61yey2rmwwl1wh1ik',
        center: [7.66, 51.3],
        zoom: 7
    });
    storage.map.addControl(new mapboxgl.NavigationControl(), 'top-left');

    var deref_map = new $.Deferred();
    var deref_data = new $.Deferred();

    $.when(deref_map, deref_data).done(function (mapready, data) {
        ov_init_map_data(mapready, data);
    });

    storage.map.on('load', function (data) {
        deref_map.resolve(data);
    });
    geo_params = {
        z: 9
    };
    $.post('/api/search/geo', geo_params, function (data) {
        deref_data.resolve(data);
    });
}


function sd_init_forms() {
    // init date
    $('#sd-date').datepicker({
        format: 'dd.mm.yyyy',
        maxViewMode: 2,
        language: 'de',
        orientation: 'bottom auto'
    });

    $('#region-current').data('expanded', 0);
    for (i = 0; i < config.regions.length; i++) {
        $('#region-children').append('<div class="region-child" data-id="' + config.regions[i].id + '">' + config.regions[i].name + ' (<span>0</span>)</div>');
    }
    $('.region-child, #region-parent').click(function() {
        if (!$(this).hasClass('region-inactive')) {
            select_region($(this).data('id'));
        }
    });
    $('#region-box-inner').click(function(evt) {
        evt.stopPropagation();
    });
    $('#region-current').click(function(evt) {
        if (parseInt($(this).data('expanded')) === 0) {
            evt.stopPropagation();
            $('#region-box-inner').fadeIn(200);
            $(this).data('expanded', 1);
        }
    });
    $(window).click(function() {
        $('#region-box-inner').fadeOut(200);
        $('#region-current').data('expanded', 0);
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
        storage.send_date_request = true;
        setTimeout(function () {
            if (storage.send_date_request) {
                $('#sd-form').submit();
            }
            storage.send_date_request = false;
        }, 50);
    });

    $('#sd-form').submit(function (e) {
        e.preventDefault();
        if ($('#sd-fulltext').val()) {
            $('#order-by').val('_score');
        }
        sd_paper_request();
    });

    $('#sd-location-summary-close').click(function (e) {
        e.preventDefault();
        $('#sd-location-summary-text').text('nichts ausgewählt.');
        storage.location_search.type = 'region';
        $('#sd-location-summary-close').css({display: 'none'});
        $('#sd-form').submit();
    });
    $('.pagination-page').click(function (e) {
        if ($(this).hasClass('active') && !storage.first_request) {
            storage.page_change = true;
            storage.page = parseInt($(this).attr('data-page'));
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
            for (var i = 0; i < storage.location_data.length; i++) {
                if (storage.location_data[i].id === id) {
                    sd_show_geojson(storage.location_data[i].geojson);
                    break;
                }
            }
        },
        select_data: function (data) {
            storage.location_data = data.data;
            return data.data;
        },
        reset_data: function() {
            jQuery('#sd-location').attr('data-q', '');
            jQuery('#sd-location').attr('data-q-descr', '');
            storage.map.getSource('search-source').setData({
                type: 'FeatureCollection',
                features: []
            });
        },
        extend_params: function(params) {
            /*
            var region_id = $('#region-current').data('id');
            region = get_region_data(config.regions, region_id, 0);

            regions = [];
            if (region.children) {
                 regions = regions.concat(get_children_regions(region.children));
            }
            if (region.id !== 'root' && region.id) {
                regions.push(region.id);
            }
            fq = {
                region: regions
            };*/
            new_params = generate_params();
            params.fq = JSON.stringify({ body: new_params.fq.body });
            return params;
        }
    });
}

function sd_show_geojson(geojson) {
    storage.map.getSource('search-source').setData(geojson);
    minmax = (new GeoMinMax()).get_minmax(geojson);
    storage.map.fitBounds([
        [minmax.lon.min, minmax.lat.min],
        [minmax.lon.max, minmax.lat.max]
    ]);

}

function generate_params() {
    fq = {};

    // location
    if (storage.location_search.type === 'location') {
        fq['location'] = [storage.location_search.id]
    }

    // paperType
    if ($('#sd-type').val().length === $('#sd-type option').length) {
        fq.paperType = '_all';
    }
    else if ($('#sd-type').val().length) {
        fq['paperType'] = $('#sd-type').val();
    }

    var region_id = $('#region-current').data('id');
    region = get_region_data(config.regions, region_id, 0);

    fq.body = [];
    if (region.children) {
         fq.body = fq.body.concat(get_children_bodies(region.children));
    }
    if (region.id !== 'root' && region.body) {
        fq.body = fq.body.concat(region.body);
    }

    params = {
        q: $('#sd-fulltext').val(),
        fq: fq,
        f: (storage.page * 10) - 10,
        o: $('#order-by').val(),
        rs: storage.random_seed
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
}

function sd_paper_request() {

    if ($('#sd-fulltext').val()) {
        $('#order-by option[value="_score"]').removeAttr('disabled');
    } else {
        if ($('#order-by').val() === '_score' || !$('#order-by').val()) {
            $('#order-by').val('random');
        }
        $('#order-by option[value="_score"]').attr('disabled','disabled');
    }

    if (!storage.page_change)
        storage.page = 1;
    storage.page_change = false;
    params = generate_params();

    if (storage.browser_nav_action)
        storage.browser_nav_action = false;
    else
        set_url(params);

    if (params.region) {
        delete(params.region);
    }
    params.fq = JSON.stringify(params.fq);

    $.post('/api/search', params, function (data) {
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
                html_fragments.push('Erstellt: ' + format_datetime(data[i].created));
            html += '<div class="col-md-4">' + html_fragments.join('<br>') + '</div>';
            html += '</div>'
        }
        $('#sd-results').html(html);

        update_region_list_count(aggs.body);

        for (var i = 0; i < aggs.paperType.length; i++) {
            if ($('#sd-type option[value="' + aggs.paperType[i].key + '"]').length) {
                $('#sd-type option[value="' + aggs.paperType[i].key + '"]').text = aggs.paperType[i].key + ' (' + aggs.paperType[i].doc_count + ')';
            }
            else {
                $('#sd-type').append('<option value="' + aggs.paperType[i].key + '" selected>' + aggs.paperType[i].key + ' (' + aggs.paperType[i].doc_count + ')</option>');
            }
        }
        $('#sd-type').multiselect('rebuild');
        storage.first_request = false;

        total_pages = Math.ceil(num_results / 10);
        $('#pagination-c').text(storage.page + ' / ' + total_pages);
        if (storage.page > 1) {
            $('#pagination-ll, #pagination-sl').removeClass('inactive').addClass('active');
            $('#pagination-sl').attr({'data-page': storage.page - 1});
        }
        else {
            $('#pagination-ll, #pagination-sl').removeClass('active').addClass('inactive');
            $('#pagination-sl').attr({'data-page': 1});
        }
        if (storage.page < total_pages) {
            $('#pagination-rr, #pagination-sr').removeClass('inactive').addClass('active');
            $('#pagination-sr').attr({'data-page': storage.page + 1});
            $('#pagination-rr').attr({'data-page': total_pages});
        }
        else {
            $('#pagination-rr, #pagination-sr').removeClass('active').addClass('inactive');
            $('#pagination-sr').attr({'data-page': total_pages});
            $('#pagination-rr').attr({'data-page': total_pages});
        }
    });
}

function sd_init_map() {

    mapboxgl.accessToken = config.mapbox_token;

    storage.map = new mapboxgl.Map({
        container: 'sd-map',
        style: 'mapbox://styles/politik-bei-uns/cj7u916u61yey2rmwwl1wh1ik',
        center: [10.447683, 51.163375],
        zoom: 5
    });
    storage.map.addControl(new mapboxgl.NavigationControl(), 'top-left');

    var deref_map = new $.Deferred();
    var deref_data = new $.Deferred();

    $.when(deref_map, deref_data).done(function (mapready, data) {
        sd_init_map_data(mapready, data);
    });

    storage.map.on('load', function (data) {
        deref_map.resolve(data);
    });
    geo_params = {
        z: 5
    };
    $.post('/api/search/geo', geo_params, function (data) {
        deref_data.resolve(data);
    });
}

function sd_init_map_data(mapready, data) {
    storage.map.addSource('data-source', {
        type: 'geojson',
        data: data.data
    });
    storage.map.addLayer({
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
    storage.map.addLayer({
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
    storage.map.addLayer({
        id: 'data-layer-address',
        type: 'circle',
        source: 'data-source',
        filter: ["==", "$type", "Point"],
        paint: {
            'circle-radius': 7,
            'circle-color': '#428238'
        }
    }, 200);

    storage.map.addSource('search-source', {
        type: 'geojson',
        data: {
            type: 'FeatureCollection',
            features: []
        }
    });

    storage.map.addLayer({
        id: 'search-layer-street',
        type: 'line',
        source: 'search-source',
        filter: ["==", "$type", "LineString"],
        paint: {
            "line-color": "#A94739",
            "line-width": 5,
            "line-opacity": 0.5
        }
    }, 200);
    storage.map.addLayer({
        id: 'search-layer-address',
        type: 'fill',
        source: 'search-source',
        filter: ["==", "$type", "Polygon"],
        paint: {
            'fill-color': '#A94739',
            'fill-opacity': 0.5,
            'fill-outline-color': '#A94739'
        }
    }, 200);
    storage.map.addLayer({
        id: 'search-layer-address',
        type: 'circle',
        source: 'search-source',
        filter: ["==", "$type", "Point"],
        paint: {
            'circle-radius': 7,
            'circle-color': '#A94739'
        }
    }, 200);

    storage.map.on('mouseenter', 'data-layer-street', function () {
        storage.map.getCanvasContainer().style.cursor = 'pointer';
    });
    storage.map.on('mouseenter', 'data-layer-address', function () {
        storage.map.getCanvasContainer().style.cursor = 'pointer';
    });
    storage.map.on('mouseleave', 'data-layer-street', function () {
        storage.map.getCanvasContainer().style.cursor = '';
    });
    storage.map.on('mouseleave', 'data-layer-address', function () {
        storage.map.getCanvasContainer().style.cursor = '';
    });
    storage.map.on('click', 'data-layer-street', function (e) {
        sd_show_map_popup(e);
    });
    storage.map.on('click', 'data-layer-address', function (e) {
        sd_show_map_popup(e);
    });
    storage.map.on('moveend', function () {
        sd_update_map();
    });
    if (storage.fly_to) {
        storage.map.flyTo({
            center: storage.fly_to,
            zoom: 11
        });
        storage.fly_to = null;
    }
}

function sd_update_map() {
    bounds = storage.map.getBounds();
    geo_params = {
        z: storage.map.getZoom(),
        geo: [
            bounds.getWest(),// - (bounds.getEast() - bounds.getWest()),
            bounds.getNorth(),// + (bounds.getNorth() - bounds.getSouth()),
            bounds.getEast(),// + (bounds.getEast() - bounds.getWest()),
            bounds.getSouth()// - (bounds.getNorth() - bounds.getSouth())
        ].join(';')
    };
    $.post('/api/search/geo', geo_params, function (data) {
        storage.map.getSource('data-source').setData(data.data);
    });
}

function sd_show_map_popup(e) {
    var title = e.features[0].properties.name;
    if (e.features[0].properties.number)
        title += ' ' + e.features[0].properties.number;
    if (e.features[0].properties.locality)
        title += ', ' + e.features[0].properties.locality.replace('["', '').replace('"]', '');
    html = '<h4>' + title + '</h4>';
    html += '<p class="sd-map-popup-descr">' + ((e.features[0].properties.rgs) ? '<i class="fa fa-spinner fa-pulse fa-fw"></i>' : e.features[0].properties['paper-count']) + ' Dokumente gefunden</p>';
    html += '<p class="sd-map-popup-button"><button class="form-control" data-type="' + ((e.features[0].properties.rgs) ? 'region' : 'location') + '" data-id="' + ((e.features[0].properties.rgs) ? e.features[0].properties.rgs : e.features[0].properties.id) + '" data-title="' + title + '">Für Suche übernehmen</button></p>';
    storage.popup = new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(html)
        .addTo(storage.map);
    $('.sd-map-popup-button button').click(function (e) {
        e.preventDefault();
        storage.location_search.type = $(this).data('type');
        storage.location_search.id = $(this).data('id');
        $('#sd-location-summary span').text($(this).data('title'));
        $('#sd-location-summary-close').css({display: 'block'});
        /*if (storage.location_search.type == 'region') {
            $('#sd-body option').each(function () {
                if ($(this).data('rgs').substr(0, storage.location_search.id.length) == storage.location_search.id) {
                    $(this).prop('selected', true);
                }
                else {
                    $(this).prop('selected', false);
                }
            });
        }
        else {
            $('#sd-body option').prop('selected', true);
        }*/
        storage.popup.remove();
        $('#sd-form').trigger('submit');
    })
}

function get_url() {
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
        select_region(query_string.region);
    }
    if (query_string.text)
        $('#sd-fulltext').val(decodeURI(query_string.text));
    else
        $('#sd-fulltext').val('');

    if (query_string.f)
        storage.page = (query_string.f / 10) + 1;
    else
        storage.page = 1;

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
    storage.form_active = true;
}

function set_url(params) {
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
}

function ov_init_map_data(mapready, data) {
    storage.map.addSource('data-source', {
        type: 'geojson',
        data: data.data
    });
    storage.map.addLayer({
        id: 'data-layer-bodies',
        type: 'fill',
        source: 'data-source',
        paint: {
            'fill-color': '#428238',
            'fill-opacity': 0.5,
            'fill-outline-color': '#428238'
        }
    }, 200);
    storage.map.on('mouseenter', 'data-layer-bodies', function () {
        storage.map.getCanvasContainer().style.cursor = 'pointer';
    });
    storage.map.on('mouseleave', 'data-layer-bodies', function () {
        storage.map.getCanvasContainer().style.cursor = '';
    });
    storage.map.on('click', 'data-layer-bodies', function (e) {
        ov_show_map_popup(e);
    });
}

function ov_show_map_popup(e) {
    html = '<h4>' + e.features[0].properties.name + '</h4>';
    html += '<p class="ov-map-popup-button"><a class="form-control" href=\'/ratsdokumente?fq=' + encodeURI(JSON.stringify({ rgs: [e.features[0].properties.rgs]})) + '\'>Dokumenten-Suche</a></p>';
    storage.popup = new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(html)
        .addTo(storage.map);
}

function home_show_latest_documents() {
    var start = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
    var end = new Date();
    var random_seed = '';
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 16; i++) {
        random_seed += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    var params = {
        fq: {
            body: '_all',
            paperType: '_all'
        },
        date: JSON.stringify({
            min: start.toISOString().substr(0, 10),
            max: end.toISOString().substr(0, 10)
        }),
        f: 0,
        s: 5,
        rs: random_seed
    };
    $.post('/api/search', params, function (data) {
        html = '';
        for (var i = 0; i < data.data.length; i++) {
            html += '<div class="home-latest-document">';
            html += '<h4><a href="/document/' + data.data[i].id + '">' + ((data.data[i].name) ? data.data[i].name : 'Namenloses Dokument') + '</a></h4>';
            html += '<p>';
            html += ((data.data[i].paperType) ? data.data[i].paperType : 'Dokument');
            html += ' vom ' + format_datetime(data.data[i].created, 'date') + ' aus ' + data.data[i].body_name;
            html += '</div>';
        }
        $('#home-latest-documents').html(html);
    });

}

function update_region_overview() {
    region_list = '<h5 data-id="root">Weltweit</h5>';
    region_list += get_region_list(config.regions);
    $('#region-overview .modal-body').html(region_list);
    $('#region-overview h5').click(function() {
        select_region($(this).data('id'));
        $('#region-overview').modal('toggle');
    });
}

function get_region_list(regions) {
    var html = '<ul>';
    for (var i = 0; i < regions.length; i++) {
        html += '<li><h5 data-id="' + regions[i].id + '">' + regions[i].name + ' (<span>0</span>)</h5>';
        if (regions[i].children) {
            html +=  get_region_list(regions[i].children);
        }
        html += '</li>';
    }
    html += '</ul>';
    return(html);
}

function select_region(region_id) {
    region = get_region_data(config.regions, region_id, 0);
    $('#region-current').text(region.name).data('id', region.id);
    if (region.level == 0) {
        $('#region-parent').addClass('region-inactive');
        $('#region-parent').text('Eine Ebene hoch');
    }
    else {
        $('#region-parent').removeClass('region-inactive');
        if (region.level == 1) {
            $('#region-parent').text('Weltweit');
            $('#region-parent').data('id', 'root');
        }
        else if (region.parent) {
            $('#region-parent').data('id', region.parent.id);
            $('#region-parent').html(region.parent.name + ' (<span>0</span>)');
        }
    }
    $('#region-children').html('');
    if (region.children) {
        for (i = 0; i < region.children.length; i++) {
            $('#region-children').append('<div class="region-child" data-id="' + region.children[i].id + '">' + region.children[i].name + ' (<span>0</span>)</div>');
        }
        $('.region-child').click(function () {
            select_region($(this).data('id'));
        });
    }
    $('#sd-form').submit();
}

function get_region_data(regions, region_id, level) {
    if (region_id === 'root') {
        return {
            name: 'Weltweit',
            id: 'root',
            level: 0,
            children: config.regions
        };
    }
    else {
        for (var i = 0; i < regions.length; i++) {
            if (regions[i].id === region_id) {
                regions[i].level = level + 1;
                return (regions[i]);
            }
            if (regions[i].children) {
                child = get_region_data(regions[i].children, region_id, level + 1);
                if (child) {
                    if (!child.parent) {
                        child.parent = {
                            id: regions[i].id,
                            name: regions[i].name,
                            level: level + 1
                        };
                    }
                    return (child);
                }
            }
        }
    }
    return(false);
}

function get_children_bodies(regions) {
    var children = [];
    for (var i = 0; i < regions.length; i++) {
        if (regions[i].body) {
            children = children.concat(regions[i].body);
        }
        if (regions[i].children) {
            children = children.concat(get_children_bodies(regions[i].children));
        }
    }
    return(children);
}

function get_children_regions(regions) {
    var children = [];
    for (var i = 0; i < regions.length; i++) {
        if (regions[i].body) {
            children = children.concat(regions[i].id);
        }
        if (regions[i].children) {
            children = children.concat(get_children_bodies(regions[i].children));
        }
    }
    return(children);
}

function update_region_list_count(bodies) {
    $('.region-child, #region-parent').each(function () {
        region = get_region_data(config.regions, $(this).data('id'), 0);

        children = [];
        if (region.children) {
             children = children.concat(get_children_bodies(region.children));
        }
        if (region.id !== 'root' && region.body) {
            children = children.concat(region.body);
        }
        var count = 0;
        for (var i = 0; i < children.length; i++) {
            for (var j = 0; j < bodies.length; j++) {
                if (children[i] === bodies[j].key) {
                    count += bodies[j].doc_count;
                }
            }
        }
        $(this).find('span').text(count);

    });
}

function format_datetime(datetime, format) {
    if (!format)
        format = 'full';
    year = datetime.substr(0, 4);
    month = datetime.substr(5, 2);
    day = datetime.substr(8, 2);
    if (format === 'full') {
        hour = datetime.substr(11, 2);
        minute = datetime.substr(14, 2);
        return (day + '.' + month + '.' + year + ', ' + hour + ':' + minute + ' Uhr');
    }
    else if (format === 'date') {
         return (day + '.' + month + '.' + year);
    }
}


var GeoMinMax = function() {
    this.geo_first = true;
    this.geo_min_max = {
        lat: {
            min: null,
            max: null
        },
        lon: {
            min: null,
            max: null
        }
    };
    
    this.get_minmax = function(geojson) {
        if (geojson.geometry.type === 'Polygon' || geojson.geometry.type === 'MultiLineString') {
            this.iterate_geo(geojson.geometry.coordinates, 2);
        }
        else if (geojson.geometry.type === 'MultiPolygon') {
            this.iterate_geo(geojson.geometry.coordinates, 3);
        }
        return this.geo_min_max;
    };

    this.save_geo_min_max = function(geo) {
        if (geo[0] < this.geo_min_max.lon.min)
            this.geo_min_max.lon.min = geo[0];
        if (geo[0] > this.geo_min_max.lon.max)
            this.geo_min_max.lon.max = geo[0];
        if (geo[1] < this.geo_min_max.lat.min)
            this.geo_min_max.lat.min = geo[1];
        if (geo[1] > this.geo_min_max.lat.max)
            this.geo_min_max.lat.max = geo[1];
    };

    this.iterate_geo = function(data, level) {
        if (level > 0) {
            for (var i = 0; i < data.length; i++) {
                this.iterate_geo(data[i], level - 1);
            }
        }
        else {
            if (this.geo_first) {
                this.geo_first = false;
                this.geo_min_max.lon.min = this.geo_min_max.lon.max = data[0];
                this.geo_min_max.lat.min = this.geo_min_max.lat.max = data[1];
            }
            else {
                this.save_geo_min_max(data);
            }
        }
    };
};
