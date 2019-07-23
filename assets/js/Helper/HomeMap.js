import mapboxgl from 'mapbox-gl'
import React from "react";
import ReactDOM from "react-dom";

export default class HomeMap {
    constructor() {
        mapboxgl.accessToken = config.mapbox_token;

        this.map = new mapboxgl.Map({
            container: 'overview-map',
            style: 'mapbox://styles/politik-bei-uns/cj7u916u61yey2rmwwl1wh1ik',
            center: [10.447633, 52.2],
            zoom: 6
        });
        this.map.addControl(new mapboxgl.NavigationControl(), 'top-left');

        let deref_map = new $.Deferred();
        let deref_data = new $.Deferred();

        $.when(deref_map, deref_data).done((mapready, data) => this.initMapData(mapready, data));

        this.map.on('load', function (data) {
            deref_map.resolve(data);
        });
        let map_level = $('#map-level');
        let geo_params = {
            z: parseInt(map_level.val()),
            bc: 1,
            fq: JSON.stringify({legacy: 1})
        };
        map_level.change(() => this.updateMap());
        $.post('/api/search/geo', geo_params).then(function (data) {
            deref_data.resolve(data);
        });
    };


    initMapData(mapready, data) {
        this.map.addSource('data-source', {
            type: 'geojson',
            data: data.data
        });
        this.map.addLayer({
            id: 'data-layer-bodies-current',
            type: 'fill',
            source: 'data-source',
            filter: ['==', 'legacy', false],
            paint: {
                'fill-color': '#428238',
                'fill-opacity': 0.5,
                'fill-outline-color': '#428238'
            }
        });
        this.map.addLayer({
            id: 'data-layer-bodies-legacy',
            type: 'fill',
            source: 'data-source',
            filter: ['==', 'legacy', true],
            paint: {
                'fill-color': '#dcc400',
                'fill-opacity': 0.5,
                'fill-outline-color': '#dcc400'
            }
        });

        this.map.on('mouseenter', 'data-layer-bodies-current', () => {
            this.map.getCanvasContainer().style.cursor = 'pointer';
        });
        this.map.on('mouseleave', 'data-layer-bodies-current', () => {
            this.map.getCanvasContainer().style.cursor = '';
        });
        this.map.on('click', 'data-layer-bodies-current', (e) => this.showMapPopup(e));
        this.map.on('mouseenter', 'data-layer-bodies-legacy', () => {
            this.map.getCanvasContainer().style.cursor = 'pointer';
        });
        this.map.on('mouseleave', 'data-layer-bodies-legacy', () => {
            this.map.getCanvasContainer().style.cursor = '';
        });
        this.map.on('click', 'data-layer-bodies-legacy', (e) => this.showMapPopup(e));
    }

    updateMap () {
        let geo_params = {
            z: parseInt($('#map-level').val()),
            bc: 1,
            fq: JSON.stringify({legacy: 1})
        };
        $.post('/api/search/geo', geo_params).then((data) => this.map.getSource('data-source').setData(data.data));
    }

    showMapPopup (e) {
        let container = document.createElement('div');
        ReactDOM.render(this.renderMapPopup(e.features[0].properties), container);
        this.popup = new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setDOMContent(container)
            .addTo(this.map);
    }

    renderMapPopup(properties) {
        let fq = encodeURIComponent(JSON.stringify({
            region: properties.id
        }));
        return (
            <div>
                <h4>{properties.name}</h4>
                {properties.legacy &&
                    <p>Wird nicht mehr aktualisiert.</p>
                }
                <p className="ov-map-popup-button">
                    <a className="form-control" href={`/ratsdokumente/suche?fq=${fq}`}>Dokumenten-Suche</a>
                </p>
            </div>
        );
    }

};