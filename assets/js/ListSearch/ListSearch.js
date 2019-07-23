import React from "react";
const { Component } = React;

export default class ListSearch extends Component {
    state = {
        page: 1,
        data: [],
        resultCount: 0,
        initialized: false,
        itemsPerPage: 25
    };
    params = {
    };

    apiUrl = '';
    formId = '';

    sortDef = [
    ];

    componentDidMount() {
        this.init();
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
                this.processData(data);
            });
    }

    processData(data) {

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

};