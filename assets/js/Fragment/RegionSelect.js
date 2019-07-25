import React from "react";
const { Component } = React;

export default class RegionSelect extends Component {
    box_id = 'region-select-box';
    update_region = false;

    state = {
        selectOpen: false,
        currentRegion: 'root'
    };

    constructor() {
        super();
        this.state.regions = $('#' + this.box_id).data('regions');
        window.addEventListener('click', () => {
            if (this.state.selectOpen) {
                this.setState({
                    selectOpen: false
                });
            }
        });
    }

    componentDidUpdate() {
        if (this.update_region) {
            this.update_region = false;
            window.paperSearch.page = 1;
            window.paperSearch.updateParams();
            window.paperSearch.updateData();
        }
    }

    render() {
        let region_data = this.getRegionData(this.state.regions, this.state.currentRegion, 0);
        let result = [
            <div id="region-current" onClick={this.toggleSelectOpen.bind(this)}>
                {region_data.name}
            </div>,
            <input type="hidden" id="region" name="region" value={region_data.id}/>
        ];
        if (this.state.selectOpen) {
            let children = [];
            if (region_data.children) {
                for (let i = 0; i < region_data.children.length; i++) {
                    children.push(
                        <div className="region-child"
                             onClick={this.selectRegion.bind(this, region_data.children[i].id)}>
                            {region_data.children[i].name}
                            {parseInt(region_data.children[i].count) === region_data.children[i].count &&
                                <span> ({region_data.children[i].count})</span>
                            }
                        </div>
                    )
                }
            }

            result.push(
                <div id="region-box-inner">
                    <div id="region-parent"
                         className={(region_data.id === 'root') ? 'region-inactive' : ''}
                         onClick={this.selectRegion.bind(this, (region_data.parent) ? region_data.parent.id : 'root')}>
                        {region_data.parent && <span>{region_data.parent.name}</span>}
                        {region_data.id !== 'root' && !region_data.parent && <span>Weltweit</span>}
                        {region_data.id === 'root' && <span>Eine Ebene hoch</span>}
                    </div>
                    <div id="region-children">
                        {children}
                    </div>
                </div>
            )
        }
        return (result)
    }

    toggleSelectOpen(evt) {
        this.setState({
            selectOpen: !this.state.selectOpen
        });
        evt.stopPropagation();
    }

    selectRegion(region_id, evt) {
        this.update_region = true;
        this.setState({
            currentRegion: region_id
        });
        evt.stopPropagation();
    }

    getRegionData(regions, region_id, level) {
        if (region_id === 'root') {
            return {
                name: 'Weltweit',
                id: 'root',
                level: 0,
                children: this.state.regions
            };
        }
        else {
            for (let i = 0; i < regions.length; i++) {
                if (regions[i].id === region_id) {
                    regions[i].level = level + 1;
                    return regions[i];
                }
                if (regions[i].children) {
                    let child = this.getRegionData(regions[i].children, region_id, level + 1);
                    if (child) {
                        if (!child.parent) {
                            child.parent = {
                                id: regions[i].id,
                                name: regions[i].name,
                                level: level + 1
                            };
                        }
                        return child;
                    }
                }
            }
        }
        return(false);
    };

    getChildrenBodies(regions) {
        let children = [];
        for (let i = 0; i < regions.length; i++) {
            if (regions[i].body) {
                children = children.concat(regions[i].body);
            }
            if (regions[i].children) {
                children = children.concat(this.getChildrenBodies(regions[i].children));
            }
        }
        return(children);
    };

    updateRegionListCount(bodies) {
        let bodies_dict = {};
        for (let i = 0; i < bodies.length; i++) {
            bodies_dict[bodies[i].key] = bodies[i].doc_count;
        }
        let regions = [];
        for (let i = 0; i < this.state.regions.length; i++) {
            regions.push(this.updateSubRegionListCount(this.state.regions[i], bodies_dict));
        }
        this.setState({
            regions: regions
        })
    }

    updateSubRegionListCount(region, bodies) {
        let count = 0;
        if (region.children) {
            for (let i = 0; i < region.children.length; i++) {
                region.children[i] = this.updateSubRegionListCount(region.children[i], bodies);
                if (region.children[i].count) {
                    count += region.children[i].count;
                }
            }
        }
        if (region.body) {
            for (let i = 0; i < region.body.length; i++) {
                if (bodies[region.body[i]]) {
                    count += bodies[region.body[i]];
                }
            }
        }
        region.count = count;
        return region;
    }
    /*
        let sum = 0;
        for (let i = 0; i < regions.length; i++) {
            let count = 0;
            if (regions[i].children) {
                let result = this.updateSubRegionListCount(regions[i].children, bodies);
                regions[i] = result[0];
                count += result[1];
            }
            if (regions[i].body && bodies[regions[i].body]) {
                count += bodies[regions[i].body];
                regions[i].count = count;
                sum += count;
            }

        }
        return([regions, sum]);
    }*/
}