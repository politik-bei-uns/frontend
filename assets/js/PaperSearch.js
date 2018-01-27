var PaperSearch = function () {

    this.first_request = true;
    this.page = 1;
    this.page_change = true;
    this.browser_nav_action = false;
    this.random_seed = false;


    this.init = function () {
        window.addEventListener('popstate', function () {
            modules.document_search.browser_nav_action = true;
            modules.document_search.get_url();
        });

        this.set_random();
        this.init_forms();
        this.init_subscribe_form();
        this.get_url();
        $('#sd-form').trigger('submit');
    };

    this.set_random = function () {
        this.random_seed = '';
        var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < 16; i++) {
            this.random_seed += chars.charAt(Math.floor(Math.random() * chars.length));
        }
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

        $('#sd-type, #order-by, #legacy').change(function () {
            modules.document_search.paper_request();
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

        $('.pagination-page').click(function (e) {
            if ($(this).hasClass('active') && !modules.document_search.first_request) {
                modules.document_search.page_change = true;
                modules.document_search.page = parseInt($(this).attr('data-page'));
                modules.document_search.paper_request();
            }
        });
    };

    this.init_subscribe_form = function () {
        $('#sd-search-subscribe').submit(function (evt) {
            evt.preventDefault();
            params = modules.document_search.generate_params();
            params.fq = JSON.stringify(params.fq);
            params.csrf_token = $('#csrf_token').val();
            $.post('/account/search-subscribe', params, function (data) {
                window.location.href = data.redirect;
            });
        });
    };


    this.generate_params = function () {
        var fq = {};

        // paperType
        if ($('#sd-type').val().length && $('#sd-type').val().length !== $('#sd-type option').length) {
            fq['paperType'] = $('#sd-type').val();
        }

        var region = $('#region-current').data('id');
        if (region !== 'root') {
            fq.region = region;
        }

        var legacy = $('#legacy').is(':checked');
        if (legacy) {
            fq.legacy = 1;
        }

        var params = {
            q: $('#sd-fulltext').val(),
            fq: fq,
            f: (this.page * 10) - 10,
            o: $('#order-by').val(),
            rs: this.random_seed
        };
        if (self.first_request) {
            params.fq = 1;
        }

        if ($('#sd-date-min').val() || $('#sd-date-max').val()) {
            try {
                min = $('#sd-date-min').val();
                if (min)
                    min = min.substr(6, 4) + '-' + min.substr(3, 2) + '-' + min.substr(0, 2)
                else
                    min = false;
            }
            catch (e) {
                min = false;
            }
            try {
                max = $('#sd-date-max').val();
                if (max)
                    max = max.substr(6, 4) + '-' + max.substr(3, 2) + '-' + max.substr(0, 2)
                else
                    max = false;
            }
            catch (e) {
                max = false;
            }
            if (min || max) {
                params.rq = {
                    modified: {}
                };
                if (min) {
                    params.rq.modified.gte = min + 'T00:00:00'
                }
                if (max) {
                    params.rq.modified.lte = max + 'T23:59:59'
                }
                params.rq = JSON.stringify(params.rq);
            }
        }
        return params;
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
            html += '<div class="col-md-8"><h4><a href="/paper/' + data[i].id + '">' + (data[i].name ? data[i].name : 'Unbenanntes Dokument') + '</a></h4></div>';
            html_fragments = [];
            if (data[i].body_name)
                html_fragments.push('Körperschaft: ' + data[i].body_name);
            if (data[i].paperType)
                html_fragments.push('Typ: ' + data[i].paperType);
            if (data[i].reference)
                html_fragments.push('Referenz: ' + data[i].reference);
            if (data[i].created)
                html_fragments.push('Erstellt: ' + modules.common.format_datetime(data[i].created));
            if (data[i].legacy)
                html_fragments.push('"Politik bei uns 1"-Dokument')
            html += '<div class="col-md-4">' + html_fragments.join('<br>') + '</div>';
            html += '</div>'
        }
        $('#sd-results').html(html);

        if (modules.region) {
            modules.region.update_region_list_count(aggs.body);
        }

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
            $('#sd-fulltext').val(decodeURIComponent(query_string.text));
        else
            $('#sd-fulltext').val('');

        if (query_string.f)
            this.page = (query_string.f / 10) + 1;
        else
            this.page = 1;

        if (query_string.date) {
            startend = JSON.parse(decodeURIComponent(query_string.date));
            $('#sd-date-min').val(startend.min.substr(8, 2) + '-' + startend.min.substr(5, 2) + '-' + startend.min.substr(0, 4));
            $('#sd-date-max').val(startend.max.substr(8, 2) + '-' + startend.max.substr(5, 2) + '-' + startend.max.substr(0, 4));
        }
        if (query_string.fq) {
            fq = JSON.parse(decodeURIComponent(query_string.fq));
            if (fq.paperType) {
                $('#sd-type').multiselect('deselectAll');
                $('#sd-type').multiselect('select', fq.paperType);

            }
            else {
                $('#sd-type').multiselect('selectAll');
            }
            if (fq.region) {
                modules.region.select_region(fq.region);
            }
            if (fq.legacy) {
                if (parseInt(fq.legacy) === 1) {
                    $('#legacy').attr('checked', true);
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
            url.push('text=' + encodeURIComponent(params.q));
        }
        if (params.f) {
            url.push('f=' + params.f)
        }
        if (params.fq) {
            var fq = JSON.stringify(params.fq);
            if (fq !== '{}') {
                url.push('fq=' + encodeURIComponent(fq));
            }
        }
        if (params.date) {
            url.push('date=' + encodeURIComponent(params.date));
        }
        if ((params.q && params.o !== '_score') || (!params.q && params.o !== 'random')) {
            url.push('order=' + params.o);
        }

        url = url.join('&');
        if (url) {
            url = '?' + url;
        }
        history.pushState(null, 'Ratsdokumente | Politik bei Uns', '/ratsdokumente/suche' + url)
    };


};