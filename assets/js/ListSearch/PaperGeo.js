import mapboxgl from 'mapbox-gl'
import React from "react";
import ReactDOM from "react-dom";
import ListSearch from './ListSearch'
import MapMarkerPaperFragment from '../Fragment/MapMarkerPaperFragment';

export default class PaperGeo extends ListSearch {
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
    };

    apiUrl = '/api/search/paper';
    formId = 'paper-geo-form';

    sortDef = [
        { key: 'created', name: 'Erstellung' },
        { key: 'name', name: 'Name' },
        { key: 'random', name: 'Zufall' },
        { key: 'score', name: 'Priorität' }
    ];

    componentDidMount() {
        this.init();
        this.updateData();
    }

    init() {
        super.init();
        this.initMap();
    }

    initMap() {
        mapboxgl.accessToken = config.mapbox_token;

        this.map = new mapboxgl.Map({
            container: 'sd-map',
            style: 'mapbox://styles/politik-bei-uns/cj7u916u61yey2rmwwl1wh1ik',
            center: [10.447683, 51.163375],
            zoom: 5
        });
        this.map.addControl(new mapboxgl.NavigationControl(), 'top-left');

        let deref_map = new $.Deferred();
        let deref_data = new $.Deferred();

        $.when(deref_map, deref_data).done((mapready, data) => {
            this.initMapData(data);
        });

        this.map.on('load', function (data) {
            deref_map.resolve(data);
        });
        let geo_params = {
            z: 5
        };
        $.post('/api/search/geo', geo_params, function (data) {
            deref_data.resolve(data);
        });
    }

    initMapData(data) {
        this.map.addSource('data-source', {
            type: 'geojson',
            data: data.data
        });
        this.map.addLayer({
            id: 'data-layer-line-string',
            type: 'line',
            source: 'data-source',
            filter: ["==", "$type", "LineString"],
            paint: {
                "line-color": "#428238",
                "line-width": 5,
                "line-opacity": 0.5
            }
        });
        this.map.addLayer({
            id: 'data-layer-polygon',
            type: 'fill',
            source: 'data-source',
            filter: ['all', ["==", "$type", "Polygon"], ['!=', 'legacy', true]],
            paint: {
                'fill-color': '#428238',
                'fill-opacity': 0.5,
                'fill-outline-color': '#428238'
            }
        });
        this.map.addLayer({
            id: 'data-layer-polygon-legacy',
            type: 'fill',
            source: 'data-source',
            filter: ['all', ["==", "$type", "Polygon"], ['==', 'legacy', true]],
            paint: {
                'fill-color': '#dcc400',
                'fill-opacity': 0.5,
                'fill-outline-color': '#dcc400'
            }
        });
        this.map.addLayer({
            id: 'data-layer-point',
            type: 'circle',
            source: 'data-source',
            filter: ["==", "$type", "Point"],
            paint: {
                'circle-radius': 7,
                'circle-color': '#428238'
            }
        });

        this.map.addSource('search-source', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: []
            }
        });

        this.map.addLayer({
            id: 'search-layer-line-string',
            type: 'line',
            source: 'search-source',
            filter: ["==", "$type", "LineString"],
            paint: {
                "line-color": "#A94739",
                "line-width": 5,
                "line-opacity": 0.5
            }
        });
        this.map.addLayer({
            id: 'search-layer-polygon',
            type: 'fill',
            source: 'search-source',
            filter: ["==", "$type", "Polygon"],
            paint: {
                'fill-color': '#A94739',
                'fill-opacity': 0.5,
                'fill-outline-color': '#A94739'
            }
        });
        this.map.addLayer({
            id: 'search-layer-point',
            type: 'circle',
            source: 'search-source',
            filter: ["==", "$type", "Point"],
            paint: {
                'circle-radius': 7,
                'circle-color': '#A94739'
            }
        });

        this.map.on('mouseenter', 'data-layer-line-string', () => {
            this.map.getCanvasContainer().style.cursor = 'pointer';
        });
        this.map.on('mouseenter', 'data-layer-polygon', () => {
            this.map.getCanvasContainer().style.cursor = 'pointer';
        });
        this.map.on('mouseenter', 'data-layer-polygon-legacy', () => {
            this.map.getCanvasContainer().style.cursor = 'pointer';
        });
        this.map.on('mouseenter', 'data-layer-point', () => {
            this.map.getCanvasContainer().style.cursor = 'pointer';
        });
        this.map.on('mouseleave', 'data-layer-line-string', () => {
            this.map.getCanvasContainer().style.cursor = '';
        });
        this.map.on('mouseleave', 'data-layer-polygon', () => {
            this.map.getCanvasContainer().style.cursor = '';
        });
        this.map.on('mouseleave', 'data-layer-polygon-legacy', () => {
            this.map.getCanvasContainer().style.cursor = '';
        });
        this.map.on('mouseleave', 'data-layer-point', () => {
            this.map.getCanvasContainer().style.cursor = '';
        });
        this.map.on('click', 'data-layer-line-string', (e) => {
            this.showMapPopup(e);
        });
        this.map.on('click', 'data-layer-polygon', (e) => {
            this.showMapPopup(e);
        });
        this.map.on('click', 'data-layer-polygon-legacy', (e) => {
            this.showMapPopup(e);
        });
        this.map.on('click', 'data-layer-point', (e) => {
            this.showMapPopup(e);
        });
        this.map.on('moveend', () => {
            this.updateMap();
        });
        if (this.fly_to) {
            this.map.flyTo({
                center: this.fly_to,
                zoom: 11
            });
            this.fly_to = null;
        }
    }

    updateMap = function () {
        let bounds = this.map.getBounds();
        let geo_params = {
            z: this.map.getZoom(),
            geo: [
                bounds.getWest(),// - (bounds.getEast() - bounds.getWest()),
                bounds.getNorth(),// + (bounds.getNorth() - bounds.getSouth()),
                bounds.getEast(),// + (bounds.getEast() - bounds.getWest()),
                bounds.getSouth()// - (bounds.getNorth() - bounds.getSouth())
            ].join(';')
        };
        if ($('#legacy').is(':checked')) {
            geo_params.fq = JSON.stringify({legacy: 1});
        }
        $.post('/api/search/geo', geo_params, (data) => {
            this.map.getSource('data-source').setData(data.data);
        });
    };
/*

    showMapPopup(e) {
        var title = e.features[0].properties.name;
        if (e.features[0].properties.number)
            title += ' ' + e.features[0].properties.number;
        if (e.features[0].properties.locality)
            title += ', ' + e.features[0].properties.locality.replace('["', '').replace('"]', '');
        html = '<h4>' + title + '</h4>';
        html += '<p class="sd-map-popup-descr">' + ((e.features[0].properties.rgs) ? '<span><i class="fa fa-spinner fa-pulse fa-fw"></i></span>' : e.features[0].properties['paper-count']) + ' Dokumente gefunden</p>';
        html += '<p class="sd-map-popup-button"><button class="form-control" data-type="' + ((e.features[0].properties.rgs) ? 'region' : 'location') + '" data-id="' + e.features[0].properties.id + '" data-title="' + title + '">Für Suche übernehmen</button></p>';
        this.popup = new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(html)
            .addTo(modules.paper_geo.map);
        $('.sd-map-popup-button button').click(function (e) {
            e.preventDefault();
            modules.paper_geo.search_type = $(this).data('type');
            modules.paper_geo.search_id = $(this).data('id');
            modules.paper_geo.popup.remove();
            modules.paper_geo.search();
        });
        if (e.features[0].properties.rgs) {
            var params = this.generate_params();
            params.fq.region = e.features[0].properties.id;
            params.fq = JSON.stringify(params.fq);
            $.post('/api/search', params, function (data) {
                $('.sd-map-popup-descr span').html(data.count);
            });
        }
    }
*/

    showMapPopup (e) {
        let container = document.createElement('div');
        ReactDOM.render(<MapMarkerPaperFragment properties={e.features[0].properties}/>, container);
        this.popup = new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setDOMContent(container)
            .addTo(this.map);
    }


    selectMapItem(type, id) {
        this.params[type] = id;
        this.popup.remove();
        this.updateData();
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