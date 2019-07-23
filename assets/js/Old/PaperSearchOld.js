import RegionSelect from "./RegionSelect";
import PaperTypeSelect from "./PaperTypeSelect";

/*
generate_params() {
    let fq = {};

    // paperType
    if ($('#sd-type').val().length && $('#sd-type').val().length !== $('#sd-type option').length) {
        fq['paperType'] = $('#sd-type').val();
    }

    let region = $('#region-current').data('id');
    if (region !== 'root') {
        fq.region = region;
    }

    let legacy = $('#legacy').is(':checked');
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
            let min = $('#sd-date-min').val();
            if (min)
                min = min.substr(6, 4) + '-' + min.substr(3, 2) + '-' + min.substr(0, 2)
            else
                min = false;
        }
        catch (e) {
            let min = false;
        }
        try {
            let max = $('#sd-date-max').val();
            if (max)
                max = max.substr(6, 4) + '-' + max.substr(3, 2) + '-' + max.substr(0, 2)
            else
                max = false;
        }
        catch (e) {
            let max = false;
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
*/

    /*
    init_forms() {
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

        $('#sd-type, #order-by, #legacy').change(() => {
            this.paper_request();
        });
        $('#sd-date input').change(function () {
            modules.paper_search.send_date_request = true;
            setTimeout(() => {
                if (this.send_date_request) {
                    this.paper_request();
                }
                modules.paper_search.send_date_request = false;
            }, 50);
        });

        $('#sd-form').submit((e) => {
            e.preventDefault();
            if ($('#sd-fulltext').val()) {
                $('#order-by').val('_score');
            }

            this.paper_request();
        });

        $('.pagination-page').click((e) => {
            if ($(this).hasClass('active') && !this.first_request) {
                this.page_change = true;
                this.page = parseInt($(this).attr('data-page'));
                this.paper_request();
            }
        });

        $("#sd-fulltext").keypress((e) => {
            if (e.which === 13) {
                if ($('#sd-fulltext').val()) {
                    $('#order-by').val('_score');
                }
                this.paper_request();
            }
        });
    };

    init_subscribe_form() {
        $('#sd-search-subscribe').submit((evt) => {
            evt.preventDefault();
            let params = this.generate_params();
            params.fq = JSON.stringify(params.fq);
            params.csrf_token = $('#csrf_token').val();
            $.post('/account/search-subscribe', params, function (data) {
                window.location.href = data.redirect;
            });
        });
    };*/


    /*
    process_results(data) {
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
                html_fragments.push('Erstellt: ' + window.common.format_datetime(data[i].created));
            if (data[i].legacy)
                html_fragments.push('"Politik bei uns 1"-Dokument')
            html += '<div class="col-md-4">' + html_fragments.join('<br>') + '</div>';
            html += '</div>'
        }
        $('#sd-results').html(html);

        if (window.region) {
            window.region.update_region_list_count(aggs.body);
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

    get_url() {
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

    set_url(params) {
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
    */
};

export default class PaperSearch extends Component {
    dateRangeStart = moment().subtract(3, 'month');
    dateRangeEnd = moment();
    state = {
        page: 1,
        data: [],
        resultCount: 0,
        initialized: false,
        itemsPerPage: 25
    };
    params = {
        sort_field: 'random',
        sort_order: 'asc',
        page: 1,
        region: 'root',
        random_seed: '',
        daterange: this.dateRangeStart.format('DD.MM.YYYY') + ' - ' + this.dateRangeEnd.format('DD.MM.YYYY')
    };

    apiUrl = '/api/search/paper';
    formId = 'paper-search-form';

    sortDef = [
        { key: 'created', name: 'Erstellung' },
        { key: 'name', name: 'Name' },
        { key: 'random', name: 'Zufall' },
        { key: 'score', name: 'Priorität' }
    ];

    componentDidMount() {
        this.init();
        ReactDOM.render(
            <RegionSelect ref={(regionSelect) => {window.regionSelect = regionSelect}} />,
            document.getElementById("region-select-box")
        );
        ReactDOM.render(
            <PaperTypeSelect ref={(paperTypeSelect) => {window.paperTypeSelect = paperTypeSelect}} />,
            document.getElementById("paper-type-select-box")
        );

        this.updateData();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        $(".selectpicker").selectpicker('refresh');
        $('.btn-icon').tooltip()
    }

    init() {
        this.setRandomSeed();
        let form = $('#' + this.formId);
        $('#' + this.formId + ' select').change((event) => this.formSubmit(event));
        document.getElementById(this.formId).onsubmit = (event) => this.formSubmit(event);
        $('#daterange').daterangepicker({
            startDate: this.dateRangeStart,
            endDate: this.dateRangeEnd,
            ranges: window.common.daterangepicker_ranges,
            locale: window.common.daterangepicker_locale
        }, (start, end, label) => this.daterangepickerSubmit(start, end, label));
    }

    updateData() {
        let send = [];
        for (let key of Object.keys(this.params)) {
            if (Array.isArray(this.params[key])) {
                for (let i = 0; i < this.params[key].length; i++) {
                    send.push({
                        name: key,
                        value: this.params[key][i]
                    })
                }
            }
            else {
                send.push({
                    name: key,
                    value: this.params[key]
                })
            }
        }

        $.post(this.apiUrl, send)
            .then(data => {
                if (data.status)
                    return;
                this.setState({
                    data: data.data,
                    aggs: data.aggs,
                    initialized: true,
                    page: this.params.page,
                    resultCount: data.count,
                    pageMax: (data.count) ? Math.ceil(data.count / this.state.itemsPerPage) : 1
                });
                window.paperTypeSelect.setState({
                    data: data.aggs.paperType,
                    initialized: true
                })
            });
    }

    setRandomSeed() {
        var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < 16; i++) {
            this.params.random_seed += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    };

    formSubmit(event) {
        event.preventDefault();
        this.params.page = 1;
        this.updateParams();
        this.updateData();
    }

    daterangepickerSubmit(start, end, label) {
        this.params.page = 1;
        this.updateParams({
            daterange: start.format('DD.MM.YYYY') + ' - ' + end.format('DD.MM.YYYY')
        });
        this.updateData();
    }

    updateParams(overwrite) {
        if (!overwrite) {
            overwrite = {};
        }
        let ids = [];
        $('#' + this.formId + ' select, #' + this.formId + ' input, #' + this.formId + ' textarea').each(function () {
            if ($(this).attr('id')) {
                ids.push($(this).attr('id'));
            }
        });
        for (let i = 0; i < ids.length; i++){
            let item = $('#' + ids[i]);
            if (item.attr('name') === 'csrf_token')
                continue;
            if (item.attr('name') === 'submit')
                continue;
            if (Object.keys(overwrite).includes(item.attr('name'))) {
                this.params[item.attr('name')] = overwrite[item.attr('name')];
                continue;
            }
            let sub = item.val();
            if (sub && sub !== '_default' && sub !== '_all') {
                this.params[item.attr('name')] = sub;
                continue;
            }
            delete this.params[item.attr('name')];
        }
    }

    setPage(page) {
        if (page < 1 || page > this.state.pageMax)
            return;
        this.params.page = page;
        this.updateData();
    }

    render() {
        if (!this.state.initialized) {
            return (
                <div className={'search-table-loading'}>
                    ... wird geladen ...
                </div>
            );
        }
        return (
            <div className={'search-list'}>
                {this.renderStatusLineTop()}
                {this.renderList()}
                {this.renderStatusLineBottom()}
            </div>
        )
    }


    renderStatusLineTop() {
        return (
            <div className="row">
                <div className="col-md-12 search-table-result-header">
                    <div className="d-flex justify-content-between bd-highlight">
                        {this.renderStatusLineText()}
                        <div className="d-flex justify-content-end">
                            {this.renderPagination()}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    renderStatusLineBottom() {
        return (
            <div className="row">
                <div className="col-md-12 search-table-result-footer">
                    <div className="d-flex justify-content-end">
                        {this.renderPagination()}
                    </div>
                </div>
            </div>
        )
    }

    renderStatusLineText() {
        let sort_list = [];
        for (let i = 0; i < this.sortDef.length; i++) {
            let attrib = {};
            if (this.params.sort_field === this.sortDef[i].key) {
                attrib['selected'] = 'selected';
            }
            sort_list.push(
                <option value={this.sortDef[i].key} {...attrib}>{this.sortDef[i].name}</option>
            )
        }
        let attrib_asc = {};
        let attrib_desc = {};
        if (this.params.sort_order === 'asc') {
            attrib_asc['selected'] = 'selected';
        }
        else {
            attrib_desc['selected'] = 'selected';
        }
        return (
            <div className="d-flex justify-content-start search-table-result-header-text">
                <span>
                    {this.state.resultCount} Ergebnis{this.state.resultCount === 1 ? '' : 'se'}
                </span>
                <select id="sort_order" name="sort_order" onChange={(event) => this.formSubmit(event)} className="selectpicker" data-width="fit">
                    <option value="asc" {...attrib_asc}>aufsteigend</option>
                    <option value="desc" {...attrib_desc}>absteigend</option>
                </select>
                <span>
                    sortiert nach
                </span>
                <select id="sort_field" name="sort_field" onChange={(event) => this.formSubmit(event)} className="selectpicker" data-width="fit" data-showIcon="false">
                    {sort_list}
                </select>
            </div>
        )
    }

    renderPagination() {
        return(
            <nav aria-label="pagination">
                <ul className="pagination justify-content-end">
                    <li className={'page-item' + (this.state.page === 1 ? ' disabled' : '')}>
                        <a className="page-link" href="#" aria-label="first" onClick={this.setPage.bind(this, 1)}>
                            <span aria-hidden="true">&laquo;</span>
                        </a>
                    </li>
                    <li className={'page-item' + (this.state.page === 1 ? ' disabled' : '')}>
                        <a className="page-link" href="#" aria-label="previous" onClick={this.setPage.bind(this, this.state.page - 1)}>
                            <span aria-hidden="true">&lsaquo;</span>
                        </a>
                    </li>
                    <li className="page-item disabled">
                        <span className="page-link">{this.state.page}/{this.state.pageMax}</span>
                    </li>
                    <li className={'page-item' + (this.state.page >= this.state.pageMax ? ' disabled' : '')}>
                        <a className="page-link" href="#" aria-label="next" onClick={this.setPage.bind(this, this.state.page + 1)}>
                            <span aria-hidden="true">&rsaquo;</span>
                        </a>
                    </li>
                    <li className={'page-item' + (this.state.page >= this.state.pageMax ? ' disabled' : '')}>
                        <a className="page-link" href="#" aria-label="last" onClick={this.setPage.bind(this, this.state.pageMax)}>
                            <span aria-hidden="true">&raquo;</span>
                        </a>
                    </li>
                </ul>
            </nav>
        )
    }

    renderList() {
        let items = [];
        for (let i = 0; i < this.state.data.length; i++) {
            items.push(this.renderListItem(this.state.data[i]))
        }
        return(
            <div>
                {items}
            </div>
        )
    }

    renderListItem(row) {
        return (
            <div className="row">
                <div className="col-md-8">
                    <h5>
                        <a href={`/paper/${row.id}`}>{row.name}</a>
                    </h5>
                </div>
                <div className="col-md-4">
                    <p><i className="fa fa-map-marker" aria-hidden="true"></i> {row.body_name}</p>
                    {row.paperType &&
                        <p><i className="fa fa-tag" aria-hidden="true"></i> {row.paperType}</p>
                    }
                    {row.reference &&
                        <p><i className="fa fa-list-ol" aria-hidden="true"></i> {row.reference}</p>
                    }
                    {row.date &&
                        <p><i className="fa fa-calendar" aria-hidden="true"></i> {window.common.formatDate(row.date)}</p>
                    }
                </div>
            </div>
        )
    }

    /*
    generate_params() {
        let fq = {};

        // paperType
        if ($('#sd-type').val().length && $('#sd-type').val().length !== $('#sd-type option').length) {
            fq['paperType'] = $('#sd-type').val();
        }

        let region = $('#region-current').data('id');
        if (region !== 'root') {
            fq.region = region;
        }

        let legacy = $('#legacy').is(':checked');
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
                let min = $('#sd-date-min').val();
                if (min)
                    min = min.substr(6, 4) + '-' + min.substr(3, 2) + '-' + min.substr(0, 2)
                else
                    min = false;
            }
            catch (e) {
                let min = false;
            }
            try {
                let max = $('#sd-date-max').val();
                if (max)
                    max = max.substr(6, 4) + '-' + max.substr(3, 2) + '-' + max.substr(0, 2)
                else
                    max = false;
            }
            catch (e) {
                let max = false;
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
    */

    /*
    init_forms() {
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

        $('#sd-type, #order-by, #legacy').change(() => {
            this.paper_request();
        });
        $('#sd-date input').change(function () {
            modules.paper_search.send_date_request = true;
            setTimeout(() => {
                if (this.send_date_request) {
                    this.paper_request();
                }
                modules.paper_search.send_date_request = false;
            }, 50);
        });

        $('#sd-form').submit((e) => {
            e.preventDefault();
            if ($('#sd-fulltext').val()) {
                $('#order-by').val('_score');
            }

            this.paper_request();
        });

        $('.pagination-page').click((e) => {
            if ($(this).hasClass('active') && !this.first_request) {
                this.page_change = true;
                this.page = parseInt($(this).attr('data-page'));
                this.paper_request();
            }
        });

        $("#sd-fulltext").keypress((e) => {
            if (e.which === 13) {
                if ($('#sd-fulltext').val()) {
                    $('#order-by').val('_score');
                }
                this.paper_request();
            }
        });
    };

    init_subscribe_form() {
        $('#sd-search-subscribe').submit((evt) => {
            evt.preventDefault();
            let params = this.generate_params();
            params.fq = JSON.stringify(params.fq);
            params.csrf_token = $('#csrf_token').val();
            $.post('/account/search-subscribe', params, function (data) {
                window.location.href = data.redirect;
            });
        });
    };*/


    /*
    process_results(data) {
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
                html_fragments.push('Erstellt: ' + window.common.format_datetime(data[i].created));
            if (data[i].legacy)
                html_fragments.push('"Politik bei uns 1"-Dokument')
            html += '<div class="col-md-4">' + html_fragments.join('<br>') + '</div>';
            html += '</div>'
        }
        $('#sd-results').html(html);

        if (window.region) {
            window.region.update_region_list_count(aggs.body);
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

    get_url() {
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

    set_url(params) {
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
    */