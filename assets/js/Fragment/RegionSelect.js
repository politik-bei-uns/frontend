import React from "react";
const { Component } = React;

export default class RegionSelect extends Component {
    box_id = 'region-select-box';

    state = {
        selectOpen: false,
        currentRegion: 'root'
    };

    constructor() {
        super();
        this.regions = $('#' + this.box_id).data('regions');
    }

    componentDidUpdate() {
        window.paperSearch.page = 1;
        window.paperSearch.updateParams();
        window.paperSearch.updateData();
    }

    render() {
        let region_data = this.getRegionData(this.regions, this.state.currentRegion, 0);
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
                        </div>
                    )
                }
            }

            result.push(
                <div id="region-box-inner">
                    <div id="region-parent"
                         className={(region_data.id === 'root') ? 'region-inactive' : ''}
                         onClick={this.selectRegion.bind(this, (region_data.parent) ? region_data.parent.id : 'root')}>
                        Eine Ebene hoch
                    </div>
                    <div id="region-children">
                        {children}
                    </div>
                </div>
            )
        }
        return (result)
    }

    toggleSelectOpen() {
        this.setState({
            selectOpen: !this.state.selectOpen
        });
    }

    selectRegion(region_id) {

        this.setState({
            currentRegion: region_id
        })
    }


    select_region(region_id) {
        let region = this.get_region_data(config.regions, region_id, 0);
        $('#region-current').text(region.name).data('id', region.id);
        if (region.level === 0) {
            $('#region-parent').addClass('region-inactive').text('Eine Ebene hoch');
        }
        else {
            $('#region-parent').removeClass('region-inactive');
            if (region.level === 1) {
                $('#region-parent').text('Weltweit').data('id', 'root');
            }
            else if (region.parent) {
                $('#region-parent').data('id', region.parent.id).html(region.parent.name + ' (<span>0</span>)');
            }
        }
        $('#region-children').html('');
        if (region.children) {
            for (let i = 0; i < region.children.length; i++) {
                $('#region-children').append('<div class="region-child" data-id="' + region.children[i].id + '">' + region.children[i].name + ' (<span>0</span>)</div>');
            }
            $('.region-child').click(() => {
                this.select_region($(this).data('id'));
            });
        }
        $('#sd-form').submit();
    };

    getRegionData(regions, region_id, level) {
        if (region_id === 'root') {
            return {
                name: 'Weltweit',
                id: 'root',
                level: 0,
                children: this.regions
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
        $('.region-child, #region-parent').each(() => {
            let region = this.get_region_data(config.regions, $(this).data('id'), 0);

            let children = [];
            if (region.children) {
                 children = children.concat(this.get_children_bodies(region.children));
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
    };


}