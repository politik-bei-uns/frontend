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
    //init form
    $('#sd-body option').prop("selected", true);

    // init date
    $('#sd-date').datepicker({
        format: 'dd.mm.yyyy',
        maxViewMode: 2,
        language: 'de',
        orientation: 'bottom auto'
    });

    // init bodies
    $('#sd-body').multiselect({
        includeSelectAllOption: true,
        allSelectedText: 'alles ausgewählt',
        nonSelectedText: 'bitte wählen',
        selectAllText: 'alles auswählen',
        buttonClass: 'form-control',
        buttonContainer: '<div class="btn-group bootstrap-multiselect" />'

    });
    $('#sd-type').multiselect({
        includeSelectAllOption: true,
        allSelectedText: 'alles ausgewählt',
        nonSelectedText: 'bitte wählen',
        selectAllText: 'alles auswählen',
        buttonClass: 'form-control',
        buttonContainer: '<div class="btn-group bootstrap-multiselect" />'

    });

    $('#sd-body').change(function () {
        $('#sd-form').submit();
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
        $('#sd-body option').prop('selected', true);
        $('#sd-body').multiselect('refresh');
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
}

function generate_params() {
    fq = {};
    // body
    if ($('#sd-body').val().length == $('#sd-body option').length) {
        fq.body = '_all';
    }
    else if ($('#sd-body').val().length) {
        fq['body'] = $('#sd-body').val();
    }

    // location
    if (storage.location_search.type == 'location') {
        fq['location'] = [storage.location_search.id]
    }

    // paperType
    if ($('#sd-type').val().length == $('#sd-type option').length) {
        fq.paperType = '_all';
    }
    else if ($('#sd-type').val().length) {
        fq['paperType'] = $('#sd-type').val();
    }

    params = {
        q: $('#sd-fulltext').val(),
        fq: JSON.stringify(fq),
        f: (storage.page * 10) - 10,
        o: $('#order-by').val(),
        rs: storage.random_seed
    };
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
        if ($('#order-by').val() == '_score' || !$('#order-by').val()) {
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

    $.post('/api/search', params, function (data) {
        num_results = data.count;
        $('#sd-results-summary-count').text(num_results);
        html = '';
        aggs = data.aggs;
        data = data.data;
        for (var i = 0; i < data.length; i++) {
            html += '<div class="row' + ((i % 2 == 0) ? ' row-alt': '') + '">';
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
            bounds.getSouth(),// - (bounds.getNorth() - bounds.getSouth())
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
        if (storage.location_search.type == 'region') {
            $('#sd-body option').each(function () {
                if ($(this).data('rgs').substr(0, storage.location_search.id.length) == storage.location_search.id) {
                    $(this).prop('selected', true);
                }
                else {
                    $(this).prop('selected', false);
                }
            });
            $('#sd-body').multiselect('refresh');
        }
        else {
            $('#sd-body option').prop('selected', true);
        }
        storage.popup.remove();
        $('#sd-form').trigger('submit');
    })
}

function get_url() {
    cut = window.location.href.indexOf('?');
    var query_string = {};
    if (cut != -1) {
        var vars = window.location.href.substr(cut + 1).split("&");

        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split('=');
            query_string[pair[0]] = pair[1];
        }
    }
    if (query_string.text)
        $('#sd-fulltext').val(decodeURI(query_string.text))
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
            if (fq.paperType == '_all') {
                $('#sd-type').multiselect('selectAll');
            }
            else {
                $('#sd-type').multiselect('deselectAll');
                $('#sd-type').multiselect('select', fq.paperType);
            }
        }
        if (fq.body) {
            if (fq.body == '_all') {
                $('#sd-body').multiselect('selectAll');
            }
            else {
                text = [];
                $('#sd-body option').prop('selected', false);
                for (var i = 0; i < fq.body.length; i++) {
                    text.push($('#sd-body option[value="' + fq.body[i] + '"]').prop('selected', true).text());
                }
                $('#sd-location-summary span').text(text.join(', '));
                $('#sd-location-summary-close').css({display: 'block'});
                $('#sd-body').multiselect('refresh');
            }
        }
        if (fq.rgs) {
            if (fq.rgs == '_all') {
                $('#sd-body').multiselect('selectAll');
            }
            else {
                text = [];
                $('#sd-body option').prop('selected', false);
                for (var i = 0; i < fq.rgs.length; i++) {
                    text.push($('#sd-body option[data-rgs="' + fq.rgs[i] + '"]').prop('selected', true).text());
                }
                $('#sd-location-summary span').text(text.join(', '));
                $('#sd-location-summary-close').css({display: 'block'});
                $('#sd-body').multiselect('refresh');
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
        url.push('fq=' + encodeURI(params.fq));
    }
    if (params.date) {
        url.push('date=' + encodeURI(params.date));
    }
    if ((params.q && params.o != '_score') || (!params.q && params.o != 'random')) {
        url.push('order=' + params.o);
    }

    url = url.join('&');
    if (url) {
        url = '?' + url;
    }
    history.pushState(null, 'Ratsdokumente | Politik bei Uns', '/ratsdokumente' + url)
}

function save_geo_min_max(geo) {
    if (geo[0] < storage.geo_min_max.lon.min)
        storage.geo_min_max.lon.min = geo[0];
    if (geo[0] > storage.geo_min_max.lon.max)
        storage.geo_min_max.lon.max = geo[0];
    if (geo[1] < storage.geo_min_max.lat.min)
        storage.geo_min_max.lat.min = geo[1];
    if (geo[1] > storage.geo_min_max.lat.max)
        storage.geo_min_max.lat.max = geo[1];
}

function iterate_geo(data, level) {
    if (level > 0) {
        for (var i = 0; i < data.length; i++) {
            iterate_geo(data[i], level - 1);
        }
    }
    else {
        if (storage.geo_first) {
            storage.geo_first = false;
            storage.geo_min_max.lon.min = storage.geo_min_max.lon.max = data[0];
            storage.geo_min_max.lat.min = storage.geo_min_max.lat.max = data[1];
        }
        else {
            save_geo_min_max(data)
        }
    }
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

function format_datetime(datetime, format) {
    if (!format)
        format = 'full';
    year = datetime.substr(0, 4);
    month = datetime.substr(5, 2);
    day = datetime.substr(8, 2);
    if (format == 'full') {
        hour = datetime.substr(11, 2);
        minute = datetime.substr(14, 2);
        return (day + '.' + month + '.' + year + ', ' + hour + ':' + minute + ' Uhr');
    }
    else if (format == 'date') {
         return (day + '.' + month + '.' + year);
    }
}
