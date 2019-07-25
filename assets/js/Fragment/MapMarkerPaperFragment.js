import React from "react";
const { Component } = React;

export default class MapMarkerPaperFragment extends Component {
    state = {
        initialized: false
    };

    componentDidMount() {
        if (!this.props.properties.rgs)
            return;
        let params = {
            sort_field: 'created',
            sort_order: 'asc',
            page: 1,
            region: this.props.properties.id
        };
        $.post(window.paperGeo.apiUrl, params, (data) => {
            this.setState({
                count: data.count,
                initialized: true
            });
        });
    }


    render() {
        return (
            <div>
                <h4>
                    {this.props.properties.name}
                    {this.props.properties.number &&
                        <span> {this.props.properties.number}</span>
                    }
                    {this.props.properties.locality &&
                        <span>, {this.props.properties.locality.replace('["', '').replace('"]', '')}</span>
                    }
                </h4>
                <p className="sd-map-popup-descr">
                    {this.props.properties.rgs &&
                        <span>
                            {this.state.initialized &&
                                <span>{this.state.count}</span>
                            }
                            {!this.state.initialized &&
                                <i className="fa fa-spinner fa-pulse fa-fw"></i>
                            }
                            {' '}Dokumente gefunden
                        </span>
                    }
                </p>
                <p className="sd-map-popup-button">
                    <span
                        className="btn form-control"
                        onClick={window.paperGeo.selectMapItem.bind(window.paperGeo, (this.props.properties.rgs) ? 'region' : 'location', this.props.properties.id)}
                    >
                        An diesem Ort suchen
                    </span>
                </p>
            </div>
        );
    }
}