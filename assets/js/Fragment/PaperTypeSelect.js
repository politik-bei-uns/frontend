import React from "react";
const { Component } = React;

export default class RegionSelect extends Component {
    box_id = 'paper-type-select-box';

    state = {
        selected: null,
        initialized: false
    };
    firstRun = true;

    componentDidUpdate() {
        if (this.firstRun) {
            this.firstRun = false;
            $('#type').multiselect(window.common.multiselect_options);
            $('#type').change(() => {
                this.setState({
                    selected: $('#type').val()
                });
                window.paperSearch.page = 1;
                window.paperSearch.updateParams();
                window.paperSearch.updateData();
            });
        }
        else {
            $('#type').multiselect('refresh');
        }
    }


    render() {
        if (!this.state.initialized) {
            return(<select id="type" name="type" className="form-control"></select>);
        }
        let items = [];
        let item_values = [];
        for (let i = 0; i < this.state.data.length; i++) {
            items.push(
                <option value={this.state.data[i].key}>
                    {this.state.data[i].key} ({this.state.data[i].doc_count})
                </option>
            );
            item_values.push(this.state.data[i].key);
        }
        return (
            <select
                id="type"
                name="type"
                className="form-control"
                multiple={true}
                value={(this.state.selected) ? this.state.selected: item_values} onChange={this.handleChange}>
                {items}
            </select>
        )
    }
}