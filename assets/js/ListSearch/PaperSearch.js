import React from "react";
import ReactDOM from "react-dom";
import RegionSelect from "../Fragment/RegionSelect";
import PaperTypeSelect from "../Fragment/PaperTypeSelect"
import ListSearch from './ListSearch'

export default class PaperSearch extends ListSearch {
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

    init() {
        super.init();
        $('#daterange').daterangepicker({
            startDate: this.dateRangeStart,
            endDate: this.dateRangeEnd,
            ranges: window.common.daterangepicker_ranges,
            locale: window.common.daterangepicker_locale
        }, (start, end, label) => this.daterangepickerSubmit(start, end, label));
    }

    processData(data) {
        window.paperTypeSelect.setState({
            data: data.aggs.paperType,
            initialized: true
        });
        window.regionSelect.updateRegionListCount(data.aggs.body);
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
};